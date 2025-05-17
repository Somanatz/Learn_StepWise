
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

# Forward declaration for School model if needed, or ensure it's defined before use
# For simplicity, we'll ensure School is defined before CustomUser uses it as ForeignKey.

class School(models.Model):
    name = models.CharField(max_length=255)
    school_id_code = models.CharField(max_length=100, unique=True, help_text="Unique external ID for the school") # Renamed from school_id
    license_number = models.CharField(max_length=100, blank=True, null=True)
    official_email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    principal_full_name = models.CharField(max_length=255, blank=True, null=True)
    principal_contact_number = models.CharField(max_length=20, blank=True, null=True)
    principal_email = models.EmailField(blank=True, null=True)
    admin_user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='administered_school',
        help_text="The primary admin user for this school, created during registration."
    )

    def __str__(self):
        return self.name

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('Student', 'Student'),
        ('Teacher', 'Teacher'),
        ('Parent', 'Parent'),
        ('Admin', 'Admin'), # Platform Admin or School Admin
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='Student')
    is_school_admin = models.BooleanField(default=False, help_text="Designates if this admin user manages a specific school.")
    school = models.ForeignKey(School, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_and_students')

    def __str__(self):
        return self.username

class StudentProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='student_profile', limit_choices_to={'role': 'Student'})
    full_name = models.CharField(max_length=255, blank=True, null=True)
    school = models.ForeignKey(School, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    enrolled_class = models.ForeignKey('content.Class', on_delete=models.SET_NULL, null=True, blank=True, related_name='enrolled_students')
    preferred_language = models.CharField(max_length=10, default='en', blank=True, null=True)
    father_name = models.CharField(max_length=255, blank=True, null=True)
    mother_name = models.CharField(max_length=255, blank=True, null=True)
    place_of_birth = models.CharField(max_length=100, blank=True, null=True) # Renamed from place
    date_of_birth = models.DateField(null=True, blank=True)
    blood_group = models.CharField(max_length=10, blank=True, null=True)
    needs_assistant_teacher = models.BooleanField(default=False)
    admission_number = models.CharField(max_length=50, blank=True, null=True) # Should be unique within a school context
    parent_email_for_linking = models.EmailField(blank=True, null=True) # Used during student profile completion
    parent_mobile_for_linking = models.CharField(max_length=20, blank=True, null=True)
    hobbies = models.TextField(blank=True, null=True)
    favorite_sports = models.CharField(max_length=255, blank=True, null=True)
    interested_in_gardening_farming = models.BooleanField(default=False)
    
    # Added for profile picture
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)


    class Meta:
        # Ensure admission_number is unique per school. Requires custom validation or a more complex setup.
        # For now, we'll rely on application logic to enforce this uniqueness.
        # unique_together = (('school', 'admission_number'),) # If admission_number cannot be null with school
        pass

    def __str__(self):
        return f"{self.user.username}'s Profile"

class TeacherProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='teacher_profile', limit_choices_to={'role': 'Teacher'})
    full_name = models.CharField(max_length=255, blank=True, null=True)
    school = models.ForeignKey(School, on_delete=models.SET_NULL, null=True, blank=True, related_name='teachers')
    assigned_classes = models.ManyToManyField('content.Class', blank=True, related_name='teachers_assigned') # A teacher can teach multiple classes
    subject_expertise = models.ManyToManyField('content.Subject', blank=True, related_name='expert_teachers') # Subjects a teacher is expert in
    interested_in_tuition = models.BooleanField(default=False)
    mobile_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Teacher Profile"

class ParentProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='parent_profile', limit_choices_to={'role': 'Parent'})
    full_name = models.CharField(max_length=255, blank=True, null=True)
    mobile_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    # child_admission_id for linking will be handled via ParentStudentLink model and application logic.

    def __str__(self):
        return f"{self.user.username}'s Parent Profile"


class ParentStudentLink(models.Model):
    parent = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='parent_links', limit_choices_to={'role': 'Parent'})
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='student_links', limit_choices_to={'role': 'Student'})

    class Meta:
        unique_together = ('parent', 'student')

    def __str__(self):
        return f"{self.parent.username} is parent of {self.student.username}"
