from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Class, Subject, Lesson, Quiz, Question, Choice, UserLessonProgress, UserQuizAttempt, Book
from accounts.models import CustomUser 
from .serializers import ( ProcessedNoteSerializer,
 ClassSerializer, SubjectSerializer, LessonSerializer, BookSerializer, 
 UserLessonProgressSerializer,
 QuizSerializer, QuestionSerializer, ChoiceSerializer)
from accounts.permissions import IsTeacher, IsTeacherOrReadOnly
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly 
from rest_framework.permissions import IsAdminUser, AllowAny 
from rest_framework.permissions import IsAuthenticated
from .models import UserQuizAttempt, Quiz 
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
        return {'request': self.request}

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['class_obj']

    def get_serializer_context(self):
        return {'request': self.request}


class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [IsTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['subject', 'subject__class_obj']

    def get_queryset(self):
        user = self.request.user
        queryset = Lesson.objects.all()

        if user.is_authenticated:
            # Annotate each lesson with an 'is_locked' field
            # A lesson is locked if it requires a previous quiz, and the user hasn't passed that quiz.
            
            # Subquery to check for a passed attempt on the prerequisite quiz
            passed_prerequisite_quiz = UserQuizAttempt.objects.filter(
                user=user,
                quiz=OuterRef('previous_lesson_quiz_id'), # We'll need to get previous_lesson_quiz_id
                passed=True # Or score based logic
            )
            
            # This is complex. A simpler approach might be needed in the serializer if performance is an issue,
            # or by denormalizing. For now, let's assume `is_locked` is handled by serializer or a simpler model method.
            # The `is_locked` logic in the serializer is preferred.
            pass

        return queryset.order_by('subject__class_obj__id', 'subject__id', 'lesson_order')

    def get_serializer_context(self):
        return {'request': self.request}


class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['lesson', 'lesson__subject']

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
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
        
        # Define passing criteria, e.g., 70%
        PASSING_THRESHOLD = 70 
        passed = score_percentage >= PASSING_THRESHOLD

        # Record the attempt
        attempt = UserQuizAttempt.objects.create(
            user=user,
            quiz=quiz,
            score=score_percentage,
            passed=passed 
        )
        
        return Response({
            "quiz_id": quiz.id,
            "score": score_percentage,
            "correct_answers": correct_answers_count,
            "total_questions": total_questions_in_quiz,
            "passed": passed,
            "attempt_id": attempt.id
        }, status=status.HTTP_200_OK)


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
    permission_classes = [IsAuthenticated] # Users can only manage their own progress
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['lesson', 'lesson__subject', 'lesson__subject__class_obj']

    def get_queryset(self):
        # Users can only see/update their own progress
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically associate the progress with the authenticated user on create
        serializer.save(user=self.request.user)

class ProcessedNoteViewSet(viewsets.ModelViewSet):
    queryset = ProcessedNote.objects.all()
    serializer_class = ProcessedNoteSerializer
    permission_classes = [IsAuthenticated] 

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def export_email(self, request, pk=None):
        note = self.get_object()
        user = request.user
        # TODO: Implement email sending logic here.
        return Response({"message": f"Email export for note {note.id} requested (placeholder)."}, status=status.HTTP_200_OK)


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['subject', 'class_obj', 'author', 'title']

    def get_serializer_context(self):
        return {'request': self.request}


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_note_taking(request):
    if 'notes' in request.data:
        notes_input = request.data['notes']
        user = request.user
        
        # Placeholder: Echo back the notes
        processed_notes_result = f"Received and echoed notes: {notes_input}"
        
        processed_note_obj = ProcessedNote.objects.create(
            user=user,
            original_notes=notes_input,
            processed_output=processed_notes_result,
            # lesson=request.data.get('lesson_id') # Optional: link to a lesson
        )
        
        serializer = ProcessedNoteSerializer(processed_note_obj)
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response({'error': 'No notes provided'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated]) # Or AllowAny if it's a general utility
def dictionary_lookup(request):
    if 'term' in request.data:
        term = request.data['term']
        # Placeholder: Echo back the term with a mock definition
        mock_definition = f"Definition for '{term}': This is a placeholder definition from the StepWise learning platform."
        return Response({'term': term, 'definition': mock_definition}, status=status.HTTP_200_OK)
    return Response({'error': 'No term provided for lookup'}, status=status.HTTP_400_BAD_REQUEST)
