
from rest_framework import viewsets, status, generics, serializers as drf_serializers, permissions
from rest_framework.generics import CreateAPIView
from .models import CustomUser, ParentStudentLink, School, StudentProfile, TeacherProfile, ParentProfile
from content.models import Class as ContentClass, Subject as ContentSubject, models as content_models # Import models
from rest_framework.decorators import action, api_view, permission_classes as dec_permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
import django_filters.rest_framework
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from .serializers import (
    CustomUserSerializer, UserSignupSerializer, ParentStudentLinkSerializer,
    SchoolSerializer, StudentProfileSerializer, TeacherProfileSerializer, ParentProfileSerializer,
    StudentProfileCompletionSerializer, TeacherProfileCompletionSerializer, ParentProfileCompletionSerializer
)
from .permissions import IsParent, IsTeacher, IsTeacherOrReadOnly
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    # Default permission, will be overridden by get_permissions
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] 
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_fields = ['name', 'school_id_code']

    def get_permissions(self):
        if self.action == 'create':
            # Allow any user to register a new school
            self.permission_classes = [permissions.AllowAny]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Only admins can modify or delete schools
            self.permission_classes = [permissions.IsAdminUser]
        else:
            # For list, retrieve, etc.
            self.permission_classes = [permissions.IsAuthenticatedOrReadOnly]
        return super().get_permissions()


class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all().select_related('student_profile', 'teacher_profile', 'parent_profile', 'school')
    serializer_class = CustomUserSerializer
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_fields = ['role', 'username', 'email', 'school'] 
    parser_classes = [MultiPartParser, FormParser] 

    def get_serializer_context(self):
        return {'request': self.request, **super().get_serializer_context()}

    def get_permissions(self):
        if self.action == 'me':
            self.permission_classes = [IsAuthenticated]
        elif self.action == 'update_profile':
            self.permission_classes = [IsAuthenticated]
        elif self.action == 'create': 
            self.permission_classes = [IsAdminUser] # Only platform admins can create users this way
        elif self.action == 'list' or self.action == 'retrieve':
             self.permission_classes = [permissions.IsAuthenticatedOrReadOnly] 
        else: 
            self.permission_classes = [IsAdminUser]
        return super().get_permissions()

    @action(detail=False, methods=['get'], url_path='me', permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user, context=self.get_serializer_context())
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='profile', permission_classes=[IsAuthenticated])
    def update_profile(self, request, pk=None):
        user = self.get_object()
        if user != request.user and not request.user.is_staff: # is_staff for platform admin
            # School admins should not edit profiles directly here unless it's their own or specific logic is added
            # For now, only user can edit their own profile, or platform admin.
            raise PermissionDenied("You can only update your own profile or you lack staff permissions.")

        profile_data = request.data.copy() # Use copy for mutable data

        # Handle core CustomUser fields first if present
        user_fields = {'username', 'email', 'password'} 
        custom_user_data_dict = {}
        for field in user_fields:
            if field in profile_data and profile_data[field]: # Check if field is actually in request
                custom_user_data_dict[field] = profile_data.pop(field)
        
        # Handle school_id specifically for CustomUser's direct school link (e.g. Teacher, School Admin)
        # This field is NOT for the StudentProfile's school, that's handled by the profile serializer
        if 'school_id' in profile_data and user.role != 'Student': # School admins or Teachers link directly to school
            school_id_for_user = profile_data.pop('school_id', None)
            if school_id_for_user is not None and school_id_for_user != '':
                try:
                    custom_user_data_dict['school'] = School.objects.get(pk=int(school_id_for_user))
                except (School.DoesNotExist, ValueError):
                     return Response({"school_id": "Invalid school ID for user."}, status=status.HTTP_400_BAD_REQUEST)
            elif school_id_for_user == '': # Allow unsetting the school
                 custom_user_data_dict['school'] = None
        
        if custom_user_data_dict:
            user_serializer = CustomUserSerializer(user, data=custom_user_data_dict, partial=True, context=self.get_serializer_context())
            if user_serializer.is_valid():
                user_serializer.save()
                user.refresh_from_db() 
            else:
                return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Determine profile serializer and instance
        profile_serializer_class = None
        profile_instance = None
        profile_specific_data = {} # Data specifically for the profile model

        if user.role == 'Student':
            profile_serializer_class = StudentProfileCompletionSerializer
            profile_instance, _ = StudentProfile.objects.get_or_create(user=user)
            profile_specific_data_keys = [f.name for f in StudentProfile._meta.get_fields() if f.name not in ['id', 'user']]
            profile_specific_data_keys.extend(['school_id', 'enrolled_class_id']) # For write-only fields in serializer

        elif user.role == 'Teacher':
            profile_serializer_class = TeacherProfileCompletionSerializer
            profile_instance, _ = TeacherProfile.objects.get_or_create(user=user)
            profile_specific_data_keys = [f.name for f in TeacherProfile._meta.get_fields() if f.name not in ['id', 'user']]
            profile_specific_data_keys.extend(['school_id', 'assigned_classes_ids', 'subject_expertise_ids'])

        elif user.role == 'Parent':
            profile_serializer_class = ParentProfileCompletionSerializer
            profile_instance, _ = ParentProfile.objects.get_or_create(user=user)
            profile_specific_data_keys = [f.name for f in ParentProfile._meta.get_fields() if f.name not in ['id', 'user']]
        
        if profile_serializer_class and profile_instance:
            # Populate profile_specific_data from the remaining request_data
            for key in profile_specific_data_keys:
                if key in profile_data: # Check if the key from model fields exists in request data
                    # Handle BooleanFields correctly from FormData
                    field_instance = None
                    try:
                        field_instance = profile_instance._meta.get_field(key)
                    except Exception:
                        pass # key might be a write_only serializer field like 'school_id'

                    if isinstance(field_instance, content_models.BooleanField): # or models.BooleanField
                         profile_specific_data[key] = str(profile_data[key]).lower() in ['true', '1', 'on']
                    elif key.endswith('_ids') and isinstance(request.data, type(request.data)): # M2M fields from frontend using getlist (common with FormData)
                        if key in request.data: # Check if it was actually sent
                            profile_specific_data[key] = request.data.getlist(key)
                    elif profile_data[key] is not None and profile_data[key] != '': # For other fields
                        profile_specific_data[key] = profile_data[key]
                    elif profile_data[key] == '': # Allow explicitly setting text fields to empty
                        if isinstance(field_instance, (content_models.CharField, content_models.TextField, content_models.EmailField)):
                             profile_specific_data[key] = ''
                        else: # For other types like FKs, empty string might mean null
                            profile_specific_data[key] = None


                elif key == 'profile_picture' and key in request.FILES: # For profile_picture ImageField
                     profile_specific_data[key] = request.FILES[key]
            
            # Auto-set profile_completed if critical fields are present
            if 'profile_completed' not in profile_specific_data:
                if (user.role == 'Student' and profile_specific_data.get('full_name') and profile_specific_data.get('school_id') and profile_specific_data.get('enrolled_class_id') and profile_specific_data.get('admission_number')) or \
                   (user.role == 'Teacher' and profile_specific_data.get('full_name') and profile_specific_data.get('school_id')) or \
                   (user.role == 'Parent' and profile_specific_data.get('full_name')):
                    profile_specific_data['profile_completed'] = True
                elif 'profile_completed' in profile_data: # if sent explicitly
                    profile_specific_data['profile_completed'] = str(profile_data['profile_completed']).lower() in ['true', '1', 'on']


            if profile_specific_data: 
                profile_serializer = profile_serializer_class(profile_instance, data=profile_specific_data, partial=True, context=self.get_serializer_context())
                if profile_serializer.is_valid():
                    profile_serializer.save()
                else:
                    # Ensure user serializer errors (if any) are not overwritten by profile errors
                    # If user_serializer had errors, they would have been returned already.
                    return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Return the full user data after all updates
        return Response(CustomUserSerializer(user, context=self.get_serializer_context()).data, status=status.HTTP_200_OK)


