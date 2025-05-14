from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Class, Subject, Lesson, Quiz, Question, Choice, UserLessonProgress, UserQuizAttempt, Book
from accounts.models import CustomUser 
from .serializers import ( 
    ProcessedNoteSerializer, ClassSerializer, SubjectSerializer, LessonSerializer, BookSerializer, 
    UserLessonProgressSerializer, QuizSerializer, QuestionSerializer, ChoiceSerializer, UserQuizAttemptSerializer
)
from accounts.permissions import IsTeacher, IsTeacherOrReadOnly, IsStudent
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser, AllowAny, IsAuthenticated
from .models import ProcessedNote 
from django_filters.rest_framework import DjangoFilterBackend 
from django.http import JsonResponse 
from django.db.models import Q, Exists, OuterRef
from django.utils import timezone 

class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [IsTeacherOrReadOnly]

    def get_serializer_context(self):
        return {'request': self.request, **super().get_serializer_context()}

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['class_obj']

    def get_serializer_context(self):
        return {'request': self.request, **super().get_serializer_context()}

class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [IsTeacherOrReadOnly] # ReadOnly for students, full for teachers
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['subject', 'subject__class_obj']

    def get_queryset(self):
        # Queryset remains simple, is_locked logic is in serializer based on request.user
        return Lesson.objects.all().order_by('subject__class_obj__id', 'subject__id', 'lesson_order')

    def get_serializer_context(self):
        return {'request': self.request, **super().get_serializer_context()}

    # Teachers can simplify content:
    @action(detail=True, methods=['post'], permission_classes=[IsTeacher])
    def simplify_content(self, request, pk=None):
        lesson = self.get_object()
        # In a real scenario, call an AI service here
        # For now, let's mock it or use a simple transformation
        if lesson.content:
            lesson.simplified_content = "Simplified: " + lesson.content[:100] + "..." # Mock simplification
            lesson.save()
            return Response(LessonSerializer(lesson, context=self.get_serializer_context()).data)
        return Response({"error": "Lesson content is empty."}, status=status.HTTP_400_BAD_REQUEST)


class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['lesson', 'lesson__subject']

    def get_serializer_context(self):
        return {'request': self.request, **super().get_serializer_context()}

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsStudent]) # Only students submit
    def submit_quiz(self, request, pk=None):
        quiz = self.get_object()
        answers_data = request.data.get('answers', []) # e.g., [{"question_id": 1, "choice_id": 3}]
        user = request.user
        
        correct_answers_count = 0
        total_questions_in_quiz = quiz.questions.count()

        if total_questions_in_quiz == 0:
            return Response({"message": "This quiz has no questions."}, status=status.HTTP_400_BAD_REQUEST)

        for answer_data in answers_data:
            question_id = answer_data.get('question_id')
            selected_choice_id = answer_data.get('choice_id')

            try:
                question = Question.objects.get(id=question_id, quiz=quiz)
                selected_choice = Choice.objects.get(id=selected_choice_id, question=question)
                if selected_choice.is_correct:
                    correct_answers_count += 1
            except Question.DoesNotExist:
                return Response({"error": f"Question {question_id} not found in this quiz."}, status=status.HTTP_400_BAD_REQUEST)
            except Choice.DoesNotExist:
                return Response({"error": f"Choice {selected_choice_id} not found for question {question_id}."}, status=status.HTTP_400_BAD_REQUEST)
        
        score_percentage = (correct_answers_count / total_questions_in_quiz) * 100 if total_questions_in_quiz > 0 else 0
        
        PASSING_THRESHOLD = 70 
        passed = score_percentage >= PASSING_THRESHOLD

        attempt = UserQuizAttempt.objects.create(
            user=user,
            quiz=quiz,
            score=score_percentage,
            passed=passed 
        )
        
        return Response(UserQuizAttemptSerializer(attempt, context=self.get_serializer_context()).data, status=status.HTTP_200_OK)


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['quiz']

