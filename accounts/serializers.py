from rest_framework import serializers
from .models import CustomUser, ParentStudentLink

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'preferred_language'] # Add other student fields if needed

class CustomUserSerializer(serializers.ModelSerializer):
    children = StudentSerializer(many=True, read_only=True, source='student_links') # Adjust source if needed based on ParentStudentLink
    assigned_class_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser._meta.get_field('assigned_class').related_model.objects.all(),  # Dynamically get queryset
        source='assigned_class',
        write_only=True,
        allow_null=True,
        required=False
    )
    assigned_class_name = serializers.CharField(source='assigned_class.name', read_only=True, allow_null=True)


    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'role', 'password', 
            'preferred_language', 'subject_expertise', 
            'assigned_class_id', 'assigned_class_name', # Use assigned_class_id for writing, assigned_class_name for reading
            'children'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}, # Not required for updates
            'role': {'read_only': True}, # Role should ideally be set at signup and not easily changed
            'preferred_language': {'required': False, 'allow_null': True},
            'subject_expertise': {'required': False, 'allow_null': True},
        }

    def create(self, validated_data):
        # Role should be part of validated_data from UserSignupSerializer
        user = CustomUser.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        # Handle password separately if it's being updated
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        
        # Handle assigned_class (it's already handled by source='assigned_class' with PrimaryKeyRelatedField)
        # assigned_class_data = validated_data.pop('assigned_class', None)
        # if assigned_class_data is not None:
        #     instance.assigned_class = assigned_class_data

        return super().update(instance, validated_data)

    def to_representation(self, instance):
        """Exclude 'children' field if user is not a Parent. Conditionally show role-specific fields."""
        representation = super().to_representation(instance)
        if instance.role != 'Parent':
            representation.pop('children', None)
        
        if instance.role != 'Student':
            representation.pop('preferred_language', None)
        
        if instance.role != 'Teacher':
            representation.pop('subject_expertise', None)
            representation.pop('assigned_class_id', None) # Should not be needed in output if assigned_class_name is there
            representation.pop('assigned_class_name', None)

        # Ensure assigned_class_id is not in output if assigned_class_name is present
        if 'assigned_class_name' in representation and representation['assigned_class_name'] is not None:
            representation.pop('assigned_class_id', None)


        return representation


class UserSignupSerializer(CustomUserSerializer):
    class Meta(CustomUserSerializer.Meta):
        fields = ['id', 'username', 'email', 'role', 'password'] # Explicitly list fields for signup
        extra_kwargs = {
            'password': {'write_only': True, 'required': True},
            'role': {'required': True} # Role is required for signup
        }
    
    def validate_role(self, value):
        # Ensure the role provided is one of the valid choices
        valid_roles = [choice[0] for choice in CustomUser.ROLE_CHOICES]
        if value not in valid_roles:
            raise serializers.ValidationError(f"Invalid role. Choose from {', '.join(valid_roles)}.")
        return value

class ParentStudentLinkSerializer(serializers.ModelSerializer):
    parent_username = serializers.CharField(source='parent.username', read_only=True)
    student_username = serializers.CharField(source='student.username', read_only=True)

    class Meta:
        model = ParentStudentLink
        fields = ['id', 'parent', 'student', 'parent_username', 'student_username']
        extra_kwargs = {
            'parent': {'queryset': CustomUser.objects.filter(role='Parent')},
            'student': {'queryset': CustomUser.objects.filter(role='Student')},
        }
    
    def validate(self, data):
        # Ensure parent is actually a Parent and student is a Student
        parent = data.get('parent')
        student = data.get('student')

        if parent and parent.role != 'Parent':
            raise serializers.ValidationError({"parent": "Selected user is not a Parent."})
        if student and student.role != 'Student':
            raise serializers.ValidationError({"student": "Selected user is not a Student."})
        
        return data