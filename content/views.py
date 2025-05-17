
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from .models import Class, Subject, Lesson, Quiz, Question, Choice, UserLessonProgress, UserQuizAttempt, Book, ProcessedNote
from accounts.models import CustomUser, ParentStudentLink 
from .serializers import ( 
    ProcessedNoteSerializer, ClassSerializer, SubjectSerializer, LessonSerializer, BookSerializer, 
    UserLessonProgressSerializer, QuizSerializer, QuestionSerializer, ChoiceSerializer, UserQuizAttemptSerializer
)
from accounts.permissions import IsTeacher, IsTeacherOrReadOnly, IsStudent, IsParent
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser, AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend 
from django.http import JsonResponse 
from django.db.models import Q, Exists, OuterRef
from django.utils import timezone 
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError


class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [IsTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['school', 'name']


    def get_serializer_context(self):
        return {'request': self.request, **super().get_serializer_context()}

    def perform_create(self, serializer):
        if not self.request.user.is_staff and not self.request.user.role == 'Teacher':
            raise PermissionDenied("Only teachers or staff can create classes.")
        # Optionally, link class to teacher's school if not provided explicitly
        school = serializer.validated_data.get('school')
        if not school and self.request.user.school:
            serializer.save(school=self.request.user.school)
        else:
            serializer.save()


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['class_obj', 'name']

    def get_serializer_context(self):
        return {'request': self.request, **super().get_serializer_context()}

    def perform_create(self, serializer):
        if not self.request.user.is_staff and not self.request.user.role == 'Teacher':
            raise PermissionDenied("Only teachers or staff can create subjects.")
        serializer.save()


class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [IsTeacherOrReadOnly] 
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['subject', 'subject__class_obj', 'title']

    def get_queryset(self):
        return Lesson.objects.all().order_by('subject__class_obj__id', 'subject__id', 'lesson_order')

    def get_serializer_context(self):
        return {'request': self.request, **super().get_serializer_context()}

    def perform_create(self, serializer):
        if not self.request.user.is_staff and not self.request.user.role == 'Teacher':
            raise PermissionDenied("Only teachers or staff can create lessons.")
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsTeacher])
    def simplify_content(self, request, pk=None):
        lesson = self.get_object()
        # Actual AI call placeholder
        # For now, simulate based on request data or simple logic
        simplified_text = request.data.get('simplified_text', None)
        if simplified_text:
            lesson.simplified_content = simplified_text
        elif lesson.content:
            lesson.simplified_content = "Simplified: " + lesson.content[:100] + "..." 
        else:
            return Response({"error": "Lesson content is empty or no simplified text provided."}, status=status.HTTP_400_BAD_REQUEST)
        lesson.save()
        return Response(LessonSerializer(lesson, context=self.get_serializer_context()).data)


class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['lesson', 'lesson__subject', 'title']

    def get_serializer_context(self):
        return {'request': self.request, **super().get_serializer_context()}
    
    def perform_create(self, serializer):
        if not self.request.user.is_staff and not self.request.user.role == 'Teacher':
            raise PermissionDenied("Only teachers or staff can create quizzes.")
        serializer.save()


    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsStudent])
    def submit_quiz(self, request, pk=None):
        quiz = self.get_object()
        user = request.user
        answers_data = request.data.get('answers', []) # e.g., [{"question_id": 1, "choice_id": 3}]
        
        if not isinstance(answers_data, list):
             return Response({"error": "Answers must be a list."}, status=status.HTTP_400_BAD_REQUEST)

        correct_answers_count = 0
        total_questions_in_quiz = quiz.questions.count()

        if total_questions_in_quiz == 0:
            # Create an attempt even if no questions, score 0 or 100 based on policy
            attempt = UserQuizAttempt.objects.create(user=user, quiz=quiz, score=0, passed=False, answers=answers_data)
            return Response(UserQuizAttemptSerializer(attempt, context=self.get_serializer_context()).data, status=status.HTTP_200_OK)

        for answer_data in answers_data:
            question_id = answer_data.get('question_id')
            selected_choice_id = answer_data.get('choice_id')

            if question_id is None or selected_choice_id is None:
                continue # Or raise error: return Response({"error": "Each answer must have question_id and choice_id."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                question = Question.objects.get(id=question_id, quiz=quiz)
                selected_choice = Choice.objects.get(id=selected_choice_id, question=question)
                if selected_choice.is_correct:
                    correct_answers_count += 1
            except Question.DoesNotExist:
                # Log this or handle as per policy, for now, skip invalid question_id
                pass
            except Choice.DoesNotExist:
                 # Log this or handle, for now, skip invalid choice_id
                pass
        
        score_percentage = (correct_answers_count / total_questions_in_quiz) * 100 if total_questions_in_quiz > 0 else 0
        
        passed = score_percentage >= quiz.pass_mark_percentage

        attempt = UserQuizAttempt.objects.create(
            user=user,
            quiz=quiz,
            score=score_percentage,
            passed=passed,
            answers=answers_data # Store the submitted answers
        )
        
        return Response(UserQuizAttemptSerializer(attempt, context=self.get_serializer_context()).data, status=status.HTTP_200_OK)


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['quiz']

    def perform_create(self, serializer):
        if not self.request.user.is_staff and not self.request.user.role == 'Teacher':
            raise PermissionDenied("Only teachers or staff can create questions.")
        quiz_id = self.request.data.get('quiz') # Assuming quiz ID is passed in request data
        if not quiz_id:
            raise ValidationError("Quiz ID must be provided to create a question.")
        try:
            quiz = Quiz.objects.get(pk=quiz_id)
            # Optional: Check if teacher owns the quiz's lesson's subject/class/school
            serializer.save(quiz=quiz)
        except Quiz.DoesNotExist:
            raise NotFound("Quiz not found.")


