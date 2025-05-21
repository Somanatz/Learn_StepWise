
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes as dec_permission_classes
from rest_framework.response import Response
from .models import Class, Subject, Lesson, Quiz, Question, Choice, UserLessonProgress, UserQuizAttempt, Book, ProcessedNote
from accounts.models import CustomUser, ParentStudentLink, StudentProfile
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
    queryset = Class.objects.all().select_related('school')
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] # Changed for public listing for signup
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['school', 'name']

    def get_serializer_context(self):
        return {'request': self.request, **super().get_serializer_context()}

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_staff and not (user.role == 'Teacher' and user.is_authenticated) and not (user.role == 'Admin' and user.is_school_admin):
            raise PermissionDenied("Only authorized teachers or staff can create classes.")
        
        school = serializer.validated_data.get('school')
        if not school and user.role in ['Teacher', 'Admin'] and user.is_school_admin and user.school:
             serializer.save(school=user.school)
        elif school: # If school is provided, ensure user has rights if they are a school admin
            if user.role == 'Admin' and user.is_school_admin and user.school != school:
                raise PermissionDenied("School admins can only create classes for their own school.")
            serializer.save()
        else: # If no school context can be derived (e.g. platform admin creating class without specifying school)
            serializer.save()


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all().select_related('class_obj', 'class_obj__school')
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] # Changed for public listing for signup
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['class_obj', 'name']

    def get_serializer_context(self):
        return {'request': self.request, **super().get_serializer_context()}

    def perform_create(self, serializer):
        user = self.request.user
        class_obj = serializer.validated_data.get('class_obj')
        
        can_create = False
        if user.is_staff:
            can_create = True
        elif user.is_authenticated and user.role == 'Teacher':
            # Teacher can create subject if the class belongs to their school
            if class_obj and class_obj.school == user.school:
                can_create = True
        elif user.is_authenticated and user.role == 'Admin' and user.is_school_admin:
             if class_obj and class_obj.school == user.school:
                can_create = True
        
        if not can_create:
            raise PermissionDenied("You do not have permission to create subjects for this class/school.")
        serializer.save()


class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] 
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['subject', 'subject__class_obj', 'title']

    def get_queryset(self):
        # Annotate with quiz_id for is_locked logic if UserQuizAttempt is involved directly
        # However, the serializer's get_is_locked handles this by querying UserQuizAttempt
        return Lesson.objects.all().select_related('subject', 'subject__class_obj').order_by('subject__class_obj__id', 'subject__id', 'lesson_order')

    def get_serializer_context(self):
        return {'request': self.request, **super().get_serializer_context()}

    def perform_create(self, serializer):
        user = self.request.user
        subject = serializer.validated_data.get('subject')
        can_create = False
        if user.is_staff:
            can_create = True
        elif user.is_authenticated and user.role == 'Teacher':
            if subject and subject.class_obj.school == user.school:
                can_create = True
        elif user.is_authenticated and user.role == 'Admin' and user.is_school_admin:
             if subject and subject.class_obj.school == user.school:
                can_create = True
        
        if not can_create:
            raise PermissionDenied("You do not have permission to create lessons for this subject/class/school.")
        serializer.save()


    @action(detail=True, methods=['post'], permission_classes=[IsTeacher | IsAdminUser])
    def simplify_content(self, request, pk=None):
        lesson = self.get_object()
        # Actual AI call placeholder
        simplified_text = request.data.get('simplified_text', None)
        if simplified_text:
            lesson.simplified_content = simplified_text
        elif lesson.content:
            lesson.simplified_content = "Simplified (AI Placeholder): " + lesson.content[:100] + "..." 
        else:
            return Response({"error": "Lesson content is empty or no simplified text provided."}, status=status.HTTP_400_BAD_REQUEST)
        lesson.save()
        return Response(LessonSerializer(lesson, context=self.get_serializer_context()).data)


