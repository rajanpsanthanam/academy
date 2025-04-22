from rest_framework import serializers
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import User, AccessRequest, EmailOTP, Organization
from .utils import verify_otp
from core.exceptions import ValidationError, NotFoundError

User = get_user_model()

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'domain', 'logo', 'theme', 'is_active']
        read_only_fields = ['id', 'created_at', 'updated_at']

class AccessRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessRequest
        fields = '__all__'
        read_only_fields = ['created_at', 'processed_at', 'processed_by']

    def validate_email(self, value):
        # Check if user already exists
        if User.objects.filter(email=value).exists():
            raise ValidationError("A user with this email already exists")
        return value

class EmailOTPSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailOTP
        fields = ['email', 'otp', 'purpose']
        extra_kwargs = {
            'email': {'required': True},
            'otp': {'required': False},  # Make otp optional for request_otp
            'purpose': {'required': True}
        }

    def validate(self, data):
        # For verify_otp, otp is required
        if self.context.get('action') == 'verify_otp' and not data.get('otp'):
            raise serializers.ValidationError({'otp': 'This field is required.'})
        return data

class UserSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'is_approved',
            'approval_date', 'organization', 'dark_mode', 'is_staff', 'is_superuser',
            'is_active'
        ]
        read_only_fields = ['id', 'is_approved', 'approval_date']

    def validate_email(self, value):
        request = self.context.get('request')
        if request and request.user:
            # Allow users to keep their own email
            if self.instance and self.instance.email == value:
                return value
            # Check if email is already taken by another user
            if User.objects.filter(email=value).exists():
                raise ValidationError("This email is already taken")
        return value

    def create(self, validated_data):
        return super().create(validated_data)

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'dark_mode'] 