from rest_framework import serializers
from .models import CustomUser, ParentStudentLink

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email']

class CustomUserSerializer(serializers.ModelSerializer):
    children = StudentSerializer(many=True, read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'password', 'children']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user

    def to_representation(self, instance):
        """Exclude 'children' field if user is not a Parent."""
        representation = super().to_representation(instance)
        if instance.role != CustomUser.ROLE_CHOICES[2][0]: # Assuming 'Parent' is the 3rd role
            representation.pop('children', None)
        return representation


class UserSignupSerializer(CustomUserSerializer):
    class Meta(CustomUserSerializer.Meta):
        extra_kwargs = CustomUserSerializer.Meta.extra_kwargs.copy()
        extra_kwargs['role'] = {'required': False}