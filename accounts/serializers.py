
from rest_framework import serializers
from .models import CustomUser, ParentStudentLink, School, StudentProfile, TeacherProfile, ParentProfile
from content.models import Class as ContentClass, Subject as ContentSubject # Avoid naming collision
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction

class SchoolSerializer(serializers.ModelSerializer):
    admin_username = serializers.CharField(write_only=True, required=True)
    admin_email = serializers.EmailField(write_only=True, required=True)
    admin_password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = School
        fields = [
            'id', 'name', 'school_id_code', 'license_number', 'official_email', 
            'phone_number', 'address', 'principal_full_name', 'principal_contact_number', 
            'principal_email', 'admin_user', 
            'admin_username', 'admin_email', 'admin_password'
        ]
        read_only_fields = ['admin_user'] 
        extra_kwargs = {
            'school_id_code': {'validators': []}, 
            'official_email': {'validators': []},
        }

    def validate_admin_password(self, value):
        try:
            validate_password(value) 
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def create(self, validated_data):
        admin_username = validated_data.pop('admin_username')
        admin_email = validated_data.pop('admin_email')
        admin_password = validated_data.pop('admin_password')

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
                is_staff=True 
            )
        except Exception as e: 
            raise serializers.ValidationError({"admin_user_creation": str(e)})

        school = School.objects.create(admin_user=admin_user, **validated_data)
        
        admin_user.school = school 
        admin_user.save()
        
        return school

class StudentProfileSerializer(serializers.ModelSerializer):
    enrolled_class_name = serializers.CharField(source='enrolled_class.name', read_only=True, allow_null=True)
    school_name = serializers.CharField(source='school.name', read_only=True, allow_null=True)
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = '__all__' 
        read_only_fields = ['user']
        extra_kwargs = {
            'school': {'required': False, 'allow_null': True},
            'enrolled_class': {'required': False, 'allow_null': True},
            'profile_picture': {'write_only': True, 'required': False},
        }
    
    def get_profile_picture_url(self, obj):
        request = self.context.get('request')
        if obj.profile_picture and hasattr(obj.profile_picture, 'url'):
            if request is not None:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url # Fallback if no request
        return None


class TeacherProfileSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True, allow_null=True)
    assigned_classes_details = serializers.SerializerMethodField()
    subject_expertise_details = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = TeacherProfile
        fields = '__all__'
        read_only_fields = ['user']
        extra_kwargs = {
            'school': {'required': False, 'allow_null': True},
            'assigned_classes': {'required': False},
            'subject_expertise': {'required': False},
            'profile_picture': {'write_only': True, 'required': False},
        }

    def get_assigned_classes_details(self, obj):
        return [{'id': cls.id, 'name': cls.name} for cls in obj.assigned_classes.all()]

    def get_subject_expertise_details(self, obj):
        return [{'id': sub.id, 'name': sub.name} for sub in obj.subject_expertise.all()]

    def get_profile_picture_url(self, obj):
        request = self.context.get('request')
        if obj.profile_picture and hasattr(obj.profile_picture, 'url'):
            if request is not None:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url # Fallback if no request
        return None


class ParentProfileSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()
    class Meta:
        model = ParentProfile
        fields = '__all__'
        read_only_fields = ['user']
        extra_kwargs = {
            'profile_picture': {'write_only': True, 'required': False},
        }

    def get_profile_picture_url(self, obj):
        request = self.context.get('request')
        if obj.profile_picture and hasattr(obj.profile_picture, 'url'):
            if request is not None:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url # Fallback if no request
        return None

class CustomUserSerializer(serializers.ModelSerializer):
    student_profile = StudentProfileSerializer(read_only=True, context={'request': serializers.CurrentUserDefault()})
    teacher_profile = TeacherProfileSerializer(read_only=True, context={'request': serializers.CurrentUserDefault()})
    parent_profile = ParentProfileSerializer(read_only=True, context={'request': serializers.CurrentUserDefault()})
    school_name = serializers.CharField(source='school.name', read_only=True, allow_null=True)
    school_id = serializers.PrimaryKeyRelatedField(queryset=School.objects.all(), source='school', write_only=True, allow_null=True, required=False)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'role', 'password', 'is_school_admin',
            'school_id', 'school_name', 
            'student_profile', 'teacher_profile', 'parent_profile',
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
        }

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        # Handle profile data within this update or in a separate profile update endpoint
        # For password change:
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        
        # For school update on user (if applicable)
        school = validated_data.pop('school', None) 
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
        valid_roles = [choice[0] for choice in CustomUser.ROLE_CHOICES if choice[0] != 'Admin'] 
        if value not in valid_roles:
            raise serializers.ValidationError(f"Invalid role. Choose from {', '.join(valid_roles)}.")
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role']
        )
        # Create empty profile based on role with profile_completed=False
        if user.role == 'Student':
            StudentProfile.objects.create(user=user, profile_completed=False)
        elif user.role == 'Teacher':
            TeacherProfile.objects.create(user=user, profile_completed=False)
        elif user.role == 'Parent':
            ParentProfile.objects.create(user=user, profile_completed=False)
        return user


class ParentStudentLinkSerializer(serializers.ModelSerializer):
    parent_username = serializers.CharField(source='parent.username', read_only=True)
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_details = StudentProfileSerializer(source='student.student_profile', read_only=True, context={'request': serializers.CurrentUserDefault()})

    class Meta:
        model = ParentStudentLink
        fields = ['id', 'parent', 'student', 'parent_username', 'student_username', 'student_details']
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
    school_id = serializers.PrimaryKeyRelatedField(queryset=School.objects.all(), source='school', write_only=True, allow_null=True, required=False)
    enrolled_class_id = serializers.PrimaryKeyRelatedField(queryset=ContentClass.objects.all(), source='enrolled_class', write_only=True, allow_null=True, required=False)
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = StudentProfile
        fields = [
            'full_name', 'school', 'school_id', 'enrolled_class', 'enrolled_class_id', 'preferred_language', 'father_name', 
            'mother_name', 'place_of_birth', 'date_of_birth', 'blood_group', 
            'needs_assistant_teacher', 'admission_number', 'parent_email_for_linking', 
            'parent_mobile_for_linking', 'parent_occupation', 'hobbies', 'favorite_sports', 
            'interested_in_gardening_farming', 'nickname', 'profile_picture', 'profile_completed'
        ]
        read_only_fields = ['user', 'school', 'enrolled_class'] 

class TeacherProfileCompletionSerializer(serializers.ModelSerializer):
    school_id = serializers.PrimaryKeyRelatedField(queryset=School.objects.all(), source='school', write_only=True, allow_null=True, required=False)
    assigned_classes_ids = serializers.PrimaryKeyRelatedField(
        queryset=ContentClass.objects.all(), source='assigned_classes', many=True, required=False, write_only=True
    )
    subject_expertise_ids = serializers.PrimaryKeyRelatedField(
        queryset=ContentSubject.objects.all(), source='subject_expertise', many=True, required=False, write_only=True
    )
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = TeacherProfile
        fields = [
            'full_name', 'school', 'school_id', 'assigned_classes', 'assigned_classes_ids', 
            'subject_expertise', 'subject_expertise_ids', 'interested_in_tuition', 
            'mobile_number', 'address', 'profile_picture', 'profile_completed'
        ]
        read_only_fields = ['user', 'school', 'assigned_classes', 'subject_expertise']

class ParentProfileCompletionSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    class Meta:
        model = ParentProfile
        fields = ['full_name', 'mobile_number', 'address', 'profile_picture', 'profile_completed']
        read_only_fields = ['user']
