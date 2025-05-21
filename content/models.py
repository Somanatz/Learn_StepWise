
from django.db import models, JSONField
from django.conf import settings
from accounts.models import School 

class Class(models.Model):
    school = models.ForeignKey(School, related_name='classes', on_delete=models.CASCADE, null=True, blank=True) 
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['name'] # Default ordering by name

    def __str__(self):
        return f"{self.name} ({self.school.name if self.school else 'No School'})"

class Subject(models.Model):
    class_obj = models.ForeignKey(Class, related_name='subjects', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['name'] # Added default ordering

    def __str__(self):
        return f"{self.name} ({self.class_obj.name})"

class Lesson(models.Model):
    subject = models.ForeignKey(Subject, related_name='lessons', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    content = models.TextField() # Rich text content, could be Markdown or HTML
    video_url = models.URLField(blank=True, null=True)
    audio_url = models.URLField(blank=True, null=True)
    image_url = models.URLField(blank=True, null=True) # Or use ImageField
    simplified_content = models.TextField(blank=True, null=True)
    lesson_order = models.PositiveIntegerField(default=0)
    requires_previous_quiz = models.BooleanField(default=False, help_text="If true, student must pass the quiz of the previous lesson in order to access this one.")

    class Meta:
        ordering = ['lesson_order']

    def __str__(self):
        return f"{self.title} ({self.subject.name})"

class Quiz(models.Model):
    lesson = models.OneToOneField(Lesson, related_name='quiz', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    pass_mark_percentage = models.FloatField(default=70.0, help_text="Percentage required to pass this quiz.")


    class Meta:
        ordering = ['title'] # Added default ordering

    def __str__(self):
        return f"Quiz for {self.lesson.title}"

class Question(models.Model):
    quiz = models.ForeignKey(Quiz, related_name='questions', on_delete=models.CASCADE)
    text = models.TextField()
    # Add question_type if supporting more than MCQ, e.g., 'MCQ', 'TrueFalse', 'ShortAnswer'
    # question_type = models.CharField(max_length=20, default='MCQ')

    class Meta:
        ordering = ['id'] # Added default ordering (by creation order)

    def __str__(self):
        return self.text[:50] + '...'

class Choice(models.Model):
    question = models.ForeignKey(Question, related_name='choices', on_delete=models.CASCADE)
    text = models.CharField(max_length=200)
    is_correct = models.BooleanField(default=False)

    class Meta:
        ordering = ['id'] # Added default ordering

    def __str__(self):
        return self.text

class UserQuizAttempt(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='user_attempts')
    score = models.FloatField(default=0.0, help_text="Score as a percentage (0-100).")
    answers = models.JSONField(blank=True, null=True, help_text="Stores the user's answers for each question.") # E.g. [{"question_id": 1, "choice_id": 3}, ...]
    completed_at = models.DateTimeField(auto_now_add=True)
    passed = models.BooleanField(default=False)

    class Meta:
        ordering = ['-completed_at'] # Most recent attempts first

    def __str__(self):
        return f"{self.user.username}'s attempt on {self.quiz.title}"

class UserLessonProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='user_progress')
    completed = models.BooleanField(default=False)
    progress_data = models.JSONField(blank=True, null=True, help_text="Stores specific progress within a lesson, e.g., last video timestamp, scroll position.")
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'lesson')
        ordering = ['user', 'lesson'] # Added default ordering

    def __str__(self):
        return f"{self.user.username}'s progress in {self.lesson.title}"

class ProcessedNote(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='processed_notes')
    lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, related_name='processed_notes', null=True, blank=True)
    original_notes = models.TextField() 
    processed_output = models.TextField(blank=True, null=True) 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at'] # Most recent notes first

    def __str__(self):
        return f"Note from {self.user.username} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"

class Book(models.Model):
    class_obj = models.ForeignKey(Class, related_name='books', on_delete=models.CASCADE, null=True, blank=True)
    subject = models.ForeignKey(Subject, related_name='books', on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True, null=True)
    file = models.FileField(upload_to='books/')

    class Meta:
        ordering = ['title'] # Added default ordering

    def __str__(self):
        return self.title
