
from rest_framework import serializers
from .models import Class, Subject, Lesson, Quiz, Question, Choice, UserLessonProgress, ProcessedNote, Book, UserQuizAttempt

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct']

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=False)

    class Meta:
        model = Question
        fields = ['id', 'text', 'choices']

    def create(self, validated_data):
        choices_data = validated_data.pop('choices')
        question = Question.objects.create(**validated_data)
        for choice_data in choices_data:
            Choice.objects.create(question=question, **choice_data)
        return question

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=False)
    lesson_id = serializers.PrimaryKeyRelatedField(source='lesson', queryset=Lesson.objects.all(), write_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'lesson', 'lesson_id', 'title', 'description', 'questions']
        read_only_fields = ['lesson']

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        quiz = Quiz.objects.create(**validated_data)
        for question_data in questions_data:
            choices_data = question_data.pop('choices', [])
            question = Question.objects.create(quiz=quiz, **question_data)
            for choice_data in choices_data:
                Choice.objects.create(question=question, **choice_data)
        return quiz

class LessonSerializer(serializers.ModelSerializer):
    is_locked = serializers.SerializerMethodField()
    quiz = QuizSerializer(read_only=True, context={'request': serializers.CurrentUserDefault()}) # Pass context
    subject_id = serializers.PrimaryKeyRelatedField(source='subject', queryset=Subject.objects.all())

    class Meta:
        model = Lesson
        fields = [
            'id', 'subject', 'subject_id', 'title', 'content', 'simplified_content', 
            'lesson_order', 'requires_previous_quiz', 'is_locked', 'quiz'
        ]
        read_only_fields = ['subject']

    def get_is_locked(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            if obj.requires_previous_quiz:
                previous_lesson = Lesson.objects.filter(
                    subject=obj.subject, 
                    lesson_order__lt=obj.lesson_order
                ).order_by('-lesson_order').first()

                if previous_lesson and hasattr(previous_lesson, 'quiz'):
                    previous_quiz = previous_lesson.quiz
                    passed_attempt_exists = UserQuizAttempt.objects.filter(
                        user=request.user, 
                        quiz=previous_quiz, 
                        passed=True
                    ).exists()
                    return not passed_attempt_exists
            return False
        return obj.requires_previous_quiz 

class SubjectSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True, context={'request': serializers.CurrentUserDefault()}) # Pass context
    class_obj_id = serializers.PrimaryKeyRelatedField(source='class_obj', queryset=Class.objects.all())

    class Meta:
        model = Subject
        fields = ['id', 'class_obj', 'class_obj_id', 'name', 'description', 'lessons']
        read_only_fields = ['class_obj']


class ClassSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True, context={'request': serializers.CurrentUserDefault()}) # Pass context
    school_name = serializers.CharField(source='school.name', read_only=True, allow_null=True)
    school_id = serializers.PrimaryKeyRelatedField(source='school', queryset=School.objects.all(), allow_null=True, required=False)


    class Meta:
        model = Class
        fields = ['id', 'name', 'description', 'subjects', 'school', 'school_id', 'school_name']
        read_only_fields = ['school']


class UserLessonProgressSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source='user.id')
    lesson_id = serializers.PrimaryKeyRelatedField(queryset=Lesson.objects.all(), source='lesson')

    class Meta:
        model = UserLessonProgress
        fields = ['id', 'user_id', 'lesson', 'lesson_id', 'progress_data', 'last_updated']
        read_only_fields = ['user_id', 'lesson', 'last_updated']

class ProcessedNoteSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source='user.id')
    lesson_id = serializers.PrimaryKeyRelatedField(queryset=Lesson.objects.all(), source='lesson', allow_null=True, required=False)

    class Meta:
        model = ProcessedNote
        fields = ['id', 'user_id', 'lesson', 'lesson_id', 'original_notes', 'processed_output', 'created_at', 'updated_at']
        read_only_fields = ['user_id', 'lesson', 'created_at', 'updated_at', 'processed_output']

class BookSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_obj.name', read_only=True, allow_null=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True, allow_null=True)
    file_url = serializers.SerializerMethodField()
    class_obj_id = serializers.PrimaryKeyRelatedField(queryset=Class.objects.all(), source='class_obj', write_only=True, allow_null=True, required=False)
    subject_id = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), source='subject', write_only=True, allow_null=True, required=False)

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'file', 'file_url', 
            'subject', 'subject_name', 'subject_id',
            'class_obj', 'class_name', 'class_obj_id'
        ]
        read_only_fields = ['subject', 'class_obj']
        extra_kwargs = {'file': {'write_only': True} }

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            if request is not None:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

class UserQuizAttemptSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = UserQuizAttempt
        fields = ['id', 'user', 'user_username', 'quiz', 'quiz_title', 'score', 'completed_at', 'passed']
        read_only_fields = ['user', 'quiz', 'completed_at']

