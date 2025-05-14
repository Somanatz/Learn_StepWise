from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClassViewSet, SubjectViewSet, LessonViewSet, QuizViewSet, QuestionViewSet, ChoiceViewSet
from .views import UserLessonProgressViewSet
from .views import ai_note_taking, ProcessedNoteViewSet

router = DefaultRouter()
router.register(r'classes', ClassViewSet)
router.register(r'subjects', SubjectViewSet)
router.register(r'lessons', LessonViewSet)
router.register(r'quizzes', QuizViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'choices', ChoiceViewSet)
router.register(r'userprogress', UserLessonProgressViewSet)
router.register(r'processednotes', ProcessedNoteViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('ai/notes/', ai_note_taking, name='ai_note_taking'),
]