from rest_framework import viewsets, status
from rest_framework.generics import CreateAPIView
from .models import CustomUser, ParentStudentLink
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
import django_filters.rest_framework
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from .serializers import CustomUserSerializer, UserSignupSerializer, ParentStudentLinkSerializer
from .permissions import IsParent, IsTeacher, IsTeacherOrReadOnly # Ensure IsTeacherOrReadOnly is defined or remove if not used elsewhere for CustomUserViewSet
from rest_framework.exceptions import PermissionDenied


class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    # permission_classes = [IsAuthenticated] # More granular permissions might be needed
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_fields = ['role', 'username', 'email']

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == 'me' or self.action == 'update' or self.action == 'partial_update':
            self.permission_classes = [IsAuthenticated]
        elif self.action == 'create': # Signup is handled by UserSignupView
            self.permission_classes = [IsAdminUser] # Only admins can create users directly here
        elif self.action == 'list' or self.action == 'retrieve':
             self.permission_classes = [IsAuthenticated] # Or more specific like IsAdminUser / IsTeacher
        else:
            self.permission_classes = [IsAdminUser] # Default to admin for other actions
        return super().get_permissions()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='me')
    def me(self, request):
        """Retrieve details of the currently authenticated user."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    # PUT /api/users/me/ (or PATCH) - Update current user
    # Handled by default update/partial_update if pk is 'me', or override:
    def update(self, request, *args, **kwargs):
        if kwargs.get('pk') == 'me':
            instance = request.user
            serializer = self.get_serializer(instance, data=request.data, partial=False)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if kwargs.get('pk') == 'me':
            instance = request.user
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        return super().partial_update(request, *args, **kwargs)


    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsParent])
    def children(self, request, pk=None):
        parent_user = request.user # Only parent can see their own children for now
        if parent_user.role != 'Parent':
            return Response({"detail": "Only parents can view their children."}, status=status.HTTP_403_FORBIDDEN)
        
        linked_students = CustomUser.objects.filter(student_links__parent=parent_user)
        serializer = StudentSerializer(linked_students, many=True, context={'request': request})
        return Response(serializer.data)

class UserSignupView(CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSignupSerializer
    permission_classes = [AllowAny]

class ParentStudentLinkViewSet(viewsets.ModelViewSet):
    queryset = ParentStudentLink.objects.all()
    serializer_class = ParentStudentLinkSerializer
    permission_classes = [IsAuthenticated] # Further checks in methods

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == 'Admin':
            return ParentStudentLink.objects.all()
        if user.role == 'Parent':
            return ParentStudentLink.objects.filter(parent=user)
        if user.role == 'Teacher': # Teachers might see links for students in their class
            # This logic can be complex, for now, teachers don't see these directly via this queryset
            return ParentStudentLink.objects.none() 
        return ParentStudentLink.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        parent_from_data = serializer.validated_data.get('parent')

        if user.role == 'Parent':
            # Parent can only create links for themselves
            if parent_from_data != user:
                 raise PermissionDenied("Parents can only link students to their own account.")
            serializer.save(parent=user)
        elif user.is_staff or user.role == 'Admin':
            # Admin can create links for any parent, parent must be provided in request
            if not parent_from_data:
                raise serializers.ValidationError({"parent": "Parent ID must be provided by admin."})
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to create this link.")


class TeacherActionsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsTeacher | IsAdminUser] # Or IsTeacher

    @action(detail=True, methods=['post'], url_path='send-progress-report') # student_id as pk
    def send_progress_report(self, request, pk=None): # pk is student_id
        try:
            student = CustomUser.objects.get(pk=pk, role='Student')
        except CustomUser.DoesNotExist:
            return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # TODO: Gather student progress, find linked parents, send email/message
        return Response({"message": f"Progress report for {student.username} sent (placeholder)."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='generate-year-report') # student_id as pk
    def generate_year_report(self, request, pk=None): # pk is student_id
        try:
            student = CustomUser.objects.get(pk=pk, role='Student')
        except CustomUser.DoesNotExist:
            return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)
            
        # TODO: Gather all data, generate report
        return Response({"message": f"End of year report for {student.username} generated (placeholder)."}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser]) # Or IsTeacher if teachers can bulk upload
@parser_classes([MultiPartParser, FormParser])
def bulk_upload_users(request):
    # TODO: Implement bulk user upload logic
    return Response({"message": "Bulk user upload received (placeholder)."}, status=status.HTTP_200_OK)

# In accounts/views.py, ensure CustomUserViewSet handles /api/users/me/ for GET, PUT, PATCH for profile:
# GET /api/users/me/ - Retrieve current user (already exists with @action)
# PUT /api/users/me/ - Update current user
# PATCH /api/users/me/ - Partially update current user

# To enable PUT/PATCH on /api/users/me/ using the existing ViewSet structure,
# you typically wouldn't add new actions. Instead, the standard update/partial_update methods
# of the ModelViewSet would be used, but you need a way to target the current user
# without specifying their ID in the URL if you want to use /api/users/me/ literally.
# The @action for 'me' handles GET. For PUT/PATCH on 'me', you'd typically
# expect the client to send request to /api/users/{user_id}/.
# If you strictly want PUT/PATCH on /api/users/me/, it requires a bit more custom routing or handling.

# A common approach:
# The client fetches user ID from /api/users/me/ (GET).
# Then uses that ID for PUT/PATCH requests: /api/users/{user_id}/.
# The ModelViewSet's standard update/partial_update methods will work.
# Permissions within those methods should ensure users can only update themselves (unless admin).

# For example, in CustomUserViewSet, you could add a permission check to perform_update:
# def perform_update(self, serializer):
# if serializer.instance != self.request.user and not self.request.user.is_staff:
# raise PermissionDenied("You can only update your own profile.")
# serializer.save()

# Or, override update/partial_update to fetch instance = request.user if pk == 'me'
# (This is a bit non-standard for DRF ModelViewSets but possible)
# The current implementation with if kwargs.get('pk') == 'me': in update/partial_update achieves this.
# Make sure your CustomUserViewSet is registered in urls.py to handle a 'me' pk,
# or that the frontend uses the actual user ID after fetching it.
# The current URL registration `router.register(r'users', CustomUserViewSet)` allows /api/users/{pk}/.
# So frontend should fetch user ID from /api/users/me then use /api/users/{id}/ for updates.
# The `update` and `partial_update` methods added above handle the 'me' case.
# This means the frontend *can* literally use PUT/PATCH to /api/users/me/
# (though the router usually expects an ID for detail routes).
# Let's refine the URL part for `me` to be more robust if needed.
# The existing setup in `accounts/urls.py` and the `CustomUserViewSet` will allow:
# - GET /api/users/me/ (custom action)
# - PUT /api/users/{user.id}/ (standard update - serializer needs to handle what can be updated)
# - PATCH /api/users/{user.id}/ (standard partial_update)

# If we want PUT/PATCH /api/users/me/ to work, the URL config needs to be aware of 'me'
# as a special PK or we map it explicitly. The current `update` methods handle it if 'me' is passed as pk.
# This should work if the router can map 'me' as a pk. If not, a separate path for profile update is cleaner.
# For now, let's assume frontend uses /api/users/{id}/ for PUT/PATCH after getting id from /users/me.
# The `update` and `partial_update` overrides in the ViewSet for `pk=='me'` are a good way to handle this
# if the frontend is indeed calling `/api/users/me/` with PUT/PATCH.

```