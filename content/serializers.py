from rest_framework import serializers
from .models import Class, Subject, Lesson, Quiz, Question, Choice, UserLessonProgress, ProcessedNote

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct']

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'choices']

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'questions']

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['id', 'title', 'content', 'lesson_order', 'is_locked']

class SubjectSerializer(serializers.ModelSerializer):  # Fix: Ensure ClassSerializer has proper indentation after SubjectSerializer
    lessons = LessonSerializer(many=True, read_only=True)
    class Meta:
        model = Subject
        fields = ['id', 'name', 'description', 'lessons']

class ClassSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)

    class Meta:
        model = Class
        fields = ['id', 'name', 'description', 'subjects']

class UserLessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserLessonProgress
        fields = ['id', 'user', 'lesson', 'progress_data']

class ProcessedNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessedNote
        fields = ['id', 'user', 'lesson', 'original_notes', 'processed_output', 'timestamp']
        read_only_fields = ['user', 'timestamp', 'processed_output']