class ChoiceViewSet(viewsets.ModelViewSet):
    queryset = Choice.objects.all()
    serializer_class = ChoiceSerializer
    permission_classes = [IsTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['question', 'question__quiz']


class UserLessonProgressViewSet(viewsets.ModelViewSet):
    queryset = UserLessonProgress.objects.all()
    serializer_class = UserLessonProgressSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['lesson', 'lesson__subject', 'lesson__subject__class_obj', 'user']

    def get_queryset(self):
        # Students see their own progress. Teachers might see progress for their students.
        user = self.request.user
        if user.role == 'Student':
            return self.queryset.filter(user=user)
        elif user.role == 'Teacher':
            # Teacher can see progress for students in their assigned class(es)
            # This requires CustomUser to have assigned_class field and students to have enrolled_class
            # For now, let's allow teachers to filter by user ID if provided in query params
            user_id_filter = self.request.query_params.get('user_id')
            if user_id_filter:
                return self.queryset.filter(user_id=user_id_filter)
            return self.queryset.none() # Or all progress if teacher is admin-like
        elif user.is_staff or user.role == 'Admin':
            return self.queryset.all()
        return self.queryset.none()

    def perform_create(self, serializer):
        # Automatically associate the progress with the authenticated user on create
        # Check if progress for this lesson by this user already exists
        lesson = serializer.validated_data.get('lesson')
        if UserLessonProgress.objects.filter(user=self.request.user, lesson=lesson).exists():
            # If exists, update it instead of creating new (or return error)
            # This behavior should align with perform_update or be handled as an update request
            instance = UserLessonProgress.objects.get(user=self.request.user, lesson=lesson)
            serializer.instance = instance # Set instance for serializer to update
            serializer.save(user=self.request.user) # Will call update on serializer
        else:
            serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        # Ensure user can only update their own progress record
        if serializer.instance.user != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You can only update your own progress.")
        serializer.save()


class ProcessedNoteViewSet(viewsets.ModelViewSet):
    queryset = ProcessedNote.objects.all()
    serializer_class = ProcessedNoteSerializer
    permission_classes = [IsAuthenticated] 

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Placeholder: Actual AI processing should happen here or in a service
        original_notes = serializer.validated_data.get('original_notes')
        processed_output = f"Processed AI Summary: {original_notes[:50]}..." # Mock processing
        serializer.save(user=self.request.user, processed_output=processed_output)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def export_email(self, request, pk=None):
        note = self.get_object()
        # TODO: Implement actual email sending logic here.
        return Response({"message": f"Email export for note '{note.id}' requested (placeholder)."}, status=status.HTTP_200_OK)


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsTeacherOrReadOnly] # ReadOnly for students, full for teachers
    filter_backends = [DjangoFilterBackend]
    parser_classes = [MultiPartParser, FormParser] # For file uploads
    filterset_fields = ['subject', 'class_obj', 'author', 'title']

    def get_serializer_context(self):
        return {'request': self.request, **super().get_serializer_context()}


# Placeholder, real AI integration would go here or in a separate service layer / flow
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_note_taking(request):
    notes_input = request.data.get('notes')
    lesson_id = request.data.get('lesson_id') # Optional
    user = request.user

    if not notes_input:
        return Response({'error': 'No notes provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Mock AI processing
    processed_notes_result = f"AI Processed Output for: {notes_input[:50]}..."
    
    lesson = None
    if lesson_id:
        try:
            lesson = Lesson.objects.get(id=lesson_id)
        except Lesson.DoesNotExist:
            pass # Lesson is optional

    processed_note_obj = ProcessedNote.objects.create(
        user=user,
        lesson=lesson,
        original_notes=notes_input,
        processed_output=processed_notes_result
    )
    
    serializer = ProcessedNoteSerializer(processed_note_obj, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dictionary_lookup(request):
    term = request.data.get('term')
    if not term:
        return Response({'error': 'No term provided for lookup'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Mock dictionary lookup
    mock_definition = f"Mock definition for '{term}': This is a placeholder. In a real app, this would come from a dictionary API or database."
    return Response({'term': term, 'definition': mock_definition}, status=status.HTTP_200_OK)

class UserQuizAttemptViewSet(viewsets.ReadOnlyModelViewSet): # Usually ReadOnly for students/parents
    queryset = UserQuizAttempt.objects.all()
    serializer_class = UserQuizAttemptSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'quiz', 'quiz__lesson__subject', 'passed']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'Student':
            return self.queryset.filter(user=user)
        elif user.role == 'Parent':
            # Parents see attempts of their linked children
            # Assuming ParentStudentLink model exists and is populated
            linked_student_ids = ParentStudentLink.objects.filter(parent=user).values_list('student_id', flat=True)
            return self.queryset.filter(user_id__in=linked_student_ids)
        elif user.role == 'Teacher' or user.is_staff:
            # Teachers/Admins can see all or filter by student/quiz
            return self.queryset.all()
        return self.queryset.none()
```