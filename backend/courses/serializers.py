from rest_framework import serializers
from .models import Course, Module, Lesson, CourseEnrollment, Tag, Assessment, FileSubmissionAssessment, FileSubmission
from core.exceptions import ValidationError
import re
import logging

logger = logging.getLogger(__name__)

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['id', 'title', 'description', 'content', 'order', 'module', 'created_at', 'updated_at', 'deleted_at']
        read_only_fields = ['created_at', 'updated_at']
        extra_kwargs = {
            'content': {'required': False, 'allow_blank': True}
        }

    def validate_content(self, value):
        # Remove potentially problematic HTML elements
        if value:
            sanitized = value
            sanitized = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', sanitized, flags=re.IGNORECASE)
            sanitized = re.sub(r'<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>', '', sanitized, flags=re.IGNORECASE)
            sanitized = re.sub(r'<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>', '', sanitized, flags=re.IGNORECASE)
            return sanitized
        return ''

    def validate(self, data):
        # Ensure the module belongs to the user's organization
        request = self.context.get('request')
        if request and request.user:
            module = data.get('module')
            if module and module.course.organization != request.user.organization:
                raise ValidationError("You don't have permission to modify this lesson")
        return data

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def validate_name(self, value):
        # Convert name to lowercase for consistency
        return value.lower()

class ModuleSerializer(serializers.ModelSerializer):
    lessons = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_lessons(self, obj):
        request = self.context.get('request')
        show_deleted = request and request.query_params.get('show_deleted', 'false').lower() == 'true'
        
        # Use the Lesson model's all_objects manager directly
        from .models import Lesson
        if show_deleted:
            lessons = Lesson.all_objects.filter(module=obj)
        else:
            lessons = Lesson.all_objects.filter(module=obj, deleted_at__isnull=True)
            
        return LessonSerializer(lessons, many=True).data

    def validate(self, data):
        # Ensure the course belongs to the user's organization
        request = self.context.get('request')
        if request and request.user:
            course = data.get('course')
            if course and course.organization != request.user.organization:
                raise ValidationError("You don't have permission to modify this module")
        return data

