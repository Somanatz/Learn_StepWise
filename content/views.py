from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Class, Subject, Lesson, Quiz, Question, Choice, UserLessonProgress
from accounts.models import CustomUser  # Import CustomUser from accounts.models
from .serializers import ProcessedNoteSerializer,(
    ClassSerializer, SubjectSerializer, LessonSerializer,
    UserLessonProgressSerializer, # Import the new serializer
    QuizSerializer, QuestionSerializer, ChoiceSerializer)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import UserQuizAttempt, Quiz # Import necessary models for lesson locking
from .models import ProcessedNote # Import the new model

# Create your views here.
class ClassViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]  # Require authentication for content access
    queryset = Class.objects.all()
    serializer_class = ClassSerializer

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer

class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer

    # No retrieve method needed for quiz locking, it's on the LessonViewSet

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user

        is_locked = False
        if instance.requires_previous_quiz and user.is_authenticated:
            # Find the previous lesson in the subject based on lesson_order
            previous_lesson = Lesson.objects.filter(
                subject=instance.subject,
                lesson_order__lt=instance.lesson_order
            ).order_by('-lesson_order').first()

            if previous_lesson and hasattr(previous_lesson, 'quiz'):
                # Check if the user has completed the previous lesson's quiz
                try:
                    user_attempt = UserQuizAttempt.objects.get(
                        user=user,
                        quiz=previous_lesson.quiz,
                        # You'll need to define what a "passing score" is
                        # For example, score__gte=previous_lesson.quiz.passing_score
                    )
                    # If you have a passing score defined on the Quiz model:
                    # is_locked = user_attempt.score < previous_lesson.quiz.passing_score
                    # For now, assuming any completed attempt unlocks:
 is_locked = False # If an attempt exists, it's not locked by this condition
                except UserQuizAttempt.DoesNotExist:
                    is_locked = True # No completed attempt for the previous quiz
            else: # No previous lesson or no quiz on the previous lesson
                 is_locked = False
            # If there is no previous lesson with a quiz, it's not locked by this mechanism

        serializer = self.get_serializer(instance, context={'request': request, 'is_locked': is_locked})
        return Response(serializer.data)

class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer

    @action(detail=True, methods=['post'])
    def submit_answers(self, request, pk=None):
        """
        Submit answers for a quiz and calculate the score.
        Expected request body:
        {
            "answers": [
                {"question_id": 1, "chosen_choice_id": 5},
                {"question_id": 2, "chosen_choice_id": 8},
                ...
            ]
        }
        """
        quiz = self.get_object()
        answers = request.data.get('answers', [])
        score = 0
        total_questions = quiz.questions.count()

        for answer in answers:
            question_id = answer.get('question_id')
            chosen_choice_id = answer.get('chosen_choice_id')
            try:
                question = quiz.questions.get(id=question_id)
                correct_choice = question.choices.get(is_correct=True)
                if correct_choice.id == chosen_choice_id:
                    score += 1
            except (Question.DoesNotExist, Choice.DoesNotExist):
                # Handle cases where question or choice doesn't exist for this quiz
                pass # Or return an error response

        # Assuming you want to store the attempt regardless of score
        if request.user.is_authenticated:
            user = request.user
            # Update or create the UserQuizAttempt
            user_attempt, created = UserQuizAttempt.objects.get_or_create(
                user=user,
                quiz=quiz,
                defaults={'score': score}
            )
            if not created:
                user_attempt.score = score
                user_attempt.save()

        # TODO: Implement logic for a "passing score" and potentially trigger lesson unlocking here

        percentage_score = (score / total_questions) * 100 if total_questions > 0 else 0

        # TODO: Save the score and user's answers in a new model (e.g., UserQuizAttempt)
        # This requires creating a new model to track student attempts and scores.

        return Response({
            'quiz_id': quiz.id,
            'score': score,
            'total_questions': total_questions,
            'percentage_score': percentage_score
        }, status=status.HTTP_200_OK)

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

class ChoiceViewSet(viewsets.ModelViewSet):
    queryset = Choice.objects.all()
    serializer_class = ChoiceSerializer

class UserLessonProgressViewSet(viewsets.ModelViewSet):
    queryset = UserLessonProgress.objects.all()
    serializer_class = UserLessonProgressSerializer

    def get_queryset(self):
        # Filter queryset to only show progress for the authenticated user
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically associate the progress with the authenticated user on create
        serializer.save(user=self.request.user)

class ProcessedNoteViewSet(viewsets.ModelViewSet):
    queryset = ProcessedNote.objects.all()
    serializer_class = ProcessedNoteSerializer
    permission_classes = [IsAuthenticated] # Ensure only authenticated users can access

    def get_queryset(self):
        # Filter queryset to only show processed notes for the authenticated user
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# Import Q for complex lookups (if not already imported)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_note_taking(request):
    """
    API endpoint for AI note taking.
    """
    if 'notes' in request.data:
        notes = request.data['notes']
        user = request.user

        # --- AI Model Integration Placeholder ---
        # TODO: Choose an AI model (e.g., OpenAI GPT, Google AI, etc.)
        # TODO: Install the necessary client library for the AI model
        # TODO: Authenticate with the AI model service (e.g., using API keys)

        processed_notes_result = None
        try:
            # Example: Sending notes to an AI model (replace with actual AI model call)
            # from your_ai_service import YourAIClient
            # ai_client = YourAIClient(api_key='YOUR_AI_API_KEY') # Load API key securely
            # processed_notes_result = ai_client.process_notes(notes)

            # For now, just acknowledge receipt and include notes in response
            processed_notes_result = f"Notes received for processing: {notes}"

        except Exception as e:
            # Handle AI model integration errors
            print(f"Error processing notes with AI model: {e}")
            return Response({'error': 'Error processing notes'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        # --- End AI Model Integration Placeholder ---

        # Save the original notes and processed result to the ProcessedNote model
        processed_note = ProcessedNote.objects.create(
            user=user,
            original_notes=notes,
            processed_output=processed_notes_result # Use the actual processed result here
            # If notes are lesson-specific, you would also link the lesson here
        )

        return Response({'message': 'Notes received and processed (placeholder)', 'processed_result': processed_notes_result}, status=status.HTTP_200_OK)
    return Response({'error': 'No notes provided'}, status=status.HTTP_400_BAD_REQUEST)