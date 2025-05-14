from django.db import models
from django.contrib.auth.models import AbstractUser
# Import Class model from content app, ensure no circular dependency
# from content.models import Class # Causes circular import if Class needs CustomUser at import time.
# We can use a string reference 'content.Class' for ForeignKey.

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('Student', 'Student'),
        ('Teacher', 'Teacher'),
        ('Parent', 'Parent'),
        ('Admin', 'Admin'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='Student')    
    
    # Student specific fields
    preferred_language = models.CharField(max_length=10, default='en', blank=True, null=True)
    # Enrolled class could be a ForeignKey, but to avoid circular imports at module load time,
    # and if a student can be enrolled in only one class, this can be handled.
    # For simplicity, if a class model exists in 'content' app:
    # enrolled_class = models.ForeignKey('content.Class', on_delete=models.SET_NULL, null=True, blank=True, related_name='enrolled_students')


    # Teacher specific fields
    subject_expertise = models.CharField(max_length=255, blank=True, null=True) # e.g., "Mathematics, Physics"
    assigned_class = models.ForeignKey('content.Class', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_teacher')

    def __str__(self):
        return self.username


class ParentStudentLink(models.Model):
    parent = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='parent_links', limit_choices_to={'role': 'Parent'})
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='student_links', limit_choices_to={'role': 'Student'})

    class Meta:
        unique_together = ('parent', 'student') # Prevent duplicate links

    def __str__(self):
        return f"{self.parent.username} is parent of {self.student.username}"