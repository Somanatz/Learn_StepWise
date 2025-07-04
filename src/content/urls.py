
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClassViewSet, SubjectViewSet, LessonViewSet, QuizViewSet, QuestionViewSet, ChoiceViewSet, 
    dictionary_lookup, BookViewSet, UserLessonProgressViewSet, ai_note_taking, 
    ProcessedNoteViewSet, UserQuizAttemptViewSet, RewardViewSet, UserRewardViewSet, CheckpointViewSet,
    AILessonQuizAttemptViewSet, UserNoteViewSet, TranslatedLessonContentViewSet,
    ai_summarize_lesson, ai_translate_lesson
)

router = DefaultRouter()
router.register(r'classes', ClassViewSet)
router.register(r'subjects', SubjectViewSet)
router.register(r'lessons', LessonViewSet, basename='lesson') # Added basename
router.register(r'quizzes', QuizViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'choices', ChoiceViewSet)
router.register(r'userprogress', UserLessonProgressViewSet)
router.register(r'processednotes', ProcessedNoteViewSet)
router.register(r'books', BookViewSet)
router.register(r'quizattempts', UserQuizAttemptViewSet)
router.register(r'ai-quiz-attempts', AILessonQuizAttemptViewSet, basename='ai-quiz-attempt')
router.register(r'rewards', RewardViewSet)
router.register(r'user-rewards', UserRewardViewSet, basename='user-reward')
router.register(r'checkpoints', CheckpointViewSet, basename='checkpoint')
router.register(r'usernotes', UserNoteViewSet, basename='usernote')
router.register(r'translated-content', TranslatedLessonContentViewSet, basename='translatedcontent')


urlpatterns = [
    path('', include(router.urls)),
    path('ai/notes/', ai_note_taking, name='ai_note_taking'),
    path('dictionary/', dictionary_lookup, name='dictionary_lookup'),
    path('ai/notes/summarize/', ai_summarize_lesson, name='ai_summarize_lesson'),
    path('ai/translate/', ai_translate_lesson, name='ai_translate_lesson'),
]
