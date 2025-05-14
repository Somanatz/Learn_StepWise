from django.db import models

class Event(models.Model):
    EVENT_TYPES = [
        ('Holiday', 'Holiday'),
        ('Event', 'Event'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    date = models.DateField()
    type = models.CharField(max_length=10, choices=EVENT_TYPES, default='Event')

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.title} on {self.date}"