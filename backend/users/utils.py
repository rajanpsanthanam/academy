import random
import string
from datetime import datetime, timedelta
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import EmailOTP

def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

def send_otp_email(email, otp, purpose):
    """Send OTP via email"""
    subject = f'Your {purpose.title()} OTP'
    message = f'Your OTP for {purpose} is: {otp}\nValid for 5 minutes.'
    
    try:
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

def create_and_send_otp(email, purpose):
    """Create and send a new OTP"""
    try:
        # Delete any existing unused OTPs for this email and purpose
        EmailOTP.objects.filter(email=email, purpose=purpose, is_used=False).delete()
        
        otp = generate_otp()
        expires_at = timezone.now() + timedelta(minutes=5)
        
        # Create new OTP
        email_otp = EmailOTP.objects.create(
            email=email,
            otp=otp,
            purpose=purpose,
            expires_at=expires_at
        )
        
        # Send OTP via email
        if send_otp_email(email, otp, purpose):
            return email_otp
        
        # If email sending fails, delete the OTP and return None
        email_otp.delete()
        return None
    except Exception as e:
        print(f"Error in create_and_send_otp: {str(e)}")
        raise e

def verify_otp(email, otp, purpose):
    """Verify if OTP is valid"""
    email_otp = EmailOTP.objects.filter(
        email=email,
        otp=otp,
        purpose=purpose,
        is_used=False,
        expires_at__gt=timezone.now()
    ).first()
    
    if email_otp:
        email_otp.is_used = True
        email_otp.save()
        return True
    
    return False 