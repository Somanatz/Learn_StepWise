from rest_framework import viewsets
from rest_framework.generics import CreateAPIView
from .models import CustomUser
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import CustomUserSerializer, UserSignupSerializer

# Create your views here.

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer

class UserSignupView(CreateAPIView):
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    queryset = CustomUser.objects.all()
    serializer_class = UserSignupSerializer