class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all().select_related('lesson', 'lesson__subject').prefetch_related('questions__choices')
    serializer_class = QuizSerializer
    permission_classes = [IsTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['lesson', 'lesson__subject', 'title']

    def get_serializer_context(self):
        return {'request': self.request, **super().get_serializer_context()}
    
    def perform_create(self, serializer):
        user = self.request.user
        lesson = serializer.validated_data.get('lesson')
        can_create = False
        if user.is_staff:
            can_create = True
        elif user.is_authenticated and user.role == 'Teacher':
            if lesson and lesson.subject.class_obj.school == user.school:
                can_create = True
        elif user.is_authenticated and user.role == 'Admin' and user.is_school_admin:
             if lesson and lesson.subject.class_obj.school == user.school:
                can_create = True
        
        if not can_create:
            raise PermissionDenied("You do not have permission to create quizzes for this lesson/subject/class/school.")
        serializer.save()


    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsStudent])
    def submit_quiz(self, request, pk=None):
        quiz = self.get_object()
        user = request.user
        answers_data = request.data.get('answers', []) 
        
        if not isinstance(answers_data, list):
             return Response({"error": "Answers must be a list."}, status=status.HTTP_400_BAD_REQUEST)

        correct_answers_count = 0
        total_questions_in_quiz = quiz.questions.count()

        if total_questions_in_quiz == 0:
            attempt = UserQuizAttempt.objects.create(user=user, quiz=quiz, score=0, passed=False, answers=answers_data)
            return Response(UserQuizAttemptSerializer(attempt, context=self.get_serializer_context()).data, status=status.HTTP_200_OK)

        for answer_data in answers_data:
            question_id = answer_data.get('question_id')
            selected_choice_id = answer_data.get('choice_id')

            if question_id is None or selected_choice_id is None:
                continue 

            try:
                question = Question.objects.get(pk=question_id, quiz=quiz) # Ensure question belongs to this quiz
                selected_choice = Choice.objects.get(pk=selected_choice_id, question=question) # Ensure choice belongs to this question
                if selected_choice.is_correct:
                    correct_answers_count += 1
            except Question.DoesNotExist:
                pass
            except Choice.DoesNotExist:
                pass
        
        score_percentage = (correct_answers_count / total_questions_in_quiz) * 100 if total_questions_in_quiz > 0 else 0
        passed = score_percentage >= quiz.pass_mark_percentage

        attempt = UserQuizAttempt.objects.create(
            user=user,
            quiz=quiz,
            score=score_percentage,
            passed=passed,
            answers=answers_data 
        )
        
        return Response(UserQuizAttemptSerializer(attempt, context=self.get_serializer_context()).data, status=status.HTTP_200_OK)


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all().prefetch_related('choices')
    serializer_class = QuestionSerializer
    permission_classes = [IsTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['quiz']

    def perform_create(self, serializer):
        user = self.request.user
        quiz_id = self.request.data.get('quiz') 
        if not quiz_id:
            raise ValidationError("Quiz ID must be provided to create a question.")
        try:
            quiz = Quiz.objects.get(pk=quiz_id)
            can_create = False
            if user.is_staff:
                can_create = True
            elif user.is_authenticated and user.role == 'Teacher':
                if quiz.lesson.subject.class_obj.school == user.school:
                    can_create = True
            elif user.is_authenticated and user.role == 'Admin' and user.is_school_admin:
                if quiz.lesson.subject.class_obj.school == user.school:
                    can_create = True
            
            if not can_create:
                raise PermissionDenied("You cannot add questions to this quiz.")
            serializer.save(quiz=quiz)
        except Quiz.DoesNotExist:
            raise NotFound("Quiz not found.")


class ChoiceViewSet(viewsets.ModelViewSet):
    queryset = Choice.objects.all().select_related('question')
    serializer_class = ChoiceSerializer
    permission_classes = [IsTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['question', 'question__quiz']

    def perform_create(self, serializer):
        user = self.request.user
        question_id = self.request.data.get('question') 
        if not question_id:
            raise ValidationError("Question ID must be provided to create a choice.")
        try:
            question = Question.objects.get(pk=question_id)
            can_create = False
            if user.is_staff:
                can_create = True
            elif user.is_authenticated and user.role == 'Teacher':
                 if question.quiz.lesson.subject.class_obj.school == user.school:
                    can_create = True
            elif user.is_authenticated and user.role == 'Admin' and user.is_school_admin:
                 if question.quiz.lesson.subject.class_obj.school == user.school:
                    can_create = True

            if not can_create:
                 raise PermissionDenied("You cannot add choices to this question.")
            serializer.save(question=question)
        except Question.DoesNotExist:
            raise NotFound("Question not found.")


class UserLessonProgressViewSet(viewsets.ModelViewSet):
    queryset = UserLessonProgress.objects.all().select_related('user', 'lesson', 'lesson__subject')
    serializer_class = UserLessonProgressSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] # ReadOnly for general, create/update needs auth
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['lesson', 'lesson__subject', 'lesson__subject__class_obj', 'user', 'completed']

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if not user.is_authenticated: # For IsAuthenticatedOrReadOnly
            return qs.none() # Or a publicly allowed subset if any

        if user.role == 'Student':
            return qs.filter(user=user)
        elif user.role == 'Teacher' and user.school:
            student_ids = CustomUser.objects.filter(school=user.school, role='Student').values_list('id', flat=True)
            return qs.filter(user_id__in=student_ids)
        elif user.role == 'Parent':
            linked_student_ids = ParentStudentLink.objects.filter(parent=user).values_list('student_id', flat=True)
            return qs.filter(user_id__in=linked_student_ids)
        elif user.is_staff or (user.role == 'Admin' and user.is_school_admin): # School admin can see for their school
            if user.school:
                 student_ids = CustomUser.objects.filter(school=user.school, role='Student').values_list('id', flat=True)
                 return qs.filter(user_id__in=student_ids)
            return qs.all() # Platform admin sees all
        return qs.none()

    def perform_create(self, serializer):
        if not self.request.user.is_authenticated or self.request.user.role != 'Student':
            raise PermissionDenied("Only students can record their lesson progress.")
        lesson = serializer.validated_data.get('lesson')
        existing_progress, created = UserLessonProgress.objects.update_or_create(
            user=self.request.user, 
            lesson=lesson,
            defaults=serializer.validated_data # Will pass 'completed', 'progress_data'
        )
        if not created: # If updated, use existing instance for serializer
            serializer.instance = existing_progress
        serializer.save(user=self.request.user)


    def perform_update(self, serializer):
        if serializer.instance.user != self.request.user and not (self.request.user.is_staff or (self.request.user.is_authenticated and self.request.user.role == 'Teacher')): # Teachers might update some aspects
            raise PermissionDenied("You can only update your own progress or lack permissions.")
        serializer.save()


class ProcessedNoteViewSet(viewsets.ModelViewSet):
    queryset = ProcessedNote.objects.all().select_related('user', 'lesson')
    serializer_class = ProcessedNoteSerializer
    permission_classes = [IsAuthenticated] 
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'lesson']

    def get_queryset(self):
        # Users can only see their own notes
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        original_notes = serializer.validated_data.get('original_notes')
        processed_output = f"AI Processed Summary (Placeholder): {original_notes[:50]}..." if original_notes else "No notes to process."
        serializer.save(user=self.request.user, processed_output=processed_output)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def export_email(self, request, pk=None):
        note = self.get_object()
        # TODO: Implement actual email sending logic here.
        return Response({"message": f"Email export for note '{note.id}' requested (placeholder)."}, status=status.HTTP_200_OK)


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all().select_related('subject', 'class_obj')
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] # Allow read for all authenticated, CUD for teachers/admins
    filter_backends = [DjangoFilterBackend]
    parser_classes = [MultiPartParser, FormParser] 
    filterset_fields = ['subject', 'class_obj', 'author', 'title']

    def get_serializer_context(self):
        return {'request': self.request, **super().get_serializer_context()}
    
    def perform_create(self, serializer):
        user = self.request.user
        can_create = False
        if user.is_staff:
            can_create = True
        elif user.is_authenticated and user.role == 'Teacher':
            # Teachers can upload books for subjects/classes in their school
            subject = serializer.validated_data.get('subject')
            class_obj = serializer.validated_data.get('class_obj')
            school_context_ok = False
            if subject and subject.class_obj.school == user.school: school_context_ok = True
            if class_obj and class_obj.school == user.school: school_context_ok = True
            if not subject and not class_obj and user.school: # Book for general school library
                serializer.save(school=user.school) # Assuming Book model has school FK
                return
            if school_context_ok: can_create = True

        elif user.is_authenticated and user.role == 'Admin' and user.is_school_admin:
            # School admins for their school
            subject = serializer.validated_data.get('subject')
            class_obj = serializer.validated_data.get('class_obj')
            if (subject and subject.class_obj.school == user.school) or \
               (class_obj and class_obj.school == user.school) or \
               (not subject and not class_obj): # General book for school
                can_create = True
                if not subject and not class_obj:
                    serializer.save(school=user.school) # Assuming Book model has school FK
                    return


        if not can_create:
            raise PermissionDenied("You do not have permission to upload books for this context.")
        serializer.save()


