
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
    permission_classes = [AllowAny] 
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
             self.permission_classes = [IsAuthenticated] 
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
        if user != request.user and not request.user.is_staff:
            raise PermissionDenied("You can only update your own profile or you lack staff permissions.")

        profile_data = request.data.copy()

        # Handle core CustomUser fields first
        user_fields = {'username', 'email', 'password'} 
        custom_user_data = {k: profile_data.pop(k) for k in user_fields if k in profile_data}
        
        if 'school_id' in profile_data: # This 'school_id' might be for the user or their profile
            school_id_for_user = profile_data.pop('school_id', None)
            if school_id_for_user is not None:
                try:
                    custom_user_data['school'] = School.objects.get(pk=school_id_for_user)
                except School.DoesNotExist:
                     # Check if it was meant for profile, if not, it's an error for user
                    if user.role not in ['Student', 'Teacher']: # Only if user direct school link is intended
                        return Response({"school_id": "Invalid school ID for user."}, status=status.HTTP_400_BAD_REQUEST)
            elif school_id_for_user is None:
                 custom_user_data['school'] = None
        
        if custom_user_data:
            user_serializer = CustomUserSerializer(user, data=custom_user_data, partial=True, context=self.get_serializer_context())
            if user_serializer.is_valid():
                user_serializer.save()
                user.refresh_from_db()
            else:
                return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Determine profile serializer and instance
        profile_serializer_class = None
        profile_instance = None
        
        if user.role == 'Student':
            profile_serializer_class = StudentProfileCompletionSerializer
            profile_instance, _ = StudentProfile.objects.get_or_create(user=user)
            if 'school_id' in request.data and request.data['school_id']: # school_id might have been popped for user
                profile_data['school_id'] = request.data['school_id']
            if 'enrolled_class_id' in request.data and request.data['enrolled_class_id']:
                profile_data['enrolled_class_id'] = request.data['enrolled_class_id']

        elif user.role == 'Teacher':
            profile_serializer_class = TeacherProfileCompletionSerializer
            profile_instance, _ = TeacherProfile.objects.get_or_create(user=user)
            if 'school_id' in request.data and request.data['school_id']:
                profile_data['school_id'] = request.data['school_id']
            if 'assigned_classes_ids' in request.data: # Frontend sends _ids
                profile_data['assigned_classes_ids'] = request.data.getlist('assigned_classes_ids')
            if 'subject_expertise_ids' in request.data:
                profile_data['subject_expertise_ids'] = request.data.getlist('subject_expertise_ids')

        elif user.role == 'Parent':
            profile_serializer_class = ParentProfileCompletionSerializer
            profile_instance, _ = ParentProfile.objects.get_or_create(user=user)
        
        if profile_serializer_class and profile_instance:
            # Only pass fields relevant to the specific profile type
            relevant_profile_data = {}
            # For StudentProfileCompletionSerializer
            if user.role == 'Student':
                 student_fields = [f.name for f in StudentProfile._meta.get_fields() if f.name != 'user' and f.name != 'id']
                 student_fields.extend(['school_id', 'enrolled_class_id']) # Add _id fields for writing
                 for field in student_fields:
                    if field in profile_data:
                        relevant_profile_data[field] = profile_data[field]
                    # Handle booleans from FormData (which come as strings 'true'/'false')
                    elif field in ['needs_assistant_teacher', 'interested_in_gardening_farming'] and field in request.data:
                        relevant_profile_data[field] = request.data[field].lower() == 'true'


            # For TeacherProfileCompletionSerializer
            elif user.role == 'Teacher':
                teacher_fields = [f.name for f in TeacherProfile._meta.get_fields() if f.name != 'user' and f.name != 'id']
                teacher_fields.extend(['school_id', 'assigned_classes_ids', 'subject_expertise_ids'])
                for field in teacher_fields:
                    if field in profile_data:
                        relevant_profile_data[field] = profile_data[field]
                    elif field == 'interested_in_tuition' and field in request.data:
                         relevant_profile_data[field] = request.data[field].lower() == 'true'
            
            # For ParentProfileCompletionSerializer
            elif user.role == 'Parent':
                parent_fields = [f.name for f in ParentProfile._meta.get_fields() if f.name != 'user' and f.name != 'id']
                for field in parent_fields:
                    if field in profile_data:
                         relevant_profile_data[field] = profile_data[field]


            if 'profile_picture' in request.FILES:
                 relevant_profile_data['profile_picture'] = request.FILES['profile_picture']
            
            if relevant_profile_data: # Only update if there's data for the profile
                profile_serializer = profile_serializer_class(profile_instance, data=relevant_profile_data, partial=True, context=self.get_serializer_context())
                if profile_serializer.is_valid():
                    profile_serializer.save()
                else:
                    return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Return the updated user with potentially updated profile
        return Response(CustomUserSerializer(user, context=self.get_serializer_context()).data, status=status.HTTP_200_OK)


class UserSignupView(CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSignupSerializer
    permission_classes = [AllowAny]

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
        
        # Return student details for confirmation on frontend
        student_data_for_confirmation = {
            "student_id": student_user.id,
            "student_username": student_user.username,
            "student_full_name": student_profile.full_name,
            "student_email": student_user.email, # Add student email
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

