
from rest_framework import viewsets, status, generics, serializers as drf_serializers
from rest_framework.generics import CreateAPIView
from .models import CustomUser, ParentStudentLink, School, StudentProfile, TeacherProfile, ParentProfile
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
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_fields = ['role', 'username', 'email', 'school'] 
    parser_classes = [MultiPartParser, FormParser] # For profile picture uploads

    def get_permissions(self):
        if self.action == 'me':
            self.permission_classes = [IsAuthenticated]
        elif self.action == 'update_profile':
            self.permission_classes = [IsAuthenticated]
        elif self.action == 'create': # Creating users directly should be admin only
            self.permission_classes = [IsAdminUser]
        elif self.action == 'list' or self.action == 'retrieve':
             self.permission_classes = [IsAuthenticated] 
        else: # Default to admin for other actions like destroy, partial_update
            self.permission_classes = [IsAdminUser]
        return super().get_permissions()

    @action(detail=False, methods=['get'], url_path='me', permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='profile', permission_classes=[IsAuthenticated])
    def update_profile(self, request, pk=None):
        user = self.get_object()
        if user != request.user and not request.user.is_staff: # Staff can edit profiles
            raise PermissionDenied("You can only update your own profile or you lack staff permissions.")

        profile_serializer_class = None
        profile_instance = None
        profile_data = request.data.copy() # Use a mutable copy

        # Handle core CustomUser fields first
        user_fields = {'username', 'email', 'password', 'school_id'} 
        custom_user_data = {k: profile_data.pop(k) for k in user_fields if k in profile_data}
        
        if custom_user_data: # If any user-specific fields are being updated
             # map school_id to school for CustomUserSerializer
            if 'school_id' in custom_user_data and custom_user_data['school_id'] is not None:
                 try:
                    custom_user_data['school'] = School.objects.get(pk=custom_user_data.pop('school_id'))
                 except School.DoesNotExist:
                    return Response({"school_id": "Invalid school ID."}, status=status.HTTP_400_BAD_REQUEST)
            elif 'school_id' in custom_user_data and custom_user_data['school_id'] is None:
                 custom_user_data['school'] = None # Allow unsetting school
                 del custom_user_data['school_id']


            user_serializer = CustomUserSerializer(user, data=custom_user_data, partial=True, context={'request': request})
            if not user_serializer.is_valid():
                return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            user_serializer.save()
            user.refresh_from_db() # Ensure instance is updated for profile serializers


        # Determine which profile serializer to use
        if user.role == 'Student':
            profile_serializer_class = StudentProfileCompletionSerializer
            profile_instance, _ = StudentProfile.objects.get_or_create(user=user)
        elif user.role == 'Teacher':
            profile_serializer_class = TeacherProfileCompletionSerializer
            profile_instance, _ = TeacherProfile.objects.get_or_create(user=user)
        elif user.role == 'Parent':
            profile_serializer_class = ParentProfileCompletionSerializer
            profile_instance, _ = ParentProfile.objects.get_or_create(user=user)
        
        if not profile_serializer_class or not profile_instance:
            # If no profile type, but user data was updated, return success for that
            if custom_user_data:
                 return Response(CustomUserSerializer(user, context={'request': request}).data, status=status.HTTP_200_OK)
            return Response({"error": "Profile type not supported or not found."}, status=status.HTTP_400_BAD_REQUEST)

        # Handle specific field mappings for profiles (e.g., FKs)
        if user.role == 'Student':
            if 'school_id' in profile_data and profile_data['school_id'] is not None:
                profile_data['school'] = profile_data.pop('school_id')
            elif 'school_id' in profile_data and profile_data['school_id'] is None: # Allow unsetting
                profile_data['school'] = None
                del profile_data['school_id']

            if 'enrolled_class_id' in profile_data and profile_data['enrolled_class_id'] is not None:
                profile_data['enrolled_class'] = profile_data.pop('enrolled_class_id')
            elif 'enrolled_class_id' in profile_data and profile_data['enrolled_class_id'] is None:
                profile_data['enrolled_class'] = None
                del profile_data['enrolled_class_id']
        
        if user.role == 'Teacher':
            if 'school_id' in profile_data and profile_data['school_id'] is not None:
                profile_data['school'] = profile_data.pop('school_id')
            elif 'school_id' in profile_data and profile_data['school_id'] is None:
                profile_data['school'] = None
                del profile_data['school_id']

            if 'assigned_classes_ids' in profile_data:
                profile_data['assigned_classes'] = profile_data.pop('assigned_classes_ids')
            if 'subject_expertise_ids' in profile_data:
                profile_data['subject_expertise'] = profile_data.pop('subject_expertise_ids')


        profile_serializer = profile_serializer_class(profile_instance, data=profile_data, partial=True, context={'request': request})
        if profile_serializer.is_valid(raise_exception=True):
            profile_serializer.save()
            return Response(CustomUserSerializer(user, context={'request': request}).data, status=status.HTTP_200_OK)
        
        return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserSignupView(CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSignupSerializer
    permission_classes = [AllowAny]

class ParentStudentLinkViewSet(viewsets.ModelViewSet):
    queryset = ParentStudentLink.objects.all()
    serializer_class = ParentStudentLinkSerializer
    permission_classes = [IsAuthenticated]

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
                school__school_id_code=student_school_id_code,
                parent_email_for_linking=parent_user.email 
            )
            student_user = student_profile.user
        except StudentProfile.DoesNotExist:
            return Response({"error": "Student not found with provided details or parent email mismatch on student record."}, status=status.HTTP_404_NOT_FOUND)
        
        link, created = ParentStudentLink.objects.get_or_create(parent=parent_user, student=student_user)
        if created:
            return Response(ParentStudentLinkSerializer(link, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(ParentStudentLinkSerializer(link, context={'request': request}).data, status=status.HTTP_200_OK)


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
