from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser
from .models import Event
from .serializers import EventSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('date')
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] # Default: anyone can read
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['type', 'date']
    ordering_fields = ['date', 'type']


    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only Admins can create, update, or delete events
            self.permission_classes = [IsAdminUser]
        else:
            # Anyone (even unauthenticated users, if desired for a public calendar) can list/retrieve
            self.permission_classes = [AllowAny] # Or IsAuthenticatedOrReadOnly
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
