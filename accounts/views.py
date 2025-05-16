
from rest_framework import viewsets, status, generics
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
    permission_classes = [AllowAny] # Allow school registration by anyone for now, or restrict to platform admin
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_fields = ['name', 'school_id_code']

    # def perform_create(self, serializer):
        # Optionally link the creating user as a school admin if they are an Admin
        # school = serializer.save()
        # if self.request.user.is_authenticated and self.request.user.role == 'Admin':
        #     self.request.user.is_school_admin = True
        #     self.request.user.school = school # This assumes CustomUser has direct school link for admin
        #     self.request.user.save()


class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_fields = ['role', 'username', 'email'] # Add 'school' if CustomUser.school link exists for filtering

    def get_permissions(self):
        if self.action == 'me' or self.action == 'update_profile':
            self.permission_classes = [IsAuthenticated]
        elif self.action == 'create':
            self.permission_classes = [IsAdminUser]
        elif self.action == 'list' or self.action == 'retrieve':
             self.permission_classes = [IsAuthenticated] # Or more specific
        else:
            self.permission_classes = [IsAdminUser]
        return super().get_permissions()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='me')
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='profile', permission_classes=[IsAuthenticated])
    def update_profile(self, request, pk=None):
        user = self.get_object()
        if user != request.user and not request.user.is_staff:
            raise PermissionDenied("You can only update your own profile.")

        profile_serializer_class = None
        profile_instance = None

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
            return Response({"error": "Profile type not supported or not found."}, status=status.HTTP_400_BAD_REQUEST)

        # Update CustomUser fields (username, email, password if provided)
        user_serializer = CustomUserSerializer(user, data=request.data, partial=True, context={'request': request})
        if user_serializer.is_valid(raise_exception=False): # Don't raise exception yet
            user_serializer.save()
        else: # If core user data has errors, return them
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


        # Update Profile fields
        profile_serializer = profile_serializer_class(profile_instance, data=request.data, partial=True)
        if profile_serializer.is_valid(raise_exception=True):
            profile_serializer.save()
            # Return combined data or just success
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
        # Teachers might see links for students in their class (complex, needs more logic)
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
                raise serializers.ValidationError({"detail": "Parent and Student IDs must be provided by admin."})
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to create this link.")

    # Action for parent to link student via student admission_number and parent_email (on student's profile)
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsParent], url_path='link-child-by-admission')
    def link_child_by_admission(self, request):
        parent_user = request.user
        student_admission_number = request.data.get('admission_number')
        student_school_id_code = request.data.get('school_id_code') # School's unique code

        if not student_admission_number or not student_school_id_code:
            return Response({"error": "Student admission number and school ID code are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student_profile = StudentProfile.objects.get(
                admission_number=student_admission_number,
                school__school_id_code=student_school_id_code,
                parent_email_for_linking=parent_user.email # Verification step
            )
            student_user = student_profile.user
        except StudentProfile.DoesNotExist:
            return Response({"error": "Student not found with provided details or email mismatch."}, status=status.HTTP_404_NOT_FOUND)
        
        link, created = ParentStudentLink.objects.get_or_create(parent=parent_user, student=student_user)
        if created:
            return Response(ParentStudentLinkSerializer(link).data, status=status.HTTP_201_CREATED)
        return Response(ParentStudentLinkSerializer(link).data, status=status.HTTP_200_OK)


class TeacherActionsViewSet(viewsets.ViewSet): # Placeholder
    permission_classes = [IsAuthenticated, IsTeacher | IsAdminUser]
    # ... existing actions ...

# Placeholder for bulk upload
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def bulk_upload_users(request):
    return Response({"message": "Bulk user upload received (placeholder)."}, status=status.HTTP_200_OK)

