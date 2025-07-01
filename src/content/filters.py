import django_filters
from .models import UserLessonProgress

class UserLessonProgressFilter(django_filters.FilterSet):
    # This allows filtering by a comma-separated list of lesson IDs
    # e.g., /api/userprogress/?lesson__in=1,2,3
    lesson__in = django_filters.BaseInFilter(field_name='lesson_id', lookup_expr='in')

    class Meta:
        model = UserLessonProgress
        # Define the fields available for filtering.
        # 'lesson__in' is handled by the custom filter above.
        # Other fields can be filtered directly.
        fields = ['user', 'lesson', 'completed', 'lesson__subject', 'lesson__subject__class_obj']
