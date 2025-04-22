from django.core.management.base import BaseCommand
from courses.models import Tag, Course

class Command(BaseCommand):
    help = 'Adds common tags to existing courses'

    def handle(self, *args, **kwargs):
        # Create common tags
        tags = {
            'programming': 'Programming and software development related courses',
            'data-science': 'Data science, machine learning, and analytics courses',
            'cloud': 'Cloud computing and infrastructure courses',
            'web': 'Web development and design courses',
            'mobile': 'Mobile app development courses',
            'devops': 'DevOps and system administration courses',
            'security': 'Cybersecurity and information security courses',
            'database': 'Database management and design courses',
            'ai': 'Artificial Intelligence and Machine Learning courses',
            'blockchain': 'Blockchain and cryptocurrency courses'
        }

        # Create or update tags
        for name, description in tags.items():
            tag, created = Tag.objects.get_or_create(
                name=name,
                defaults={'description': description}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created tag: {name}'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Tag already exists: {name}'))

        # Add tags to courses based on their titles and descriptions
        for course in Course.objects.all():
            course_tags = []
            
            # Programming related
            if any(keyword in course.title.lower() or keyword in course.description.lower() 
                  for keyword in ['python', 'javascript', 'java', 'c++', 'programming', 'coding']):
                course_tags.append('programming')
            
            # Data Science related
            if any(keyword in course.title.lower() or keyword in course.description.lower() 
                  for keyword in ['data science', 'machine learning', 'analytics', 'data analysis']):
                course_tags.append('data-science')
            
            # Cloud related
            if any(keyword in course.title.lower() or keyword in course.description.lower() 
                  for keyword in ['aws', 'cloud', 'azure', 'gcp', 'google cloud']):
                course_tags.append('cloud')
            
            # Web related
            if any(keyword in course.title.lower() or keyword in course.description.lower() 
                  for keyword in ['web', 'frontend', 'backend', 'react', 'angular', 'vue']):
                course_tags.append('web')
            
            # Mobile related
            if any(keyword in course.title.lower() or keyword in course.description.lower() 
                  for keyword in ['mobile', 'android', 'ios', 'flutter', 'react native']):
                course_tags.append('mobile')
            
            # DevOps related
            if any(keyword in course.title.lower() or keyword in course.description.lower() 
                  for keyword in ['devops', 'docker', 'kubernetes', 'ci/cd']):
                course_tags.append('devops')
            
            # Security related
            if any(keyword in course.title.lower() or keyword in course.description.lower() 
                  for keyword in ['security', 'cybersecurity', 'hacking', 'penetration testing']):
                course_tags.append('security')
            
            # Database related
            if any(keyword in course.title.lower() or keyword in course.description.lower() 
                  for keyword in ['database', 'sql', 'mongodb', 'postgresql']):
                course_tags.append('database')
            
            # AI related
            if any(keyword in course.title.lower() or keyword in course.description.lower() 
                  for keyword in ['ai', 'artificial intelligence', 'deep learning', 'neural network']):
                course_tags.append('ai')
            
            # Blockchain related
            if any(keyword in course.title.lower() or keyword in course.description.lower() 
                  for keyword in ['blockchain', 'cryptocurrency', 'bitcoin', 'ethereum']):
                course_tags.append('blockchain')

            # Add tags to course
            if course_tags:
                tags_to_add = Tag.objects.filter(name__in=course_tags)
                course.tags.add(*tags_to_add)
                self.stdout.write(self.style.SUCCESS(f'Added tags to course: {course.title} - {", ".join(course_tags)}')) 