from django.db import models
from django.conf import settings

class Class(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Subject(models.Model):
    class_obj = models.ForeignKey(Class, related_name='subjects', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.class_obj.name})"

class Lesson(models.Model):
    subject = models.ForeignKey(Subject, related_name='lessons', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    content = models.TextField() # This can be expanded to handle different content types
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
    # You can add a 'question_type' field here if you plan to have different types of questions (e.g., True/False, Fill in the Blank)

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
    score = models.FloatField(default=0.0) # Store the score as a float
    completed_at = models.DateTimeField(auto_now_add=True)
    passed = models.BooleanField(default=False) # To indicate if the user passed the quiz

    def __str__(self):
        return f"{self.user.username}'s attempt on {self.quiz.title}"

class UserLessonProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='user_progress')
    # You can use a more complex field type like JSONField if needed for detailed progress
    progress_data = models.TextField(blank=True, null=True) 
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s progress in {self.lesson.title}"

class ProcessedNote(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='processed_notes')
    lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, related_name='processed_notes', null=True, blank=True) # Optional link to a lesson
    original_text = models.TextField()
    processed_text = models.TextField(blank=True, null=True) # Store the output from the AI model
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Note from {self.user.username} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"