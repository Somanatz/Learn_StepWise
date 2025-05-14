from rest_framework import viewsets, status
from rest_framework.generics import CreateAPIView
from .models import CustomUser, ParentStudentLink
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
import django_filters.rest_framework
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from .serializers import CustomUserSerializer, UserSignupSerializer, ParentStudentLinkSerializer
from .permissions import IsParent, IsTeacher

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_fields = ['role', 'username', 'email']

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsParent])
    def children(self, request, pk=None):
        # pk here would be the parent's user ID, but we use request.user for security.
        parent_user = request.user
        if parent_user.role != 'Parent':
            return Response({"detail": "Only parents can view their children."}, status=status.HTTP_403_FORBIDDEN)
        
        # Get children linked to this parent
        linked_students = CustomUser.objects.filter(student_links__parent=parent_user)
        serializer = CustomUserSerializer(linked_students, many=True, context={'request': request, 'exclude_children_field': True})
        return Response(serializer.data)

class UserSignupView(CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSignupSerializer
    permission_classes = [AllowAny] # Allow anyone to sign up

class ParentStudentLinkViewSet(viewsets.ModelViewSet): # Changed to ModelViewSet for full CRUD if needed
    queryset = ParentStudentLink.objects.all()
    serializer_class = ParentStudentLinkSerializer
    permission_classes = [IsAuthenticated, IsParent | IsAdminUser] # Parents or Admins can manage links

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == 'Admin': # Admins see all links
            return ParentStudentLink.objects.all()
        if user.role == 'Parent': # Parents see their own links
            return ParentStudentLink.objects.filter(parent=user)
        return ParentStudentLink.objects.none()

    def perform_create(self, serializer):
        # Ensure the parent creating the link is the authenticated user, unless an admin is doing it.
        if self.request.user.role == 'Parent':
            serializer.save(parent=self.request.user)
        elif self.request.user.is_staff or self.request.user.role == 'Admin':
            # Admin can specify parent, or it can be inferred if linking for another parent
            # serializer.save() # Parent ID must be in request data
            # For simplicity, let's assume admin provides parent_id in request.data
            # Validation that parent_id is actually a Parent role user should be in serializer
            serializer.save()
        else:
            # This case should be prevented by permission_classes, but as a safeguard:
            raise PermissionDenied("You do not have permission to create this link.")


# Placeholder actions for teacher functionality (report generation)
# These are illustrative and would typically involve more complex logic and data gathering.
class TeacherActionsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsTeacher | IsAdminUser]

    @action(detail=True, methods=['post'], url_path='send-progress-report') # student_id as pk
    def send_progress_report(self, request, pk=None):
        try:
            student = CustomUser.objects.get(pk=pk, role='Student')
        except CustomUser.DoesNotExist:
            return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # TODO: Gather student progress data (e.g., quiz scores, lesson completion)
        # TODO: Generate report content
        # TODO: Find linked parents for this student via ParentStudentLink
        # TODO: Implement email sending logic
        
        return Response({"message": f"Progress report for student {student.username} sent successfully (placeholder)."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='generate-year-report') # student_id as pk
    def generate_year_report(self, request, pk=None):
        try:
            student = CustomUser.objects.get(pk=pk, role='Student')
        except CustomUser.DoesNotExist:
            return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)
            
        # TODO: Gather all relevant student data for the year report
        # TODO: Generate the report (e.g., PDF, structured data)
        # TODO: Return the report data or a link
        
        return Response({"message": f"End of year report for student {student.username} generated successfully (placeholder)."}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def bulk_upload_users(request): # Renamed for clarity
    # TODO: Process the uploaded file (request.FILES.get('file'))
    # TODO: Validate data (e.g., CSV format, required fields)
    # TODO: Create or update CustomUser records, potentially ParentStudentLink records too.
    # Example: uploaded_file = request.FILES.get('file')
    # if not uploaded_file:
    #     return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({"message": "Bulk user upload received. Processing (placeholder)..."}, status=status.HTTP_200_OK)

```
  </change>
  <change>
    <file>accounts/urls.py</file>
    <content><![CDATA[from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomUserViewSet, UserSignupView, ParentStudentLinkViewSet, TeacherActionsViewSet, bulk_upload_users

router = DefaultRouter()
router.register(r'users', CustomUserViewSet)
router.register(r'parent-student-links', ParentStudentLinkViewSet)
router.register(r'teacher-actions', TeacherActionsViewSet, basename='teacher-actions') # For student-specific actions by teachers

urlpatterns = [
    path('', include(router.urls)),
    path('signup/', UserSignupView.as_view(), name='signup'), # Corrected: .as_view()
    path('bulk-upload-users/', bulk_upload_users, name='bulk-upload-users'),
]
