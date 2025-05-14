from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomUserViewSet, UserSignupView, ParentStudentLinkViewSet, TeacherActionsViewSet, bulk_upload_users

router = DefaultRouter()
router.register(r'users', CustomUserViewSet)
router.register(r'parent-student-links', ParentStudentLinkViewSet)
router.register(r'teacher-actions', TeacherActionsViewSet, basename='teacher-actions') # For student-specific actions by teachers

urlpatterns = [
    path('', include(router.urls)),
    path('signup/', UserSignupView.as_view(), name='signup'), # Corrected: .as_view()
    path('bulk-upload-users/', bulk_upload_users, name='bulk-upload-users'),
]