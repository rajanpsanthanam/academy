from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from courses.models import Course, Module, Lesson, Tag, CourseEnrollment, Assessment
from users.models import Organization, AccessRequest, EmailOTP
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Clears all data from courses and users apps while preserving superusers'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force the operation without confirmation',
        )

    def handle(self, *args, **options):
        if not options['force']:
            confirm = input('''
                WARNING: This will delete ALL data from courses and users apps except superusers.
                This operation cannot be undone.
                Are you sure you want to continue? [y/N]: 
            ''')
            if confirm.lower() != 'y':
                self.stdout.write(self.style.ERROR('Operation cancelled.'))
                return

        try:
            with transaction.atomic():
                # Store superuser emails
                superuser_emails = set(User.objects.filter(is_superuser=True).values_list('email', flat=True))
                
                # Clear courses app models
                self.stdout.write('Clearing courses app data...')
                CourseEnrollment.objects.all().delete()
                Assessment.objects.all().delete()
                Lesson.objects.all().delete()
                Module.objects.all().delete()
                Course.objects.all().delete()
                Tag.objects.all().delete()
                
                # Clear users app models
                self.stdout.write('Clearing users app data...')
                EmailOTP.objects.all().delete()
                AccessRequest.objects.all().delete()
                
                # Delete all users except superusers
                User.objects.exclude(email__in=superuser_emails).delete()
                
                # Delete all organizations
                Organization.objects.all().delete()
                
                self.stdout.write(self.style.SUCCESS('Successfully cleared all data while preserving superusers.'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An error occurred: {str(e)}')) 