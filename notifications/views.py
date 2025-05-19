
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser, AllowAny, IsAuthenticated
from .models import Event
from .serializers import EventSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from accounts.models import CustomUser # To check for is_school_admin
from rest_framework.exceptions import PermissionDenied

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().select_related('school', 'target_class', 'created_by').order_by('date')
    serializer_class = EventSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['type', 'date', 'school', 'target_class']
    ordering_fields = ['date', 'type']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only Platform Admins or School Admins (for their school's events) can CUD
            self.permission_classes = [IsAuthenticated, IsAdminUser] # Further logic in perform_create/update for school admin
        else:
            # Anyone can view events, even unauthenticated users for a public calendar display
            self.permission_classes = [AllowAny] 
        return super().get_permissions()

    def perform_create(self, serializer):
        user = self.request.user
        school_for_event = serializer.validated_data.get('school')
        
        if not user.is_staff and not user.is_school_admin: # Platform admin (is_staff) can create any event
             raise PermissionDenied("You do not have permission to create events.")

        if user.is_school_admin:
            # School admin can only create events for their own school.
            # The user.school field links the admin to their school.
            if not school_for_event or school_for_event != user.school:
                raise PermissionDenied("School admins can only create events for their own school.")
        
        serializer.save(created_by=user)

    def perform_update(self, serializer):
        user = self.request.user
        event_school = serializer.instance.school

        if not user.is_staff and not user.is_school_admin:
             raise PermissionDenied("You do not have permission to update this event.")

        if user.is_school_admin:
            # School admin can only update events for their own school.
            if event_school != user.school:
                raise PermissionDenied("School admins can only update events for their own school.")
            # Also ensure they are not changing the school of an event they manage
            new_school = serializer.validated_data.get('school', event_school)
            if new_school != user.school:
                 raise PermissionDenied("School admins cannot change the school of an event to a different school.")
                 
        serializer.save(created_by=serializer.instance.created_by) # Keep original creator

    def perform_destroy(self, instance):
        user = self.request.user
        if not user.is_staff and not user.is_school_admin:
            raise PermissionDenied("You do not have permission to delete this event.")
        if user.is_school_admin and instance.school != user.school:
            raise PermissionDenied("School admins can only delete events for their own school.")
        instance.delete()

