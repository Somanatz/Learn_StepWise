
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser, AllowAny
from .models import Event
from .serializers import EventSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from accounts.models import CustomUser # To check for is_school_admin

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('date')
    serializer_class = EventSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['type', 'date', 'school', 'target_class']
    ordering_fields = ['date', 'type']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only Platform Admins or School Admins (for their school's events) can CUD
            self.permission_classes = [IsAdminUser] # Further logic in perform_create/update for school admin
        else:
            self.permission_classes = [AllowAny]
        return super().get_permissions()

    def perform_create(self, serializer):
        user = self.request.user
        # School admin can only create events for their school
        # Platform admin can create global events or for any school
        school = serializer.validated_data.get('school')
        if user.is_school_admin:
            # A school admin must specify their school or one they manage (if multi-school admin possible)
            # This assumes CustomUser has a `school` FK if they are a school admin.
            # For simplicity, if `user.school` is a thing:
            # if not school or school != user.school:
            #     raise PermissionDenied("School admins can only create events for their own school.")
            # If not, admin must provide school_id and we trust it for now or validate against user's managed schools.
            pass # Add validation if school admin manages specific school(s)
        
        serializer.save(created_by=user)

    def perform_update(self, serializer):
        # Similar permission logic as perform_create for school admins
        user = self.request.user
        event_school = serializer.instance.school
        if user.is_school_admin and event_school:
            # if event_school != user.school: # Assuming user.school link
            #     raise PermissionDenied("School admins can only update events for their own school.")
            pass
        serializer.save(created_by=user) # Keep original creator or update if logic allows