class ChoiceViewSet(viewsets.ModelViewSet):
    queryset = Choice.objects.all()
    serializer_class = ChoiceSerializer
    permission_classes = [IsTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['question', 'question__quiz']

    def perform_create(self, serializer):
        if not self.request.user.is_staff and not self.request.user.role == 'Teacher':
            raise PermissionDenied("Only teachers or staff can create choices.")
        question_id = self.request.data.get('question') # Assuming question ID is passed
        if not question_id:
            raise ValidationError("Question ID must be provided to create a choice.")
        try:
            question = Question.objects.get(pk=question_id)
            # Optional: Check ownership
            serializer.save(question=question)
        except Question.DoesNotExist:
            raise NotFound("Question not found.")



class UserLessonProgressViewSet(viewsets.ModelViewSet):
    queryset = UserLessonProgress.objects.all()
    serializer_class = UserLessonProgressSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['lesson', 'lesson__subject', 'lesson__subject__class_obj', 'user', 'completed']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'Student':
            return self.queryset.filter(user=user)
        elif user.role == 'Teacher':
            # Teachers can see progress for students in their school
            if user.school:
                student_ids = CustomUser.objects.filter(school=user.school, role='Student').values_list('id', flat=True)
                return self.queryset.filter(user_id__in=student_ids)
            return self.queryset.none() 
        elif user.role == 'Parent':
            linked_student_ids = ParentStudentLink.objects.filter(parent=user).values_list('student_id', flat=True)
            return self.queryset.filter(user_id__in=linked_student_ids)
        elif user.is_staff or user.role == 'Admin':
            return self.queryset.all()
        return self.queryset.none()

    def perform_create(self, serializer):
        lesson = serializer.validated_data.get('lesson')
        existing_progress = UserLessonProgress.objects.filter(user=self.request.user, lesson=lesson).first()
        if existing_progress:
            # Update existing progress instead of creating new
            serializer.instance = existing_progress
            serializer.save(user=self.request.user)
        else:
            serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.user != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You can only update your own progress.")
        serializer.save()


class ProcessedNoteViewSet(viewsets.ModelViewSet):
    queryset = ProcessedNote.objects.all()
    serializer_class = ProcessedNoteSerializer
    permission_classes = [IsAuthenticated] 
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'lesson']


    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        original_notes = serializer.validated_data.get('original_notes')
        # Placeholder for actual AI processing
        processed_output = f"AI Processed Summary of: {original_notes[:50]}..." if original_notes else "No notes to process."
        serializer.save(user=self.request.user, processed_output=processed_output)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def export_email(self, request, pk=None):
        note = self.get_object()
        # TODO: Implement actual email sending logic here.
        return Response({"message": f"Email export for note '{note.id}' requested (placeholder)."}, status=status.HTTP_200_OK)


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsTeacherOrReadOnly] 
    filter_backends = [DjangoFilterBackend]
    parser_classes = [MultiPartParser, FormParser] 
    filterset_fields = ['subject', 'class_obj', 'author', 'title']

    def get_serializer_context(self):
        return {'request': self.request, **super().get_serializer_context()}
    
    def perform_create(self, serializer):
        if not self.request.user.is_staff and not self.request.user.role == 'Teacher':
            raise PermissionDenied("Only teachers or staff can upload books.")
        serializer.save()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_note_taking(request):
    notes_input = request.data.get('notes')
    lesson_id = request.data.get('lesson_id') 
    user = request.user

    if not notes_input:
        return Response({'error': 'No notes provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    processed_notes_result = f"AI Processed Output for: {notes_input[:50]}..."
    
    lesson = None
    if lesson_id:
        try:
            lesson = Lesson.objects.get(id=lesson_id)
        except Lesson.DoesNotExist:
            pass 

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
    
    mock_definition = f"Mock definition for '{term}': This is a placeholder. In a real app, this would come from a dictionary API or database."
    return Response({'term': term, 'definition': mock_definition}, status=status.HTTP_200_OK)

class UserQuizAttemptViewSet(viewsets.ReadOnlyModelViewSet): 
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
            linked_student_ids = ParentStudentLink.objects.filter(parent=user).values_list('student_id', flat=True)
            return self.queryset.filter(user_id__in=linked_student_ids)
        elif user.role == 'Teacher':
            if user.school:
                student_ids_in_school = CustomUser.objects.filter(school=user.school, role='Student').values_list('id', flat=True)
                # Further filter by classes teacher is assigned to, if applicable
                # assigned_classes = user.teacher_profile.assigned_classes.all()
                # students_in_assigned_classes = StudentProfile.objects.filter(enrolled_class__in=assigned_classes).values_list('user_id', flat=True)
                # final_student_ids = list(set(student_ids_in_school) & set(students_in_assigned_classes))
                return self.queryset.filter(user_id__in=student_ids_in_school) # Simplified for now
            return self.queryset.none()
        elif user.is_staff or user.role == 'Admin':
            return self.queryset.all()
        return self.queryset.none()

    def get_serializer_context(self):
        return {'request': self.request, **super().get_serializer_context()}