@api_view(['POST'])
@dec_permission_classes([IsAuthenticated]) # Any authenticated user can use note taking
def ai_note_taking(request):
    notes_input = request.data.get('notes')
    lesson_id = request.data.get('lesson_id') 
    user = request.user

    if not notes_input:
        return Response({'error': 'No notes provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Placeholder AI processing
    processed_notes_result = f"AI Processed Output (Placeholder): {notes_input[:50]}..."
    
    lesson = None
    if lesson_id:
        try:
            lesson = Lesson.objects.get(id=lesson_id)
        except Lesson.DoesNotExist:
            pass # It's okay if lesson_id is invalid or note is not for a specific lesson

    processed_note_obj = ProcessedNote.objects.create(
        user=user,
        lesson=lesson,
        original_notes=notes_input,
        processed_output=processed_notes_result
    )
    
    serializer = ProcessedNoteSerializer(processed_note_obj, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@dec_permission_classes([IsAuthenticated]) # Any authenticated user can use dictionary
def dictionary_lookup(request):
    term = request.data.get('term')
    if not term:
        return Response({'error': 'No term provided for lookup'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Mock dictionary lookup
    mock_definition = f"Mock definition for '{term}': This is a placeholder. In a real app, this would come from a dictionary API or database."
    return Response({'term': term, 'definition': mock_definition}, status=status.HTTP_200_OK)

class UserQuizAttemptViewSet(viewsets.ReadOnlyModelViewSet): 
    queryset = UserQuizAttempt.objects.all().select_related('user', 'quiz', 'quiz__lesson')
    serializer_class = UserQuizAttemptSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] # ReadOnly for GET, specific permissions handled in get_queryset
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'quiz', 'quiz__lesson__subject', 'passed']

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if not user.is_authenticated:
            return qs.none() # No access for unauthenticated

        if user.role == 'Student':
            return qs.filter(user=user)
        elif user.role == 'Parent':
            linked_student_ids = ParentStudentLink.objects.filter(parent=user).values_list('student_id', flat=True)
            return qs.filter(user_id__in=linked_student_ids)
        elif user.role == 'Teacher' and user.school:
            # Teachers can see attempts for students in classes they teach at their school
            # This can get complex if needing to filter by teacher's specific classes
            # For now, school-wide if they belong to a school
            student_ids_in_school = CustomUser.objects.filter(school=user.school, role='Student').values_list('id', flat=True)
            return qs.filter(user_id__in=student_ids_in_school)
        elif user.is_staff or (user.role == 'Admin' and user.is_school_admin and user.school): # School admin
            student_ids_in_school = CustomUser.objects.filter(school=user.school, role='Student').values_list('id', flat=True)
            return qs.filter(user_id__in=student_ids_in_school)
        elif user.is_staff: # Platform admin
             return qs.all()
        return qs.none()

    def get_serializer_context(self):
        return {'request': self.request, **super().get_serializer_context()}

