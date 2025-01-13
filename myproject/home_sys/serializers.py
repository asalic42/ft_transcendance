from rest_framework import serializers
from .models import SoloCasseBrique

class SoloCasseBriqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = SoloCasseBrique
        fields = '__all__'