
from rest_framework import viewsets, status, generics, serializers as drf_serializers
from rest_framework.generics import CreateAPIView
from .models import CustomUser, ParentStudentLink, School, StudentProfile, TeacherProfile, ParentProfile
from content.models import Class as ContentClass, Subject as ContentSubject # Import models
from rest_framework.decorators import action, api_view, permission_classes
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
from rest_framework.exceptions import PermissionDenied, NotFound


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] 
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_fields = ['name', 'school_id_code']


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
            self.permission_classes = [IsAdminUser]
        elif self.action == 'list' or self.action == 'retrieve':
             self.permission_classes = [IsAuthenticatedOrReadOnly] # Allow list for some cases (e.g. school admin view)
        else: 
            self.permission_classes = [IsAdminUser]
        return super().get_permissions()

    @action(detail=False, methods=['get'], url_path='me', permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='profile', permission_classes=[IsAuthenticated])
    def update_profile(self, request, pk=None):
        user = self.get_object()
        if user != request.user and not request.user.is_staff: # Staff can edit any profile
            raise PermissionDenied("You can only update your own profile or you lack staff permissions.")

        profile_data = request.data.copy()

        # Handle core CustomUser fields first if present
        user_fields = {'username', 'email', 'password'} 
        custom_user_data = {k: profile_data.pop(k) for k in user_fields if k in profile_data and profile_data[k]}
        
        if 'school_id' in profile_data:
            school_id_for_user = profile_data.pop('school_id', None)
            if school_id_for_user is not None and school_id_for_user != '':
                try:
                    custom_user_data['school'] = School.objects.get(pk=school_id_for_user)
                except School.DoesNotExist:
                    if user.role not in ['Student', 'Teacher']:
                        return Response({"school_id": "Invalid school ID for user."}, status=status.HTTP_400_BAD_REQUEST)
            elif school_id_for_user == '': # Explicitly setting to null
                 custom_user_data['school'] = None
        
        if custom_user_data:
            user_serializer = CustomUserSerializer(user, data=custom_user_data, partial=True, context=self.get_serializer_context())
            if user_serializer.is_valid():
                user_serializer.save()
                user.refresh_from_db() # Refresh user instance after save
            else:
                return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Determine profile serializer and instance
        profile_serializer_class = None
        profile_instance = None
        
        if user.role == 'Student':
            profile_serializer_class = StudentProfileCompletionSerializer
            profile_instance, _ = StudentProfile.objects.get_or_create(user=user)
            # If school_id was meant for profile and not user, re-add it to profile_data
            if 'school_id' in request.data and request.data.get('school_id'):
                profile_data['school_id'] = request.data['school_id']
            if 'enrolled_class_id' in request.data and request.data.get('enrolled_class_id'):
                profile_data['enrolled_class_id'] = request.data['enrolled_class_id']

        elif user.role == 'Teacher':
            profile_serializer_class = TeacherProfileCompletionSerializer
            profile_instance, _ = TeacherProfile.objects.get_or_create(user=user)
            if 'school_id' in request.data and request.data.get('school_id'):
                profile_data['school_id'] = request.data['school_id']
            if 'assigned_classes_ids' in request.data:
                profile_data['assigned_classes_ids'] = request.data.getlist('assigned_classes_ids')
            if 'subject_expertise_ids' in request.data:
                profile_data['subject_expertise_ids'] = request.data.getlist('subject_expertise_ids')

        elif user.role == 'Parent':
            profile_serializer_class = ParentProfileCompletionSerializer
            profile_instance, _ = ParentProfile.objects.get_or_create(user=user)
        
        if profile_serializer_class and profile_instance:
            # Create a dictionary with only the fields present in the request for the profile
            relevant_profile_data = {}
            profile_model_fields = [f.name for f in profile_instance._meta.get_fields()]
            
            # Add _id fields for ForeignKey/ManyToManyField writes
            if user.role == 'Student':
                profile_model_fields.extend(['school_id', 'enrolled_class_id'])
            elif user.role == 'Teacher':
                profile_model_fields.extend(['school_id', 'assigned_classes_ids', 'subject_expertise_ids'])

            for field_name in profile_model_fields:
                if field_name in profile_data:
                    if isinstance(profile_instance._meta.get_field(field_name), models.BooleanField):
                         relevant_profile_data[field_name] = str(profile_data[field_name]).lower() == 'true'
                    elif field_name.endswith('_ids'): # M2M fields from frontend
                         relevant_profile_data[field_name] = profile_data.getlist(field_name)
                    elif profile_data[field_name] is not None and profile_data[field_name] != '':
                        relevant_profile_data[field_name] = profile_data[field_name]
                elif field_name in request.FILES: # For profile_picture
                     relevant_profile_data[field_name] = request.FILES[field_name]
            
            # Ensure profile_completed is set to True if critical fields are present
            # This logic might be better in the serializer's save method or as a signal
            if relevant_profile_data: # Only update if there's data for the profile
                # If critical fields are being updated, mark profile as completed
                if relevant_profile_data.get('full_name'): # Example: if full_name is key
                    relevant_profile_data['profile_completed'] = True

                profile_serializer = profile_serializer_class(profile_instance, data=relevant_profile_data, partial=True, context=self.get_serializer_context())
                if profile_serializer.is_valid():
                    profile_serializer.save()
                else:
                    return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(CustomUserSerializer(user, context=self.get_serializer_context()).data, status=status.HTTP_200_OK)


class UserSignupView(CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSignupSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser] # Added to handle potential future direct profile picture on signup


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
                school__school_id_code=student_school_id_code
            )
            # Verification step: Check parent_email_for_linking
            if student_profile.parent_email_for_linking != parent_user.email:
                 return Response({"error": "Parent email on student record does not match your email. Verification failed."}, status=status.HTTP_403_FORBIDDEN)

            student_user = student_profile.user
        except StudentProfile.DoesNotExist:
            return Response({"error": "Student not found with provided details."}, status=status.HTTP_404_NOT_FOUND)
        
        link, created = ParentStudentLink.objects.get_or_create(parent=parent_user, student=student_user)
        
        student_data_for_confirmation = {
            "student_id": student_user.id,
            "student_username": student_user.username,
            "student_full_name": student_profile.full_name,
            "student_email": student_user.email,
            "enrolled_class_name": student_profile.enrolled_class.name if student_profile.enrolled_class else "N/A",
            "link_id": link.id,
            "message": "Link established." if created else "Link already exists."
        }
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(student_data_for_confirmation, status=status_code)


class TeacherActionsViewSet(viewsets.ViewSet): 
    permission_classes = [IsAuthenticated, IsTeacher | IsAdminUser]
    # ... (Placeholder for teacher-specific actions like bulk grading, etc.)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser]) 
@parser_classes([MultiPartParser, FormParser])
def bulk_upload_users(request):
    # Implement bulk user upload logic here (e.g., from CSV/Excel)
    # This is a placeholder
    return Response({"message": "Bulk user upload received (placeholder)."}, status=status.HTTP_200_OK)
