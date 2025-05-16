
from django.db import models, JSONField
from django.conf import settings
# Import School model from accounts app
from accounts.models import School # Ensure accounts is in INSTALLED_APPS and School is defined

class Class(models.Model):
    school = models.ForeignKey(School, related_name='classes', on_delete=models.CASCADE, null=True, blank=True) # Link Class to a School
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.school.name if self.school else 'No School'})"

class Subject(models.Model):
    class_obj = models.ForeignKey(Class, related_name='subjects', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.class_obj.name})"

class Lesson(models.Model):
    subject = models.ForeignKey(Subject, related_name='lessons', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    content = models.TextField()
    simplified_content = models.TextField(blank=True, null=True)
    lesson_order = models.PositiveIntegerField(default=0)
    requires_previous_quiz = models.BooleanField(default=False)

    class Meta:
        ordering = ['lesson_order']

    def __str__(self):
        return f"{self.title} ({self.subject.name})"

class Quiz(models.Model):
    lesson = models.OneToOneField(Lesson, related_name='quiz', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Quiz for {self.lesson.title}"

class Question(models.Model):
    quiz = models.ForeignKey(Quiz, related_name='questions', on_delete=models.CASCADE)
    text = models.TextField()

    def __str__(self):
        return self.text[:50] + '...'

class Choice(models.Model):
    question = models.ForeignKey(Question, related_name='choices', on_delete=models.CASCADE)
    text = models.CharField(max_length=200)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text

class UserQuizAttempt(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='user_attempts')
    score = models.FloatField(default=0.0)
    completed_at = models.DateTimeField(auto_now_add=True)
    passed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username}'s attempt on {self.quiz.title}"

class UserLessonProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='user_progress')
    progress_data = models.JSONField(blank=True, null=True)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'lesson')

    def __str__(self):
        return f"{self.user.username}'s progress in {self.lesson.title}"

class ProcessedNote(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='processed_notes')
    lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, related_name='processed_notes', null=True, blank=True)
    original_notes = models.TextField() # Renamed
    processed_output = models.TextField(blank=True, null=True) # Renamed
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Note from {self.user.username} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"

class Book(models.Model):
    class_obj = models.ForeignKey(Class, related_name='books', on_delete=models.CASCADE, null=True, blank=True)
    subject = models.ForeignKey(Subject, related_name='books', on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True, null=True)
    file = models.FileField(upload_to='books/')

    def __str__(self):
        return self.title

