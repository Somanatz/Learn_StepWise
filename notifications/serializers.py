
from rest_framework import serializers
from .models import Event
from accounts.models import School
from content.models import Class as ContentClass


class EventSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    school_id = serializers.PrimaryKeyRelatedField(source='school', queryset=School.objects.all(), allow_null=True, required=False)
    school_name = serializers.CharField(source='school.name', read_only=True, allow_null=True)
    target_class_id = serializers.PrimaryKeyRelatedField(source='target_class', queryset=ContentClass.objects.all(), allow_null=True, required=False)
    target_class_name = serializers.CharField(source='target_class.name', read_only=True, allow_null=True)


    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'date', 'end_date', 'type', 
            'created_by', 'created_by_username',
            'school', 'school_id', 'school_name', 
            'target_class', 'target_class_id', 'target_class_name'
        ]
        read_only_fields = ['created_by', 'school', 'target_class'] # IDs are for writing

    def validate(self, data):
        if data.get('end_date') and data.get('date') > data['end_date']:
            raise serializers.ValidationError("End date cannot be before start date.")
        return data