class UserSignupView(CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSignupSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser] # Added to handle profile_picture on signup


class ParentStudentLinkViewSet(viewsets.ModelViewSet):
    queryset = ParentStudentLink.objects.all()
    serializer_class = ParentStudentLinkSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request, **super().get_serializer_context()}

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == 'Admin':
            return ParentStudentLink.objects.all()
        if user.role == 'Parent':
            return ParentStudentLink.objects.filter(parent=user)
        return ParentStudentLink.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        parent_from_data = serializer.validated_data.get('parent')
        student_from_data = serializer.validated_data.get('student')

        if user.role == 'Parent':
            if parent_from_data != user:
                 raise PermissionDenied("Parents can only link students to their own account.")
            serializer.save(parent=user)
        elif user.is_staff or user.role == 'Admin':
            if not parent_from_data or not student_from_data:
                raise drf_serializers.ValidationError({"detail": "Parent and Student IDs must be provided by admin."})
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to create this link.")

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsParent], url_path='link-child-by-admission')
    def link_child_by_admission(self, request):
        parent_user = request.user
        student_admission_number = request.data.get('admission_number')
        student_school_id_code = request.data.get('school_id_code') 

        if not student_admission_number or not student_school_id_code:
            return Response({"error": "Student admission number and school ID code are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student_profile = StudentProfile.objects.get(
                admission_number=student_admission_number,
                school__school_id_code=student_school_id_code # Query through school's school_id_code
            )
            if student_profile.parent_email_for_linking != parent_user.email:
                 return Response({"error": "Parent email on student record does not match your email. Verification failed."}, status=status.HTTP_403_FORBIDDEN)

            student_user = student_profile.user
        except StudentProfile.DoesNotExist:
            return Response({"error": "Student not found with provided details."}, status=status.HTTP_404_NOT_FOUND)
        
        link, created = ParentStudentLink.objects.get_or_create(parent=parent_user, student=student_user)
        
        # Use the serializer to return consistent student profile data
        serialized_student_profile = StudentProfileSerializer(student_profile, context={'request': request}).data

        response_data = {
            "link_id": link.id,
            "message": "Link established." if created else "Link already exists.",
            "student_details": serialized_student_profile # Include full student profile
        }
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(response_data, status=status_code)


class TeacherActionsViewSet(viewsets.ViewSet): 
    permission_classes = [IsAuthenticated, IsTeacher | IsAdminUser]
    # ... (Placeholder for teacher-specific actions like bulk grading, etc.)


@api_view(['POST'])
@dec_permission_classes([IsAuthenticated, IsAdminUser]) 
@parser_classes([MultiPartParser, FormParser])
def bulk_upload_users(request):
    # Implement bulk user upload logic here (e.g., from CSV/Excel)
    # This is a placeholder
    return Response({"message": "Bulk user upload received (placeholder)."}, status=status.HTTP_200_OK)
