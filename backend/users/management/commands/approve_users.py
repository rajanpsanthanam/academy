from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import AccessRequest, User

class Command(BaseCommand):
    help = 'Approves all pending access requests and creates user accounts with proper organization assignment'

    def handle(self, *args, **options):
        # Get all pending access requests
        pending_requests = AccessRequest.objects.filter(status='pending')
        
        if not pending_requests.exists():
            self.stdout.write(self.style.WARNING('No pending access requests found.'))
            return

        approved_count = 0
        failed_count = 0

        for request in pending_requests:
            try:
                # Check if user already exists
                if User.objects.filter(email=request.email).exists():
                    self.stdout.write(
                        self.style.WARNING(f'User already exists for {request.email}. Skipping.')
                    )
                    continue

                # Create user with organization using CustomUserManager
                user = User.objects.create_user(
                    email=request.email,
                    organization=request.organization,  # This is crucial - setting the organization
                    is_approved=True,
                    approval_date=timezone.now()
                )

                # Update access request status
                request.status = 'approved'
                request.processed_at = timezone.now()
                request.save()

                approved_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully created user for {request.email} with organization {request.organization.name}')
                )

            except Exception as e:
                failed_count += 1
                self.stdout.write(
                    self.style.ERROR(f'Failed to process request for {request.email}: {str(e)}')
                )

        # Print summary
        self.stdout.write('\nSummary:')
        self.stdout.write(self.style.SUCCESS(f'Successfully approved: {approved_count}'))
        if failed_count:
            self.stdout.write(self.style.ERROR(f'Failed to approve: {failed_count}')) 