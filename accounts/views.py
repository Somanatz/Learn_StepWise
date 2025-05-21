
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
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] 
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_fields = ['name', 'school_id_code']

    def get_permissions(self):
        if self.action == 'create':
            self.permission_classes = [permissions.AllowAny]
        elif self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAdminUser]
        else:
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
        if user != request.user and not request.user.is_staff: 
            raise PermissionDenied("You can only update your own profile or you lack staff permissions.")

        profile_data = request.data.copy() 

        user_fields = {'username', 'email', 'password'} 
        custom_user_data_dict = {}
        for field in user_fields:
            if field in profile_data and profile_data[field]: 
                custom_user_data_dict[field] = profile_data.pop(field)
        
        if 'school_id' in profile_data and user.role != 'Student': 
            school_id_for_user = profile_data.pop('school_id', None)
            if school_id_for_user is not None and school_id_for_user != '':
                try:
                    custom_user_data_dict['school'] = School.objects.get(pk=int(school_id_for_user))
                except (School.DoesNotExist, ValueError):
                     return Response({"school_id": "Invalid school ID for user."}, status=status.HTTP_400_BAD_REQUEST)
            elif school_id_for_user == '': 
                 custom_user_data_dict['school'] = None
        
        if custom_user_data_dict:
            user_serializer = CustomUserSerializer(user, data=custom_user_data_dict, partial=True, context=self.get_serializer_context())
            if user_serializer.is_valid():
                user_serializer.save()
                user.refresh_from_db() 
            else:
                return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        profile_serializer_class = None
        profile_instance = None
        profile_specific_data = {} 

        if user.role == 'Student':
            profile_serializer_class = StudentProfileCompletionSerializer
            profile_instance, _ = StudentProfile.objects.get_or_create(user=user)
            profile_specific_data_keys = [f.name for f in StudentProfile._meta.get_fields() if f.name not in ['id', 'user']]
            profile_specific_data_keys.extend(['school_id', 'enrolled_class_id']) 

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
            for key in profile_specific_data_keys:
                if key in profile_data: 
                    field_instance = None
                    try:
                        field_instance = profile_instance._meta.get_field(key)
                    except Exception:
                        pass 

                    if isinstance(field_instance, content_models.BooleanField): 
                         profile_specific_data[key] = str(profile_data[key]).lower() in ['true', '1', 'on']
                    elif key.endswith('_ids') and isinstance(request.data, type(request.data)): 
                        if key in request.data: 
                            profile_specific_data[key] = request.data.getlist(key)
                    elif profile_data[key] is not None and profile_data[key] != '': 
                        profile_specific_data[key] = profile_data[key]
                    elif profile_data[key] == '': 
                        if isinstance(field_instance, (content_models.CharField, content_models.TextField, content_models.EmailField)):
                             profile_specific_data[key] = ''
                        else: 
                            profile_specific_data[key] = None


                elif key == 'profile_picture' and key in request.FILES: 
                     profile_specific_data[key] = request.FILES[key]
            
            if 'profile_completed' not in profile_specific_data:
                critical_fields_present = False
                if user.role == 'Student':
                    full_name = profile_specific_data.get('full_name', profile_instance.full_name)
                    school_id = profile_specific_data.get('school_id', profile_instance.school_id)
                    enrolled_class_id = profile_specific_data.get('enrolled_class_id', profile_instance.enrolled_class_id)
                    admission_number = profile_specific_data.get('admission_number', profile_instance.admission_number)
                    if full_name and school_id and enrolled_class_id and admission_number:
                        critical_fields_present = True
                elif user.role == 'Teacher':
                    full_name = profile_specific_data.get('full_name', profile_instance.full_name)
                    school_id = profile_specific_data.get('school_id', profile_instance.school_id)
                    if full_name and school_id:
                        critical_fields_present = True
                elif user.role == 'Parent':
                    full_name = profile_specific_data.get('full_name', profile_instance.full_name)
                    if full_name: # For parent, full name might be enough to consider profile "started"
                        critical_fields_present = True
                
                if critical_fields_present:
                     profile_specific_data['profile_completed'] = True
                elif 'profile_completed' in profile_data: 
                    profile_specific_data['profile_completed'] = str(profile_data['profile_completed']).lower() in ['true', '1', 'on']


            if profile_specific_data: 
                profile_serializer = profile_serializer_class(profile_instance, data=profile_specific_data, partial=True, context=self.get_serializer_context())
                if profile_serializer.is_valid():
                    profile_serializer.save()
                else:
                    return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(CustomUserSerializer(user, context=self.get_serializer_context()).data, status=status.HTTP_200_OK)


class UserSignupView(CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSignupSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser] 


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
            if student_profile.parent_email_for_linking != parent_user.email:
                 return Response({"error": "Parent email on student record does not match your email. Verification failed."}, status=status.HTTP_403_FORBIDDEN)

            student_user = student_profile.user
        except StudentProfile.DoesNotExist:
            return Response({"error": "Student not found with provided details. Please check the admission number and school ID code carefully."}, status=status.HTTP_404_NOT_FOUND)
        
        link, created = ParentStudentLink.objects.get_or_create(parent=parent_user, student=student_user)
        
        serialized_student_profile = StudentProfileSerializer(student_profile, context={'request': request}).data

        response_data = {
            "link_id": link.id,
            "message": "Link established." if created else "Link already exists.",
            "student_details": serialized_student_profile 
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
    return Response({"message": "Bulk user upload received (placeholder)."}, status=status.HTTP_200_OK)
