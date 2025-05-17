
from rest_framework import serializers
from .models import Class, Subject, Lesson, Quiz, Question, Choice, UserLessonProgress, ProcessedNote, Book, UserQuizAttempt
from accounts.models import School # Import School model

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct']
        # For creating choices under a question, 'question' field is not needed in request body
        extra_kwargs = {'question': {'required': False, 'allow_null': True}}


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, required=True) # For creation, choices are required

    class Meta:
        model = Question
        fields = ['id', 'text', 'choices']
        extra_kwargs = {'quiz': {'required': False, 'allow_null': True}}


    def create(self, validated_data):
        choices_data = validated_data.pop('choices')
        question = Question.objects.create(**validated_data)
        for choice_data in choices_data:
            Choice.objects.create(question=question, **choice_data)
        return question

    def update(self, instance, validated_data):
        choices_data = validated_data.pop('choices', None)
        instance = super().update(instance, validated_data)

        if choices_data is not None:
            # Simple approach: clear existing and add new. More complex merging logic could be implemented.
            instance.choices.all().delete()
            for choice_data in choices_data:
                Choice.objects.create(question=instance, **choice_data)
        return instance


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, required=False) # Optional for creation/update from quiz level
    lesson_id = serializers.PrimaryKeyRelatedField(source='lesson', queryset=Lesson.objects.all(), write_only=True, required=False)

    class Meta:
        model = Quiz
        fields = ['id', 'lesson', 'lesson_id', 'title', 'description', 'pass_mark_percentage', 'questions']
        read_only_fields = ['lesson'] # Lesson is set via lesson_id or directly by LessonSerializer

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        quiz = Quiz.objects.create(**validated_data)
        for question_data in questions_data:
            choices_data = question_data.pop('choices', []) # Pop choices from question_data
            question = Question.objects.create(quiz=quiz, **question_data)
            for choice_data in choices_data:
                Choice.objects.create(question=question, **choice_data)
        return quiz
    
    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)
        instance = super().update(instance, validated_data)

        if questions_data is not None:
            # Simple approach: clear existing and add new questions.
            instance.questions.all().delete()
            for question_data in questions_data:
                choices_data = question_data.pop('choices', [])
                question = Question.objects.create(quiz=instance, **question_data)
                for choice_data in choices_data:
                    Choice.objects.create(question=question, **choice_data)
        return instance


class LessonSerializer(serializers.ModelSerializer):
    is_locked = serializers.SerializerMethodField()
    quiz = QuizSerializer(read_only=True, context={'request': serializers.CurrentUserDefault()}) 
    subject_id = serializers.PrimaryKeyRelatedField(source='subject', queryset=Subject.objects.all(), write_only=True) # Changed for write
    subject_name = serializers.CharField(source='subject.name', read_only=True)


    class Meta:
        model = Lesson
        fields = [
            'id', 'subject', 'subject_id', 'subject_name', 'title', 'content', 'video_url', 'audio_url', 'image_url',
            'simplified_content', 'lesson_order', 'requires_previous_quiz', 'is_locked', 'quiz'
        ]
        read_only_fields = ['subject']

    def get_is_locked(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            # For unauthenticated users, or if locking logic is complex, default to not locked or based on requires_previous_quiz
            return obj.requires_previous_quiz # Or False if content should be generally accessible
        
        user = request.user
        if user.role == 'Teacher' or user.is_staff: # Teachers/staff bypass locking
             return False

        if obj.requires_previous_quiz:
            previous_lesson = Lesson.objects.filter(
                subject=obj.subject, 
                lesson_order__lt=obj.lesson_order
            ).order_by('-lesson_order').first()

            if previous_lesson and hasattr(previous_lesson, 'quiz'):
                previous_quiz = previous_lesson.quiz
                # Check if the user has passed the previous quiz
                passed_attempt_exists = UserQuizAttempt.objects.filter(
                    user=user, 
                    quiz=previous_quiz, 
                    passed=True
                ).exists()
                return not passed_attempt_exists # Locked if no passed attempt
            # If previous lesson has no quiz but requires_previous_quiz is true on current, it's effectively locked by missing prerequisite
            elif previous_lesson: 
                return True 
        return False # Not locked


class SubjectSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True, context={'request': serializers.CurrentUserDefault()}) 
    class_obj_id = serializers.PrimaryKeyRelatedField(source='class_obj', queryset=Class.objects.all(), write_only=True) # Changed for write
    class_obj_name = serializers.CharField(source='class_obj.name', read_only=True)


    class Meta:
        model = Subject
        fields = ['id', 'class_obj', 'class_obj_id', 'class_obj_name', 'name', 'description', 'lessons']
        read_only_fields = ['class_obj']


class ClassSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True, context={'request': serializers.CurrentUserDefault()}) 
    school_name = serializers.CharField(source='school.name', read_only=True, allow_null=True)
    school_id = serializers.PrimaryKeyRelatedField(source='school', queryset=School.objects.all(), allow_null=True, required=False, write_only=True) # Changed for write

    class Meta:
        model = Class
        fields = ['id', 'name', 'description', 'subjects', 'school', 'school_id', 'school_name']
        read_only_fields = ['school']


class UserLessonProgressSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source='user.id')
    lesson_id = serializers.PrimaryKeyRelatedField(queryset=Lesson.objects.all(), source='lesson', write_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)

    class Meta:
        model = UserLessonProgress
        fields = ['id', 'user_id', 'lesson', 'lesson_id', 'lesson_title', 'completed', 'progress_data', 'last_updated']
        read_only_fields = ['user_id', 'lesson', 'last_updated']

class ProcessedNoteSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source='user.id')
    lesson_id = serializers.PrimaryKeyRelatedField(queryset=Lesson.objects.all(), source='lesson', allow_null=True, required=False, write_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True, allow_null=True)

    class Meta:
        model = ProcessedNote
        fields = ['id', 'user_id', 'lesson', 'lesson_id', 'lesson_title', 'original_notes', 'processed_output', 'created_at', 'updated_at']
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
        read_only_fields = ['subject', 'class_obj'] # IDs are for write
        extra_kwargs = {'file': {'write_only': True} } # File itself is write-only, url is read-only

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            if request is not None:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

class UserQuizAttemptSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    lesson_title = serializers.CharField(source='quiz.lesson.title', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    answers = serializers.JSONField(required=True, write_only=True) # Expect answers on submission

    class Meta:
        model = UserQuizAttempt
        fields = ['id', 'user', 'user_username', 'quiz', 'quiz_title', 'lesson_title', 'score', 'completed_at', 'passed', 'answers']
        read_only_fields = ['user', 'quiz', 'completed_at', 'score', 'passed'] # Score & passed set by backend
        # 'answers' is write-only here for submission, backend can store it if needed for review

    def create(self, validated_data):
        # Logic for calculating score based on answers happens in QuizViewSet.submit_quiz
        # This serializer is for creating the attempt record *after* scoring.
        # Or, if answers are submitted here, the view needs to handle scoring before saving.
        # For simplicity, view handles scoring.
        return super().create(validated_data)

