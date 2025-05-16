
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomUserViewSet, UserSignupView, ParentStudentLinkViewSet, 
    TeacherActionsViewSet, bulk_upload_users, SchoolViewSet
)

router = DefaultRouter()
router.register(r'users', CustomUserViewSet, basename='customuser') # Added basename
router.register(r'parent-student-links', ParentStudentLinkViewSet)
router.register(r'teacher-actions', TeacherActionsViewSet, basename='teacher-actions')
router.register(r'schools', SchoolViewSet)


urlpatterns = [
    path('', include(router.urls)),
    path('signup/', UserSignupView.as_view(), name='signup'),
    path('bulk-upload-users/', bulk_upload_users, name='bulk-upload-users'),
]
