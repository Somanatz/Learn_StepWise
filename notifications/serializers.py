from rest_framework import serializers
from .models import Event

class EventSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)

    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 'date', 'end_date', 'type', 'created_by', 'created_by_username']
        read_only_fields = ['created_by'] # Set automatically in view

    def validate(self, data):
        if data.get('end_date') and data.get('date') > data['end_date']:
            raise serializers.ValidationError("End date cannot be before start date.")
        return data
