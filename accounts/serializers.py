
from rest_framework import serializers
from .models import CustomUser, ParentStudentLink, School, StudentProfile, TeacherProfile, ParentProfile
from content.models import Class as ContentClass, Subject as ContentSubject # Avoid naming collision

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'
        # Ensure school_id_code is writeable and unique, official_email too.
        extra_kwargs = {
            'school_id_code': {'validators': []}, # Remove default unique validator if handled by model
            'official_email': {'validators': []},
        }

class StudentProfileSerializer(serializers.ModelSerializer):
    # enrolled_class_id = serializers.PrimaryKeyRelatedField(queryset=ContentClass.objects.all(), source='enrolled_class', allow_null=True, required=False)
    # school_id = serializers.PrimaryKeyRelatedField(queryset=School.objects.all(), source='school', allow_null=True, required=False)

    class Meta:
        model = StudentProfile
        exclude = ['user'] # User will be set implicitly

class TeacherProfileSerializer(serializers.ModelSerializer):
    # school_id = serializers.PrimaryKeyRelatedField(queryset=School.objects.all(), source='school', allow_null=True, required=False)
    # assigned_classes_ids = serializers.PrimaryKeyRelatedField(queryset=ContentClass.objects.all(), source='assigned_classes', many=True, required=False)
    # subject_expertise_ids = serializers.PrimaryKeyRelatedField(queryset=ContentSubject.objects.all(), source='subject_expertise', many=True, required=False)

    class Meta:
        model = TeacherProfile
        exclude = ['user']

class ParentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParentProfile
        exclude = ['user']

class CustomUserSerializer(serializers.ModelSerializer):
    student_profile = StudentProfileSerializer(read_only=True)
    teacher_profile = TeacherProfileSerializer(read_only=True)
    parent_profile = ParentProfileSerializer(read_only=True)
    # school_name = serializers.CharField(source='school.name', read_only=True, allow_null=True)
    # school_id = serializers.PrimaryKeyRelatedField(queryset=School.objects.all(), source='school', write_only=True, allow_null=True, required=False)


    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'role', 'password', 'is_school_admin',
            # 'school_id', 'school_name', # For general school association
            'student_profile', 'teacher_profile', 'parent_profile',
            # Legacy fields that were on CustomUser directly, now in profiles, so remove from here if exclusively in profiles
            # 'preferred_language', 'subject_expertise', 'assigned_class_id', 'assigned_class_name', 'children'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'role': {'read_only': True}, # Role typically set at signup
            'is_school_admin': {'read_only': True} # Should be set by platform admin
        }

    def create(self, validated_data):
        # Profile data needs to be handled separately after user creation
        user = CustomUser.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        
        # Handle nested profile updates if profile data is passed
        # Example for student_profile (adapt for teacher/parent)
        # student_profile_data = validated_data.pop('student_profile', None)
        # if student_profile_data and hasattr(instance, 'student_profile'):
        #     profile_serializer = StudentProfileSerializer(instance.student_profile, data=student_profile_data, partial=True)
        #     if profile_serializer.is_valid(raise_exception=True):
        #         profile_serializer.save()
        
        return super().update(instance, validated_data)


class UserSignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': True},
            'role': {'required': True}
        }

    def validate_role(self, value):
        valid_roles = [choice[0] for choice in CustomUser.ROLE_CHOICES if choice[0] != 'Admin'] # Prevent self-signup as Admin
        if value not in valid_roles:
            raise serializers.ValidationError(f"Invalid role. Choose from {', '.join(valid_roles)}.")
        return value
    
    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role']
        )
        # Create empty profiles
        if user.role == 'Student':
            StudentProfile.objects.create(user=user)
        elif user.role == 'Teacher':
            TeacherProfile.objects.create(user=user)
        elif user.role == 'Parent':
            ParentProfile.objects.create(user=user)
        return user


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
        parent = data.get('parent')
        student = data.get('student')
        if parent and parent.role != 'Parent':
            raise serializers.ValidationError({"parent": "Selected user is not a Parent."})
        if student and student.role != 'Student':
            raise serializers.ValidationError({"student": "Selected user is not a Student."})
        return data

# Serializers for Profile Completion
class StudentProfileCompletionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = '__all__'
        read_only_fields = ['user']

class TeacherProfileCompletionSerializer(serializers.ModelSerializer):
    assigned_classes = serializers.PrimaryKeyRelatedField(
        queryset=ContentClass.objects.all(), many=True, required=False
    )
    subject_expertise = serializers.PrimaryKeyRelatedField(
        queryset=ContentSubject.objects.all(), many=True, required=False
    )
    class Meta:
        model = TeacherProfile
        fields = '__all__'
        read_only_fields = ['user']


class ParentProfileCompletionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParentProfile
        fields = '__all__'
        read_only_fields = ['user']

