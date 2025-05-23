from django.db import models
import uuid
from users.models import Organization, User
from django.utils import timezone

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Course(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        related_name='courses',
        on_delete=models.CASCADE
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=[
            ('DRAFT', 'Draft'),
            ('PUBLISHED', 'Published'),
            ('ARCHIVED', 'Archived')
        ],
        default='DRAFT'
    )
    tags = models.ManyToManyField(Tag, related_name='courses', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()  # Manager to access all courses including deleted ones

    class Meta:
        ordering = ['-created_at']
        # Ensure title is unique within an organization
        unique_together = ['organization', 'title']

    def __str__(self):
        return f"{self.organization.name} - {self.title}"

    def delete(self, *args, **kwargs):
        self.deleted_at = timezone.now()
        self.save()
        # Soft delete all modules in this course
        self.modules.all().update(deleted_at=timezone.now())
        # Soft delete all lessons in these modules
        Lesson.all_objects.filter(module__course=self).update(deleted_at=timezone.now())

    def has_file_submission_assessments(self):
        """Check if the course has any file submission assessments"""
        return Assessment.objects.filter(
            assessable_type='Course',
            assessable_id=self.id,
            assessment_type='FILE_SUBMISSION',
            deleted_at__isnull=True
        ).exists()

    def has_assessments(self):
        """Check if the course has any assessments"""
        return Assessment.objects.filter(
            assessable_type='Course',
            assessable_id=self.id,
            deleted_at__isnull=True
        ).exists()

class Module(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, related_name='modules', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    order = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.course.title} - {self.title}"

    def delete(self, *args, **kwargs):
        self.deleted_at = timezone.now()
        self.save()
        # Soft delete all lessons in this module
        Lesson.all_objects.filter(module=self).update(deleted_at=timezone.now())

class Lesson(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(Module, related_name='lessons', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    content = models.TextField()
    order = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.module.title} - {self.title}"

    def delete(self, *args, **kwargs):
        self.deleted_at = timezone.now()
        self.save()

class CourseEnrollment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        related_name='course_enrollments',
        on_delete=models.CASCADE,
        db_index=True
    )
    course = models.ForeignKey(
        Course,
        related_name='enrollments',
        on_delete=models.CASCADE,
        db_index=True
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('ENROLLED', 'Enrolled'),
            ('COMPLETED', 'Completed'),
            ('DROPPED', 'Dropped')
        ],
        default='ENROLLED',
        db_index=True
    )
    progress = models.FloatField(default=0.0)  # Percentage of course completed
    enrolled_at = models.DateTimeField(auto_now_add=True, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    dropped_at = models.DateTimeField(null=True, blank=True)
    last_accessed_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-enrolled_at']
        indexes = [
            models.Index(fields=['user', 'course'], name='user_course_idx'),
            models.Index(fields=['status', 'enrolled_at'], name='enrollment_status_idx'),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.course.title}"

class Assessment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'users.Organization',
        related_name='assessments',
        on_delete=models.CASCADE,
        db_index=True
    )
    assessable_type = models.CharField(max_length=50)  # 'Course', 'Module', or 'Lesson'
    assessable_id = models.UUIDField()
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)  # Making it optional with blank=True
    assessment_type = models.CharField(
        max_length=50,
        choices=[
            ('FILE_SUBMISSION', 'File Submission'),
            # Add more assessment types here as needed
        ],
        default='FILE_SUBMISSION'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['assessable_type', 'assessable_id'], name='assessable_idx'),
            models.Index(fields=['organization'], name='assessment_org_idx'),
        ]

    def __str__(self):
        return f"{self.title} - {self.assessable_type}"

    def delete(self, *args, **kwargs):
        self.deleted_at = timezone.now()
        self.save()

class FileSubmissionAssessment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assessment = models.OneToOneField(
        Assessment,
        related_name='file_submission',
        on_delete=models.CASCADE
    )
    allowed_file_types = models.JSONField(
        default=list,
        help_text="List of allowed file extensions (e.g., ['pdf', 'doc', 'docx'])"
    )
    max_file_size_mb = models.PositiveIntegerField(
        default=10,
        help_text="Maximum file size in megabytes"
    )
    submission_instructions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"File Submission for {self.assessment.title}"

class FileSubmission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assessment = models.ForeignKey(
        Assessment,
        related_name='submissions',
        on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        'users.User',
        related_name='file_submissions',
        on_delete=models.CASCADE
    )
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=512)
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    submitted_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.user.email} - {self.assessment.title} - {self.file_name}"
