from django.core.management.base import BaseCommand
from django.apps import apps
from django.contrib.auth import get_user_model
from django.db import models

class Command(BaseCommand):
    help = 'Cleans all models in the database while preserving the superuser'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force the operation without confirmation',
        )

    def handle(self, *args, **options):
        if not options['force']:
            confirm = input('''
                You have requested to clean all models in the database.
                This will DELETE ALL DATA except superusers.
                Are you sure you want to do this?
                Type 'yes' to continue, or 'no' to cancel: ''')
            if confirm != 'yes':
                self.stdout.write(self.style.ERROR('Operation cancelled.'))
                return

        User = get_user_model()
        superuser_ids = list(User.objects.filter(is_superuser=True).values_list('id', flat=True))

        # Get all models except the User model
        all_models = apps.get_models()
        for model in all_models:
            if model == User:
                # For User model, delete all non-superusers
                User.objects.exclude(id__in=superuser_ids).delete()
                self.stdout.write(self.style.SUCCESS(f'Cleaned User model (preserved {len(superuser_ids)} superusers)'))
            elif not model._meta.abstract and not model._meta.proxy:
                # For all other models, delete all records
                model.objects.all().delete()
                self.stdout.write(self.style.SUCCESS(f'Cleaned {model.__name__} model'))

        self.stdout.write(self.style.SUCCESS('Successfully cleaned all models while preserving superusers')) 