from rest_framework import serializers
from .models import Class, Subject, Lesson, Quiz, Question, Choice, UserLessonProgress, ProcessedNote, Book

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
    # Add a field to indicate if the lesson is locked for the current user
    is_locked = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'content', 'simplified_content', 'lesson_order', 'requires_previous_quiz', 'is_locked']

    def get_is_locked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # If lesson requires a previous quiz
            if obj.requires_previous_quiz:
                # Find the previous lesson in the same subject
                previous_lesson = Lesson.objects.filter(
                    subject=obj.subject, 
                    lesson_order__lt=obj.lesson_order
                ).order_by('-lesson_order').first()

                if previous_lesson and hasattr(previous_lesson, 'quiz'):
                    previous_quiz = previous_lesson.quiz
                    # Check if the user has a passing attempt for the previous quiz
                    # Assuming UserQuizAttempt has a 'passed' boolean field or score threshold logic
                    passed_attempt_exists = UserQuizAttempt.objects.filter(
                        user=request.user, 
                        quiz=previous_quiz, 
                        passed=True # Or score >= pass_threshold
                    ).exists()
                    return not passed_attempt_exists # Locked if no passing attempt
            return False # Not locked if no previous quiz requirement or not applicable
        return obj.requires_previous_quiz # Default for unauthenticated or if no specific logic hit

class SubjectSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True, context={'request': 'request'})
    class Meta:
        model = Subject
        fields = ['id', 'name', 'description', 'lessons']
    
    def get_lessons(self, obj):
        # Pass request to LessonSerializer context
        lessons = obj.lessons.all()
        request = self.context.get('request')
        return LessonSerializer(lessons, many=True, context={'request': request}).data


class ClassSerializer(serializers.ModelSerializer):
    subjects = serializers.SerializerMethodField()

    class Meta:
        model = Class
        fields = ['id', 'name', 'description', 'subjects']

    def get_subjects(self, obj):
        # Pass request to SubjectSerializer context
        subjects = obj.subjects.all()
        request = self.context.get('request')
        return SubjectSerializer(subjects, many=True, context={'request': request}).data

class UserLessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserLessonProgress
        fields = ['id', 'user', 'lesson', 'progress_data']

class ProcessedNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessedNote
        # Ensure all fields are correctly mapped from your ProcessedNote model
        fields = ['id', 'user', 'lesson', 'original_notes', 'processed_output', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at', 'processed_output']


class BookSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_obj.name', read_only=True, allow_null=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True, allow_null=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'file', 'file_url', 'subject', 'subject_name', 'class_obj', 'class_name']
        extra_kwargs = {
            'file': {'write_only': True} # File itself is write-only, URL is for reading
        }

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            if request is not None:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
