from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from courses.models import Course, Module, Lesson, Tag, Assessment, FileSubmissionAssessment
from users.models import Organization, User

class Command(BaseCommand):
    help = 'Seeds the database with e-commerce support training courses'

    def handle(self, *args, **options):
        try:
            with transaction.atomic():
                # Create or get the Bytemeal organization
                organization, created = Organization.objects.get_or_create(
                    name="Bytemeal",
                    domain="bytemeal.com",
                    defaults={
                        "is_active": True
                    }
                )
                
                if created:
                    self.stdout.write(self.style.SUCCESS('Created new Bytemeal organization'))
                else:
                    self.stdout.write(self.style.SUCCESS('Using existing Bytemeal organization'))

                # Create default users for Bytemeal
                # Normal user
                normal_user, created = User.objects.get_or_create(
                    email="user@bytemeal.com",
                    defaults={
                        "organization": organization,
                        "is_approved": True,
                        "approval_date": timezone.now(),
                        "is_active": True
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS('Created new normal user: user@bytemeal.com'))
                else:
                    self.stdout.write(self.style.SUCCESS('Using existing normal user: user@bytemeal.com'))

                # Admin user
                admin_user, created = User.objects.get_or_create(
                    email="admin@bytemeal.com",
                    defaults={
                        "organization": organization,
                        "is_approved": True,
                        "approval_date": timezone.now(),
                        "is_active": True,
                        "is_staff": True
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS('Created new admin user: admin@bytemeal.com'))
                else:
                    self.stdout.write(self.style.SUCCESS('Using existing admin user: admin@bytemeal.com'))

                # Create tags with unique constraints
                tags = {}
                tag_data = {
                    'customer_service': {
                        'name': "Customer Service",
                        'description': "Skills and knowledge for providing excellent customer service"
                    },
                    'ecommerce': {
                        'name': "E-commerce",
                        'description': "E-commerce platform and operations knowledge"
                    },
                    'technical': {
                        'name': "Technical Support",
                        'description': "Technical troubleshooting and problem-solving"
                    },
                    'communication': {
                        'name': "Communication",
                        'description': "Effective communication skills for support"
                    }
                }

                for key, data in tag_data.items():
                    tag, created = Tag.objects.get_or_create(
                        name=data['name'],
                        defaults={'description': data['description']}
                    )
                    tags[key] = tag
                    if created:
                        self.stdout.write(self.style.SUCCESS(f'Created new tag: {data["name"]}'))
                    else:
                        self.stdout.write(self.style.SUCCESS(f'Using existing tag: {data["name"]}'))

                # Create or get the main course with unique constraint
                course, created = Course.objects.get_or_create(
                    organization=organization,
                    title="E-commerce Support Fundamentals",
                    defaults={
                        "description": "A comprehensive course covering essential skills and knowledge for supporting e-commerce customers and operations.",
                        "status": "PUBLISHED"
                    }
                )
                
                if created:
                    course.tags.add(tags['customer_service'], tags['ecommerce'])
                    self.stdout.write(self.style.SUCCESS('Created new course: E-commerce Support Fundamentals'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'Using existing course: {course.title}'))

                # Create course assessment with unique constraint
                assessment, created = Assessment.objects.get_or_create(
                    assessable_type='Course',
                    assessable_id=course.id,
                    defaults={
                        "title": "E-commerce Support Fundamentals Assessment",
                        "description": "Final assessment to evaluate understanding of e-commerce support fundamentals",
                        "assessment_type": "FILE_SUBMISSION",
                        "organization": organization
                    }
                )
                
                if created:
                    # Create file submission details for the assessment
                    FileSubmissionAssessment.objects.create(
                        assessment=assessment,
                        allowed_file_types=['pdf', 'doc', 'docx'],
                        max_file_size_mb=5,
                        submission_instructions="Please submit your answers in a document format. Include your name and date in the document header."
                    )
                    self.stdout.write(self.style.SUCCESS('Created new assessment for E-commerce Support Fundamentals'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'Using existing assessment: {assessment.title}'))

                # Module 1: Introduction to E-commerce Support
                module1, created = Module.objects.get_or_create(
                    course=course,
                    title="Introduction to E-commerce Support",
                    defaults={
                        "description": "Understanding the fundamentals of e-commerce support and customer service",
                        "order": 1
                    }
                )

                if created:
                    self.stdout.write(self.style.SUCCESS(f'Created new module: {module1.title}'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'Using existing module: {module1.title}'))

                # Create lessons for module 1
                lesson1, created = Lesson.objects.get_or_create(
                    module=module1,
                    title="The Role of E-commerce Support",
                    defaults={
                        "description": "Understanding the importance and responsibilities of e-commerce support",
                        "content": """
# The Role of E-commerce Support

## Key Responsibilities
- Handling customer inquiries and complaints
- Processing orders and managing returns
- Providing product information
- Resolving technical issues
- Maintaining customer satisfaction

## Impact on Business
- Customer retention
- Brand reputation
- Sales conversion
- Customer loyalty

## Best Practices
- Quick response times
- Clear communication
- Problem-solving approach
- Product knowledge
- Technical proficiency
                        """,
                        "order": 1
                    }
                )

                if created:
                    self.stdout.write(self.style.SUCCESS(f'Created new lesson: {lesson1.title}'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'Using existing lesson: {lesson1.title}'))

                lesson2, created = Lesson.objects.get_or_create(
                    module=module1,
                    title="E-commerce Platforms Overview",
                    defaults={
                        "description": "Understanding different e-commerce platforms and their features",
                        "content": """
# E-commerce Platforms Overview

## Common Platforms
- Shopify
- WooCommerce
- Magento
- BigCommerce
- Custom Solutions

## Key Features
- Product management
- Order processing
- Payment gateways
- Shipping integration
- Customer accounts

## Platform-Specific Support
- Common issues
- Troubleshooting steps
- Platform updates
- Integration support
                        """,
                        "order": 2
                    }
                )

                if created:
                    self.stdout.write(self.style.SUCCESS(f'Created new lesson: {lesson2.title}'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'Using existing lesson: {lesson2.title}'))

                # Module 2: Customer Service Excellence
                module2, created = Module.objects.get_or_create(
                    course=course,
                    title="Customer Service Excellence",
                    defaults={
                        "description": "Mastering customer service skills for e-commerce support",
                        "order": 2
                    }
                )

                if created:
                    self.stdout.write(self.style.SUCCESS(f'Created new module: {module2.title}'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'Using existing module: {module2.title}'))

                # Create lessons for module 2
                lesson3, created = Lesson.objects.get_or_create(
                    module=module2,
                    title="Effective Communication",
                    defaults={
                        "description": "Learning to communicate effectively with customers",
                        "content": """
# Effective Communication in E-commerce Support

## Communication Channels
- Email
- Live chat
- Phone support
- Social media
- Ticket systems

## Best Practices
- Clear and concise language
- Professional tone
- Active listening
- Empathy
- Solution-oriented responses

## Common Scenarios
- Order inquiries
- Technical issues
- Complaints
- Returns and refunds
- Product information
                        """,
                        "order": 1
                    }
                )

                if created:
                    self.stdout.write(self.style.SUCCESS(f'Created new lesson: {lesson3.title}'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'Using existing lesson: {lesson3.title}'))

                lesson4, created = Lesson.objects.get_or_create(
                    module=module2,
                    title="Handling Difficult Customers",
                    defaults={
                        "description": "Techniques for managing challenging customer interactions",
                        "content": """
# Handling Difficult Customers

## Understanding Customer Frustration
- Common pain points
- Emotional triggers
- Expectation management

## De-escalation Techniques
- Active listening
- Empathy
- Clear communication
- Solution focus
- Follow-up

## Best Practices
- Stay calm and professional
- Acknowledge concerns
- Offer solutions
- Document interactions
- Escalate when necessary
                        """,
                        "order": 2
                    }
                )

                if created:
                    self.stdout.write(self.style.SUCCESS(f'Created new lesson: {lesson4.title}'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'Using existing lesson: {lesson4.title}'))

                # Module 3: Technical Support
                module3, created = Module.objects.get_or_create(
                    course=course,
                    title="Technical Support Fundamentals",
                    defaults={
                        "description": "Essential technical skills for e-commerce support",
                        "order": 3
                    }
                )

                if created:
                    self.stdout.write(self.style.SUCCESS(f'Created new module: {module3.title}'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'Using existing module: {module3.title}'))

                # Create lessons for module 3
                lesson5, created = Lesson.objects.get_or_create(
                    module=module3,
                    title="Common Technical Issues",
                    defaults={
                        "description": "Understanding and resolving common technical problems",
                        "content": """
# Common Technical Issues in E-commerce

## Website Issues
- Payment processing
- Checkout problems
- Account access
- Mobile responsiveness
- Browser compatibility

## Order Processing
- Payment failures
- Shipping issues
- Inventory problems
- Order status updates

## Troubleshooting Steps
- Problem identification
- Root cause analysis
- Solution implementation
- Verification
- Documentation
                        """,
                        "order": 1
                    }
                )

                if created:
                    self.stdout.write(self.style.SUCCESS(f'Created new lesson: {lesson5.title}'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'Using existing lesson: {lesson5.title}'))

                lesson6, created = Lesson.objects.get_or_create(
                    module=module3,
                    title="Security and Privacy",
                    defaults={
                        "description": "Understanding security and privacy in e-commerce",
                        "content": """
# Security and Privacy in E-commerce

## Security Best Practices
- Password management
- Account security
- Payment security
- Data protection

## Privacy Regulations
- GDPR compliance
- Data handling
- Customer information
- Privacy policies

## Security Incidents
- Identification
- Response procedures
- Customer communication
- Prevention measures
                        """,
                        "order": 2
                    }
                )

                if created:
                    self.stdout.write(self.style.SUCCESS(f'Created new lesson: {lesson6.title}'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'Using existing lesson: {lesson6.title}'))

                self.stdout.write(self.style.SUCCESS('Successfully seeded support training courses'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding data: {str(e)}'))
            raise 