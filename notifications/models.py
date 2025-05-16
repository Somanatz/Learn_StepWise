
from django.db import models
from django.conf import settings
from accounts.models import School # Import School

class Event(models.Model):
    EVENT_TYPES = [
        ('Holiday', 'Holiday'),
        ('Exam', 'Exam'),
        ('Meeting', 'Meeting'),
        ('Activity', 'Activity'),
        ('Deadline', 'Deadline'),
        ('General', 'General'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    date = models.DateField()
    end_date = models.DateField(null=True, blank=True, help_text="Optional: For multi-day events")
    type = models.CharField(max_length=10, choices=EVENT_TYPES, default='General')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_events')
    
    # Target audience for the event
    school = models.ForeignKey(School, on_delete=models.CASCADE, null=True, blank=True, related_name='school_events', help_text="If specific to a school")
    target_class = models.ForeignKey('content.Class', on_delete=models.SET_NULL, null=True, blank=True, related_name='class_events', help_text="If specific to a class")
    # target_role = models.CharField(max_length=10, choices=CustomUser.ROLE_CHOICES, blank=True, null=True) # Could be too broad, consider target_class or school


    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.title} ({self.type}) on {self.date}"

