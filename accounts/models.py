from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('Student', 'Student'),
        ('Teacher', 'Teacher'),
        ('Parent', 'Parent'),
        ('Admin', 'Admin'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='Student')    
    
    # Note: The ManyToManyField is defined later using the 'through' model ParentStudentLink

    def __str__(self):
        return self.username


class ParentStudentLink(models.Model):
    parent = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='parent_links', limit_choices_to={'role': 'Parent'})
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='student_links', limit_choices_to={'role': 'Student'})

    class Meta:
        unique_together = ('parent', 'student') # Prevent duplicate links

    def __str__(self):
        return f"{self.parent.username} is parent of {self.student.username}"