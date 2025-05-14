from django.db import models
from django.conf import settings

class Event(models.Model):
    EVENT_TYPES = [
        ('Holiday', 'Holiday'),
        ('Exam', 'Exam'),
        ('Meeting', 'Meeting'),
        ('Activity', 'Activity'), # e.g. Science Fair
        ('Deadline', 'Deadline'), # e.g. Project Submission
        ('General', 'General'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    date = models.DateField()
    end_date = models.DateField(null=True, blank=True, help_text="Optional: For multi-day events")
    type = models.CharField(max_length=10, choices=EVENT_TYPES, default='General')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_events')
    # Optional: target audience (e.g., specific class, all students)
    # target_class = models.ForeignKey('content.Class', on_delete=models.SET_NULL, null=True, blank=True)
    # target_role = models.CharField(max_length=10, choices=settings.AUTH_USER_MODEL.ROLE_CHOICES, blank=True, null=True)


    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.title} ({self.type}) on {self.date}"
