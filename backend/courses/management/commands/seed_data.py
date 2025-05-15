from django.core.management.base import BaseCommand
from django.utils import timezone
from courses.models import Course, Module, Lesson, Tag
from users.models import Organization

class Command(BaseCommand):
    help = 'Seeds the database with e-commerce support training courses'

    def handle(self, *args, **options):
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

        # Create tags
        tags = {
            'customer_service': Tag.objects.get_or_create(
                name="Customer Service",
                description="Skills and knowledge for providing excellent customer service"
            )[0],
            'ecommerce': Tag.objects.get_or_create(
                name="E-commerce",
                description="E-commerce platform and operations knowledge"
            )[0],
            'technical': Tag.objects.get_or_create(
                name="Technical Support",
                description="Technical troubleshooting and problem-solving"
            )[0],
            'communication': Tag.objects.get_or_create(
                name="Communication",
                description="Effective communication skills for support"
            )[0]
        }

        # Create or get the main course
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

        # Module 1: Introduction to E-commerce Support
        module1, _ = Module.objects.get_or_create(
            course=course,
            title="Introduction to E-commerce Support",
            defaults={
                "description": "Understanding the fundamentals of e-commerce support and customer service",
                "order": 1
            }
        )

        Lesson.objects.get_or_create(
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

        Lesson.objects.get_or_create(
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

        # Module 2: Customer Service Excellence
        module2, _ = Module.objects.get_or_create(
            course=course,
            title="Customer Service Excellence",
            defaults={
                "description": "Mastering customer service skills for e-commerce support",
                "order": 2
            }
        )

        Lesson.objects.get_or_create(
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

        Lesson.objects.get_or_create(
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

        # Module 3: Technical Support
        module3, _ = Module.objects.get_or_create(
            course=course,
            title="Technical Support Fundamentals",
            defaults={
                "description": "Essential technical skills for e-commerce support",
                "order": 3
            }
        )

        Lesson.objects.get_or_create(
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

        Lesson.objects.get_or_create(
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

        self.stdout.write(self.style.SUCCESS('Successfully seeded support training courses')) 