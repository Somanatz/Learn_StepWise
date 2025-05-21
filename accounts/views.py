
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
    # permission_classes = [permissions.IsAuthenticatedOrReadOnly] 
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_fields = ['name', 'school_id_code']

    def get_permissions(self):
        if self.action == 'create':
            self.permission_classes = [permissions.AllowAny]
        elif self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAdminUser] # Or a custom IsSchoolAdminOfThisSchool
        else: # list, retrieve
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
            self.permission_classes = [IsAdminUser] 
        elif self.action == 'list' or self.action == 'retrieve':
             self.permission_classes = [permissions.IsAuthenticatedOrReadOnly] 
        else: 
            self.permission_classes = [IsAdminUser] # Default to admin for other actions like destroy
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

        # Make a mutable copy of request.data
        profile_data_from_request = request.data.copy()
        
        # Handle CustomUser fields (username, email, password)
        custom_user_update_data = {}
        if 'username' in profile_data_from_request and profile_data_from_request['username'] and profile_data_from_request['username'] != user.username:
            # FormData sends values as list if not a file, take first item
            custom_user_update_data['username'] = profile_data_from_request.pop('username')[0] if isinstance(profile_data_from_request.get('username'), list) else profile_data_from_request.pop('username')
        
        # For email, allow it to be updated even if it becomes an empty string (to clear it)
        if 'email' in profile_data_from_request and profile_data_from_request['email'] != user.email:
            email_val = profile_data_from_request.pop('email')
            custom_user_update_data['email'] = (email_val[0] if isinstance(email_val, list) else email_val) or ""


        if 'password' in profile_data_from_request and profile_data_from_request['password']:
            custom_user_update_data['password'] = profile_data_from_request.pop('password')[0] if isinstance(profile_data_from_request.get('password'), list) else profile_data_from_request.pop('password')
        
        if custom_user_update_data:
            print(f"DEBUG: custom_user_data_dict being sent to CustomUserSerializer: {custom_user_update_data}") # DEBUG
            user_serializer = CustomUserSerializer(user, data=custom_user_update_data, partial=True, context=self.get_serializer_context())
            if user_serializer.is_valid():
                user_serializer.save()
                user.refresh_from_db() 
            else:
                print(f"DEBUG: CustomUserSerializer errors: {user_serializer.errors}") # DEBUG
                return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        profile_serializer_class = None
        profile_instance = None
        
        profile_specific_data = profile_data_from_request 
        if 'profile_picture' in request.FILES:
            profile_specific_data['profile_picture'] = request.FILES['profile_picture']

        if user.role == 'Student':
            profile_serializer_class = StudentProfileCompletionSerializer
            profile_instance, _ = StudentProfile.objects.get_or_create(user=user)
        elif user.role == 'Teacher':
            profile_serializer_class = TeacherProfileCompletionSerializer
            profile_instance, _ = TeacherProfile.objects.get_or_create(user=user)
        elif user.role == 'Parent':
            profile_serializer_class = ParentProfileCompletionSerializer
            profile_instance, _ = ParentProfile.objects.get_or_create(user=user)
        
        if profile_serializer_class and profile_instance:
            if 'profile_completed' not in profile_specific_data and not profile_instance.profile_completed:
                if profile_specific_data.get('full_name'): # Basic check
                     profile_specific_data['profile_completed'] = True
            
            # print(f"DEBUG: Data for {user.role}ProfileCompletionSerializer: {profile_specific_data}") # DEBUG
            profile_serializer = profile_serializer_class(profile_instance, data=profile_specific_data, partial=True, context=self.get_serializer_context())
            if profile_serializer.is_valid():
                profile_serializer.save()
            else:
                # print(f"DEBUG: Profile serializer errors: {profile_serializer.errors}") # DEBUG
                return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        final_user_serializer = CustomUserSerializer(user, context=self.get_serializer_context())
        return Response(final_user_serializer.data, status=status.HTTP_200_OK)


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
        if user.is_staff or user.role == 'Admin': # Platform admin or unassigned school admin
            return ParentStudentLink.objects.all()
        if user.role == 'Parent':
            return ParentStudentLink.objects.filter(parent=user)
        if user.is_school_admin and user.school: # School admin can see links within their school
            students_in_school = CustomUser.objects.filter(school=user.school, role='Student')
            return ParentStudentLink.objects.filter(student__in=students_in_school)
        return ParentStudentLink.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        parent_from_data = serializer.validated_data.get('parent')
        student_from_data = serializer.validated_data.get('student')

        if user.role == 'Parent':
            if parent_from_data != user:
                 raise PermissionDenied("Parents can only link students to their own account.")
            serializer.save(parent=user)
        elif user.is_staff or user.role == 'Admin': # Includes school admins
            if not parent_from_data or not student_from_data:
                raise drf_serializers.ValidationError({"detail": "Parent and Student IDs must be provided by admin."})
            if user.is_school_admin and user.school and student_from_data.school != user.school:
                raise PermissionDenied("School admins can only link students within their own school.")
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
            "message": "Link established successfully." if created else "Link already exists.",
            "student_details": serialized_student_profile 
        }
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(response_data, status=status_code)


class TeacherActionsViewSet(viewsets.ViewSet): 
    permission_classes = [IsAuthenticated, IsTeacher | IsAdminUser]
    @action(detail=False, methods=['get'])
    def my_classes(self, request):
        teacher_profile = getattr(request.user, 'teacher_profile', None)
        if teacher_profile:
            classes = teacher_profile.assigned_classes.all()
            return Response([{'id': c.id, 'name': c.name} for c in classes])
        return Response([])


@api_view(['POST'])
@dec_permission_classes([IsAuthenticated, IsAdminUser]) 
@parser_classes([MultiPartParser, FormParser])
def bulk_upload_users(request):
    return Response({"message": "Bulk user upload received (placeholder)."}, status=status.HTTP_200_OK)