class CourseSerializer(serializers.ModelSerializer):
    modules = serializers.SerializerMethodField()
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    organization_domain = serializers.CharField(source='organization.domain', read_only=True)
    enrollment = serializers.SerializerMethodField()
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    active_enrollments_count = serializers.SerializerMethodField()
    assessments = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'organization', 'organization_name', 'organization_domain', 
                 'title', 'description', 'status', 'tags', 'tag_ids',
                 'created_at', 'updated_at', 'modules', 'enrollment', 
                 'active_enrollments_count', 'deleted_at', 'assessments']
        read_only_fields = ['organization', 'organization_name', 'organization_domain', 
                          'created_at', 'updated_at', 'active_enrollments_count']

    def get_modules(self, obj):
        request = self.context.get('request')
        show_deleted = request and request.query_params.get('show_deleted', 'false').lower() == 'true'
        
        # Use the Module model's all_objects manager directly
        from .models import Module
        if show_deleted:
            modules = Module.all_objects.filter(course=obj)
        else:
            modules = Module.all_objects.filter(course=obj, deleted_at__isnull=True)
            
        return ModuleSerializer(modules, many=True, context=self.context).data

    def get_enrollment(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Get the latest enrollment for this user and course
            enrollment = CourseEnrollment.objects.filter(
                user=request.user,
                course=obj
            ).order_by('-enrolled_at').first()
            
            if enrollment:
                return CourseEnrollmentSerializer(enrollment).data
        return None

    def get_active_enrollments_count(self, obj):
        return CourseEnrollment.objects.filter(
            course=obj,
            status='ENROLLED'
        ).count()

    def get_assessments(self, obj):
        request = self.context.get('request')
        show_deleted = request and request.query_params.get('show_deleted', 'false').lower() == 'true'
        
        from .models import Assessment
        if show_deleted:
            assessments = Assessment.all_objects.filter(
                assessable_type='Course',
                assessable_id=obj.id
            )
        else:
            assessments = Assessment.all_objects.filter(
                assessable_type='Course',
                assessable_id=obj.id,
                deleted_at__isnull=True
            )
            
        return AssessmentSerializer(assessments, many=True, context=self.context).data

    def validate_title(self, value):
        request = self.context.get('request')
        if request and request.user:
            organization = request.user.organization
            # Check if a course with this title already exists in the organization
            existing_course = Course.objects.filter(organization=organization, title=value).first()
            if existing_course and (not self.instance or self.instance.id != existing_course.id):
                logger.error(f"Title validation failed: Course with title '{value}' already exists in organization")
                raise ValidationError("A course with this title already exists in your organization")
        return value

    def validate_organization(self, value):
        request = self.context.get('request')
        if request and request.user:
            if value != request.user.organization:
                logger.error(f"Organization validation failed: User {request.user.email} cannot create courses for organization {value.name}")
                raise ValidationError("You can only create courses for your own organization")
        return value

    def validate_tag_ids(self, value):
        if value:
            # Verify all tag IDs exist
            existing_tags = Tag.objects.filter(id__in=value)
            if len(existing_tags) != len(value):
                logger.error(f"Tag validation failed: Invalid tag IDs provided")
                raise ValidationError("One or more tag IDs are invalid")
        return value

    def validate_status(self, value):
        instance = getattr(self, 'instance', None)
        if instance and value != instance.status:
            # Check if changing to DRAFT
            if value == 'DRAFT':
                active_enrollments = CourseEnrollment.objects.filter(
                    course=instance,
                    status='ENROLLED'
                ).count()
                if active_enrollments > 0:
                    # Instead of preventing the change, we'll allow it but log a warning
                    logger.warning(
                        f"Course {instance.id} is being switched to draft mode with {active_enrollments} active enrollments"
                    )
                    # TODO: Add notification system here to inform enrolled users
        return value

    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        course = super().create(validated_data)
        if tag_ids:
            course.tags.set(tag_ids)
        return course

    def update(self, instance, validated_data):
        logger.info(f"Updating course {instance.id} with data: {validated_data}")
        try:
            # Check if trying to soft delete
            if 'deleted_at' in validated_data and validated_data['deleted_at'] is not None:
                active_enrollments = CourseEnrollment.objects.filter(
                    course=instance,
                    status='ENROLLED'
                ).count()
                if active_enrollments > 0:
                    logger.error(f"Delete validation failed: Cannot delete course with {active_enrollments} active enrollments")
                    raise ValidationError(
                        f"Cannot delete course. There are {active_enrollments} active enrollments."
                    )

            tag_ids = validated_data.pop('tag_ids', None)
            course = super().update(instance, validated_data)
            if tag_ids is not None:
                course.tags.set(tag_ids)
            return course
        except ValidationError as e:
            logger.error(f"Validation error during course update: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during course update: {str(e)}")
            raise

class CourseEnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = CourseEnrollment
        fields = ['id', 'user', 'user_email', 'course', 'course_title', 'status', 
                 'progress', 'enrolled_at', 'completed_at', 'dropped_at', 'last_accessed_at']
        read_only_fields = ['user', 'user_email', 'progress', 'enrolled_at', 
                          'completed_at', 'dropped_at', 'last_accessed_at']

    def validate_course(self, value):
        request = self.context.get('request')
        if request and request.user:
            # Ensure course belongs to user's organization
            if value.organization != request.user.organization:
                raise ValidationError("You can only enroll in courses from your organization")
            
            # For new enrollments, ensure course is published and not deleted
            if not self.instance and (value.status != 'PUBLISHED' or value.deleted_at is not None):
                raise ValidationError("You can only enroll in published courses")
            
            # Check if user is already actively enrolled
            active_enrollment = CourseEnrollment.objects.filter(
                user=request.user,
                course=value,
                status='ENROLLED'
            ).exists()
            
            if not self.instance and active_enrollment:
                raise ValidationError("You are already enrolled in this course")

        return value

    def validate_status(self, value):
        if value not in ['ENROLLED', 'COMPLETED', 'DROPPED']:
            raise ValidationError("Invalid enrollment status")
        return value

class AssessmentSerializer(serializers.ModelSerializer):
    file_submission = serializers.SerializerMethodField()
    file_submission_config = serializers.JSONField(write_only=True, required=False)

    class Meta:
        model = Assessment
        fields = ['id', 'assessable_type', 'assessable_id', 'title', 'description', 
                 'assessment_type', 'file_submission', 'file_submission_config', 'created_at', 'updated_at', 'deleted_at']
        read_only_fields = ['created_at', 'updated_at', 'deleted_at']

    def get_file_submission(self, obj):
        if obj.assessment_type == 'FILE_SUBMISSION':
            try:
                file_submission = obj.file_submission
                return FileSubmissionAssessmentSerializer(file_submission).data
            except FileSubmissionAssessment.DoesNotExist:
                return None
        return None

    def validate(self, data):
        if data.get('assessment_type') == 'FILE_SUBMISSION':
            file_submission_config = data.get('file_submission_config')
            if not file_submission_config:
                raise serializers.ValidationError("File submission configuration is required for FILE_SUBMISSION type")
            
            required_fields = ['allowed_file_types', 'max_file_size_mb']
            for field in required_fields:
                if field not in file_submission_config:
                    raise serializers.ValidationError(f"Missing required field in file submission config: {field}")
            
            if not isinstance(file_submission_config['allowed_file_types'], list):
                raise serializers.ValidationError("allowed_file_types must be a list")
            
            if not isinstance(file_submission_config['max_file_size_mb'], (int, float)):
                raise serializers.ValidationError("max_file_size_mb must be a number")
        
        return data

class FileSubmissionAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileSubmissionAssessment
        fields = ['id', 'allowed_file_types', 'max_file_size_mb', 'submission_instructions',
                 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def validate_allowed_file_types(self, value):
        if not isinstance(value, list):
            raise ValidationError("allowed_file_types must be a list")
        for ext in value:
            if not isinstance(ext, str) or not ext.isalnum():
                raise ValidationError("File extensions must be alphanumeric strings")
        return value

class FileSubmissionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = FileSubmission
        fields = ['id', 'assessment', 'user', 'user_email', 'file_name', 'file_path', 
                 'file_size', 'submitted_at', 'file_url', 'created_at', 'updated_at']
        read_only_fields = ['user', 'file_path', 'file_size', 'submitted_at', 
                          'created_at', 'updated_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/{obj.file_path}')
        return None 