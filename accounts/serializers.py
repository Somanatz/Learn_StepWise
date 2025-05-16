
from rest_framework import serializers
from .models import CustomUser, ParentStudentLink, School, StudentProfile, TeacherProfile, ParentProfile
from content.models import Class as ContentClass, Subject as ContentSubject # Avoid naming collision
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

class SchoolSerializer(serializers.ModelSerializer):
    admin_username = serializers.CharField(write_only=True, required=True)
    admin_email = serializers.EmailField(write_only=True, required=True)
    admin_password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = School
        fields = [
            'id', 'name', 'school_id_code', 'license_number', 'official_email', 
            'phone_number', 'address', 'principal_full_name', 'principal_contact_number', 
            'principal_email', 'admin_user', # This will be read-only (ID of admin), populated by create
            'admin_username', 'admin_email', 'admin_password' # Write-only for admin creation
        ]
        read_only_fields = ['admin_user'] 
        extra_kwargs = {
            'school_id_code': {'validators': []}, # Remove default unique validator if handled by model
            'official_email': {'validators': []},
        }

    def validate_admin_password(self, value):
        try:
            validate_password(value) # Uses Django's password validators
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def create(self, validated_data):
        admin_username = validated_data.pop('admin_username')
        admin_email = validated_data.pop('admin_email')
        admin_password = validated_data.pop('admin_password')

        # Check for existing user by username or email
        if CustomUser.objects.filter(username=admin_username).exists():
            raise serializers.ValidationError({"admin_username": "An admin user with this username already exists."})
        if CustomUser.objects.filter(email=admin_email).exists():
            raise serializers.ValidationError({"admin_email": "An admin user with this email already exists."})
        
        try:
            admin_user = CustomUser.objects.create_user(
                username=admin_username,
                email=admin_email,
                password=admin_password,
                role='Admin',
                is_school_admin=True,
                is_staff=True # School admins should probably be staff
            )
        except Exception as e: 
            raise serializers.ValidationError({"admin_user_creation": str(e)})

        # Create school and link the admin user
        school = School.objects.create(admin_user=admin_user, **validated_data)
        
        # Also associate the school with the admin user directly
        admin_user.school = school 
        admin_user.save()
        
        return school

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
    school_name = serializers.CharField(source='school.name', read_only=True, allow_null=True)
    school_id = serializers.PrimaryKeyRelatedField(queryset=School.objects.all(), source='school', write_only=True, allow_null=True, required=False)


    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'role', 'password', 'is_school_admin',
            'school_id', 'school_name', # For general school association
            'student_profile', 'teacher_profile', 'parent_profile',
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            # 'role': {'read_only': True}, # Role typically set at signup, but allow update for admins
            # 'is_school_admin': {'read_only': True} # Should be set by platform admin or school reg
        }

    def create(self, validated_data):
        # Profile data needs to be handled separately after user creation
        user = CustomUser.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        
        school = validated_data.pop('school', None) # Handle school update
        if school:
            instance.school = school
        
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

