from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets
from django.http import Http404
from .models import Course, Module, Lesson, CourseEnrollment, Tag, User
from .serializers import CourseSerializer, ModuleSerializer, LessonSerializer, CourseEnrollmentSerializer, TagSerializer
from core.exceptions import ValidationError, NotFoundError, ServerError, APIError, PermissionError
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from core.permissions import OrganizationPermission, OrganizationAdminPermission
from rest_framework.decorators import action
from django.utils import timezone
from django.db import transaction, IntegrityError
from django.db.models import Q
from rest_framework.views import APIView
import logging

logger = logging.getLogger(__name__)

# Create your views here.

class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated, OrganizationPermission]
    pagination_class = None  # Use global pagination settings

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        logger.info("=== Starting get_queryset ===")
        logger.info(f"User: {self.request.user.email}, is_staff: {self.request.user.is_staff}")
        
        # For admin users, use all_objects to access all courses including deleted ones
        if self.request.user.is_staff:
            queryset = Course.all_objects.filter(organization=self.request.user.organization)
            logger.info(f"Initial queryset count (all_objects): {queryset.count()}")
            
            # Handle show_deleted parameter
            show_deleted = self.request.query_params.get('show_deleted', 'false').lower() == 'true'
            logger.info(f"show_deleted parameter: {show_deleted}")
            
            # Handle status filter
            status = self.request.query_params.get('status', None)
            if status:
                queryset = queryset.filter(status=status)
                logger.info(f"Filtered by status: {status}")
            
            # Handle search query
            search = self.request.query_params.get('search', None)
            if search:
                queryset = queryset.filter(
                    Q(title__icontains=search) | 
                    Q(description__icontains=search) |
                    Q(tags__name__icontains=search)
                ).distinct()
                logger.info(f"Filtered by search: {search}")
            
            # Handle ordering
            ordering = self.request.query_params.get('ordering', '-created_at')
            if ordering:
                queryset = queryset.order_by(ordering)
                logger.info(f"Ordering by: {ordering}")
            
            if not show_deleted:
                queryset = queryset.filter(deleted_at__isnull=True)
                logger.info(f"Filtered out deleted courses. New count: {queryset.count()}")
        else:
            # For normal users, use the default manager which already filters out deleted courses
            queryset = Course.objects.filter(
                organization=self.request.user.organization,
                status='PUBLISHED'
            )
            logger.info(f"Normal user queryset count: {queryset.count()}")
        
        logger.info(f"Final queryset count: {queryset.count()}")
        logger.info("=== End get_queryset ===")
        return queryset

    def get_object(self):
        try:
            # Use all_objects to access soft-deleted courses
            if self.request.user.is_staff:
                queryset = Course.all_objects.filter(organization=self.request.user.organization)
            else:
                queryset = Course.objects.filter(organization=self.request.user.organization)
            
            # Get the course by ID
            course = get_object_or_404(queryset, pk=self.kwargs['pk'])
            return course
        except Http404:
            raise NotFoundError("Course not found")
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to retrieve course")

    def perform_create(self, serializer):
        try:
            # Ensure the organization is set to the user's organization
            serializer.save(organization=self.request.user.organization)
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to create course")

    def perform_update(self, serializer):
        try:
            instance = self.get_object()
            logger.info(f"Attempting to update course {instance.id} with data: {serializer.validated_data}")
            serializer.save()
        except ValidationError as e:
            logger.error(f"Validation error updating course: {str(e)}")
            raise e
        except Exception as e:
            logger.error(f"Unexpected error updating course: {str(e)}")
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to update course")

    def perform_destroy(self, instance):
        logger.info("=== Starting perform_destroy ===")
        logger.info(f"Course ID: {instance.id}, Title: {instance.title}")
        logger.info(f"Current deleted_at value: {instance.deleted_at}")
        
        try:
            # Check for active enrollments before soft deleting
            active_enrollments = CourseEnrollment.objects.filter(
                course=instance,
                status='ENROLLED'
            ).count()
            
            if active_enrollments > 0:
                logger.warning(
                    f"Course {instance.id} is being soft deleted with {active_enrollments} active enrollments"
                )
            
            # Soft delete the course
            logger.info("Setting deleted_at to current time")
            instance.deleted_at = timezone.now()
            instance.save()
            logger.info(f"Updated deleted_at value: {instance.deleted_at}")
            
            # Verify the soft delete
            updated_course = Course.all_objects.get(id=instance.id)
            logger.info(f"Verified deleted_at after save: {updated_course.deleted_at}")
            
            # Soft delete all modules in this course
            modules_count = instance.modules.count()
            logger.info(f"Soft deleting {modules_count} modules")
            for module in instance.modules.all():
                module.deleted_at = timezone.now()
                module.save()
                
                # Soft delete all lessons in this module
                lessons_count = module.lessons.count()
                logger.info(f"Soft deleting {lessons_count} lessons in module {module.id}")
                for lesson in module.lessons.all():
                    lesson.deleted_at = timezone.now()
                    lesson.save()
            
            logger.info("=== End perform_destroy ===")
        except Exception as e:
            logger.error(f"Error in perform_destroy: {str(e)}")
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to delete course")

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        try:
            course = self.get_object()
            if not course.deleted_at:
                raise ValidationError("Course is not deleted")
            
            course.deleted_at = None
            course.save()
            
            # Restore all modules and their lessons using all_objects to access soft-deleted items
            for module in Module.all_objects.filter(course=course):
                module.deleted_at = None
                module.save()
                
                # Restore all lessons in this module
                for lesson in Lesson.all_objects.filter(module=module):
                    lesson.deleted_at = None
                    lesson.save()
            
            serializer = self.get_serializer(course)
            return Response(serializer.data)
        except ValidationError as e:
            raise e
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to restore course")

    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        try:
            course = self.get_object()
            
            # Check if course is published and not deleted
            if course.status != 'PUBLISHED' or course.deleted_at is not None:
                raise ValidationError("Cannot enroll in this course")
            
            try:
                with transaction.atomic():
                    # Create enrollment using serializer for validation
                    serializer = CourseEnrollmentSerializer(
                        data={'course': course.id, 'status': 'ENROLLED'},
                        context={'request': request}
                    )
                    serializer.is_valid(raise_exception=True)
                    
                    # Create the enrollment
                    enrollment = serializer.save(user=request.user)
                    
                    # Return updated course data
                    course_serializer = CourseSerializer(course, context={'request': request})
                    return Response(course_serializer.data, status=status.HTTP_201_CREATED)
            except IntegrityError:
                raise ValidationError("Failed to enroll in course")
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to enroll in course")

    @action(detail=True, methods=['post'])
    def unenroll(self, request, pk=None):
        try:
            course = self.get_object()
            
            try:
                # Get the latest enrollment for this user and course
                enrollment = CourseEnrollment.objects.filter(
                    user=request.user,
                    course=course,
                    status='ENROLLED'  # Only allow unenrolling from ENROLLED status
                ).order_by('-enrolled_at').first()
                
                if not enrollment:
                    raise NotFoundError("You are not enrolled in this course")
                
                # Update the enrollment status
                enrollment.status = 'DROPPED'
                enrollment.dropped_at = timezone.now()
                enrollment.save()
                
                # Return updated course data
                course_serializer = CourseSerializer(course, context={'request': request})
                return Response(course_serializer.data)
            except CourseEnrollment.DoesNotExist:
                raise NotFoundError("You are not enrolled in this course")
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to unenroll from course")

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        try:
            course = self.get_object()
            
            try:
                # Get the latest enrollment for this user and course
                enrollment = CourseEnrollment.objects.filter(
                    user=request.user,
                    course=course,
                    status='ENROLLED'
                ).order_by('-enrolled_at').first()
                
                if not enrollment:
                    raise NotFoundError("You are not enrolled in this course")
                
                print(f"Marking course {course.id} as complete for user {request.user.email}")
                print(f"Current enrollment status: {enrollment.status}")
                
                enrollment.status = 'COMPLETED'
                enrollment.completed_at = timezone.now()
                enrollment.save()
                
                print(f"Updated enrollment status: {enrollment.status}")
                
                # Return updated course data
                course_serializer = CourseSerializer(course, context={'request': request})
                return Response(course_serializer.data)
            except CourseEnrollment.DoesNotExist:
                raise NotFoundError("You are not enrolled in this course")
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to mark course as complete")

    @action(detail=False, methods=['get'])
    def test_soft_delete(self, request):
        """Test endpoint to verify soft delete functionality"""
        try:
            # Get a course to test with
            course = Course.all_objects.filter(organization=request.user.organization).first()
            if not course:
                return Response({"error": "No courses found"}, status=status.HTTP_404_NOT_FOUND)
            
            # Log current state
            logger.info(f"Course {course.id} current deleted_at: {course.deleted_at}")
            
            # Soft delete the course
            course.deleted_at = timezone.now()
            course.save()
            
            # Verify the course is soft deleted
            soft_deleted = Course.all_objects.filter(id=course.id, deleted_at__isnull=False).exists()
            
            return Response({
                "message": "Soft delete test completed",
                "course_id": str(course.id),
                "is_soft_deleted": soft_deleted,
                "deleted_at": course.deleted_at
            })
        except Exception as e:
            logger.error(f"Error in test_soft_delete: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ModuleViewSet(viewsets.ModelViewSet):
    serializer_class = ModuleSerializer
    permission_classes = [IsAuthenticated, OrganizationPermission]

    def get_queryset(self):
        logger.info("=== Starting ModuleViewSet.get_queryset ===")
        logger.info(f"User: {self.request.user.email}, is_staff: {self.request.user.is_staff}")
        logger.info(f"Request query params: {self.request.query_params}")
        logger.info(f"Request path: {self.request.path}")
        logger.info(f"Request method: {self.request.method}")
        logger.info(f"User organization: {self.request.user.organization}")
        
        try:
            course_id = self.kwargs.get('course_id')
            if not course_id:
                raise ValidationError("Course ID is required")
            
            logger.info(f"Course ID: {course_id}")
            
            # First check if the course exists and belongs to the user's organization
            # Use all_objects for admin users to access soft-deleted courses
            if self.request.user.is_staff:
                course = get_object_or_404(Course.all_objects, id=course_id, organization=self.request.user.organization)
            else:
                course = get_object_or_404(Course.objects, id=course_id, organization=self.request.user.organization)
            
            logger.info(f"Found course: {course.title}")
            logger.info(f"Course organization: {course.organization}")
            
            show_deleted = self.request.query_params.get('show_deleted', 'false').lower() == 'true'
            logger.info(f"show_deleted parameter: {show_deleted}")
            
            # For admin users, use all_objects to access all modules including deleted ones
            if self.request.user.is_staff:
                queryset = Module.all_objects.filter(course=course)
                logger.info(f"Using all_objects. Initial count: {queryset.count()}")
                logger.info(f"Deleted modules count: {queryset.filter(deleted_at__isnull=False).count()}")
                logger.info(f"Active modules count: {queryset.filter(deleted_at__isnull=True).count()}")
                
                if not show_deleted:
                    queryset = queryset.filter(deleted_at__isnull=True)
                    logger.info(f"Filtered out deleted modules. New count: {queryset.count()}")
            else:
                # For normal users, use the default manager which already filters out deleted modules
                queryset = Module.objects.filter(course=course)
                logger.info(f"Using default manager. Initial count: {queryset.count()}")
            
            # Log the final queryset SQL
            logger.info(f"Final SQL query: {str(queryset.query)}")
            logger.info(f"Final modules count: {queryset.count()}")
            logger.info("=== End ModuleViewSet.get_queryset ===")
            return queryset.order_by('order')
        except Http404:
            raise NotFoundError("Course not found")
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to retrieve modules")

    def get_object(self):
        try:
            course_id = self.kwargs.get('course_id')
            module_id = self.kwargs.get('pk')
            
            if not course_id or not module_id:
                raise ValidationError("Course ID and Module ID are required")
            
            # First check if the course exists and belongs to the user's organization
            course = get_object_or_404(Course, id=course_id, organization=self.request.user.organization)
            
            # Then get the module, using all_objects for admin users
            if self.request.user.is_staff:
                module = get_object_or_404(Module.all_objects, id=module_id, course=course)
            else:
                module = get_object_or_404(Module.objects, id=module_id, course=course)
            return module
        except Http404:
            raise NotFoundError("Module not found")
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to retrieve module")

    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"Attempting to create module with data: {request.data}")
            course_id = self.kwargs.get('course_id')
            if not course_id:
                logger.error("Course ID is missing from request")
                raise ValidationError("Course ID is required")

            logger.info(f"Looking up course with ID: {course_id}")
            # First check if the course exists and belongs to the user's organization
            course = get_object_or_404(Course, id=course_id, organization=self.request.user.organization)
            logger.info(f"Found course: {course.title}")
            
            # Get the last module's order for this course
            last_module = Module.objects.filter(course=course).order_by('-order').first()
            next_order = (last_module.order + 1) if last_module else 1
            
            # Add order and course to request data
            request_data = request.data.copy()
            request_data['order'] = next_order
            request_data['course'] = course.id
            
            # Validate the request data
            logger.info("Validating request data")
            serializer = self.get_serializer(data=request_data)
            serializer.is_valid(raise_exception=True)
            logger.info("Request data validation successful")
            
            # Save the module
            logger.info("Attempting to save module")
            self.perform_create(serializer)
            logger.info("Module saved successfully")
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Http404:
            logger.error(f"Course not found with ID: {course_id}")
            raise NotFoundError("Course not found")
        except ValidationError as e:
            logger.error(f"Validation error: {str(e)}")
            raise e
        except Exception as e:
            logger.error(f"Unexpected error creating module: {str(e)}", exc_info=True)
            if isinstance(e, APIError):
                raise e
            raise ServerError(f"Failed to create module: {str(e)}")

    def perform_create(self, serializer):
        try:
            logger.info("Starting module save operation")
            serializer.save()
            logger.info("Module save operation completed")
        except Exception as e:
            logger.error(f"Error in perform_create: {str(e)}", exc_info=True)
            if isinstance(e, APIError):
                raise e
            raise ServerError(f"Failed to save module: {str(e)}")

    def perform_update(self, serializer):
        try:
            instance = self.get_object()
            serializer.save()
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to update module")

    def perform_destroy(self, instance):
        logger.info("=== Starting ModuleViewSet.perform_destroy ===")
        logger.info(f"Module ID: {instance.id}, Title: {instance.title}")
        logger.info(f"Current deleted_at value: {instance.deleted_at}")
        
        try:
            # Check for active enrollments
            active_enrollments = instance.course.enrollments.filter(
                status='ENROLLED'
            ).count()
            logger.info(f"Active enrollments count: {active_enrollments}")
            
            if active_enrollments > 0:
                logger.warning(f"Module has {active_enrollments} active enrollments")
            
            # Soft delete the module
            instance.deleted_at = timezone.now()
            instance.save()
            logger.info("Set deleted_at to current time")
            
            # Verify soft delete
            updated_module = Module.all_objects.get(id=instance.id)
            logger.info(f"Verified soft delete - deleted_at: {updated_module.deleted_at}")
            
            # Soft delete all lessons in this module
            lessons_count = instance.lessons.all().update(deleted_at=timezone.now())
            logger.info(f"Soft deleted {lessons_count} lessons in this module")
            
            logger.info("=== End ModuleViewSet.perform_destroy ===")
        except Exception as e:
            logger.error(f"Error in perform_destroy: {str(e)}")
            raise ServerError("Failed to delete module")

    @action(detail=True, methods=['post'])
    def restore(self, request, course_id=None, pk=None):
        logger.info("=== Starting ModuleViewSet.restore ===")
        logger.info(f"Module ID: {pk}, Course ID: {course_id}")
        
        try:
            module = self.get_object()
            if not module.deleted_at:
                raise ValidationError("Module is not deleted")
            
            logger.info(f"Current deleted_at value: {module.deleted_at}")
            module.deleted_at = None
            module.save()
            logger.info("Set deleted_at to None")
            
            # Restore all lessons in this module using all_objects to access soft-deleted items
            for lesson in Lesson.all_objects.filter(module=module):
                lesson.deleted_at = None
                lesson.save()
                logger.info(f"Restored lesson {lesson.id}")
            
            # Verify restore
            updated_module = Module.all_objects.get(id=module.id)
            logger.info(f"Verified restore - deleted_at: {updated_module.deleted_at}")
            
            serializer = self.get_serializer(module)
            logger.info("=== End ModuleViewSet.restore ===")
            return Response(serializer.data)
        except ValidationError as e:
            logger.error(f"Validation error in restore: {str(e)}")
            raise e
        except Exception as e:
            logger.error(f"Error in restore: {str(e)}")
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to restore module")

class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated, OrganizationPermission]

    def get_queryset(self):
        logger.info("=== Starting LessonViewSet.get_queryset ===")
        logger.info(f"User: {self.request.user.email}, is_staff: {self.request.user.is_staff}")
        
        try:
            course_id = self.kwargs.get('course_id')
            module_id = self.kwargs.get('module_id')
            
            if not course_id or not module_id:
                raise ValidationError("Course ID and Module ID are required")
            
            # First check if the course exists and belongs to the user's organization
            # Use all_objects for admin users to access soft-deleted courses
            if self.request.user.is_staff:
                course = get_object_or_404(Course.all_objects, id=course_id, organization=self.request.user.organization)
                # Then check if the module exists and belongs to the course
                module = get_object_or_404(Module.all_objects, id=module_id, course=course)
            else:
                course = get_object_or_404(Course.objects, id=course_id, organization=self.request.user.organization)
                # Then check if the module exists and belongs to the course
                module = get_object_or_404(Module.objects, id=module_id, course=course)
            
            # For admin users, use all_objects to access all lessons including deleted ones
            if self.request.user.is_staff:
                queryset = Lesson.all_objects.filter(module=module)
                logger.info(f"Initial lessons count (all_objects): {queryset.count()}")
                
                show_deleted = self.request.query_params.get('show_deleted', 'false').lower() == 'true'
                logger.info(f"show_deleted parameter: {show_deleted}")
                
                # Log deleted lessons count
                deleted_count = queryset.filter(deleted_at__isnull=False).count()
                logger.info(f"Number of deleted lessons in queryset: {deleted_count}")
                
                if show_deleted:
                    logger.info("Including deleted lessons in response")
                else:
                    queryset = queryset.filter(deleted_at__isnull=True)
                    logger.info(f"Filtered out deleted lessons. New count: {queryset.count()}")
            else:
                # For normal users, use the default manager which already filters out deleted lessons
                queryset = Lesson.objects.filter(module=module)
                logger.info(f"Normal user lessons count: {queryset.count()}")
            
            logger.info(f"Final lessons count: {queryset.count()}")
            logger.info("=== End LessonViewSet.get_queryset ===")
            return queryset.order_by('order')
        except Http404:
            raise NotFoundError("Course or module not found")
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to retrieve lessons")

    def get_object(self):
        try:
            course_id = self.kwargs.get('course_id')
            module_id = self.kwargs.get('module_id')
            lesson_id = self.kwargs.get('pk')
            
            if not course_id or not module_id or not lesson_id:
                raise ValidationError("Course ID, Module ID, and Lesson ID are required")
            
            # First check if the course exists and belongs to the user's organization
            if self.request.user.is_staff:
                course = get_object_or_404(Course.all_objects, id=course_id, organization=self.request.user.organization)
                # Then check if the module exists and belongs to the course
                module = get_object_or_404(Module.all_objects, id=module_id, course=course)
            else:
                course = get_object_or_404(Course.objects, id=course_id, organization=self.request.user.organization)
                # Then check if the module exists and belongs to the course
                module = get_object_or_404(Module.objects, id=module_id, course=course)
            
            # Finally get the lesson using all_objects for admin users, otherwise use the default manager
            if self.request.user.is_staff:
                lesson = get_object_or_404(Lesson.all_objects, id=lesson_id, module=module)
            else:
                lesson = get_object_or_404(Lesson.objects, id=lesson_id, module=module)
            return lesson
        except Http404:
            raise NotFoundError("Lesson not found")
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to retrieve lesson")

    def create(self, request, *args, **kwargs):
        try:
            course_id = self.kwargs.get('course_id')
            module_id = self.kwargs.get('module_id')
            
            if not course_id or not module_id:
                raise ValidationError("Course ID and Module ID are required")

            # First check if the course exists and belongs to the user's organization
            course = get_object_or_404(Course, id=course_id, organization=self.request.user.organization)
            
            # Then check if the module exists and belongs to the course
            module = get_object_or_404(Module, id=module_id, course=course)

            # Get the last lesson's order for this module
            last_lesson = Lesson.objects.filter(module=module).order_by('-order').first()
            next_order = (last_lesson.order + 1) if last_lesson else 1
            
            # Add order, module, and default content to request data
            request_data = request.data.copy()
            request_data['order'] = next_order
            request_data['module'] = module.id
            if 'content' not in request_data:
                request_data['content'] = ''  # Set default empty content
            
            # Validate the request data
            serializer = self.get_serializer(data=request_data)
            serializer.is_valid(raise_exception=True)
            
            # Save the lesson
            self.perform_create(serializer)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Http404:
            raise NotFoundError("Module not found")
        except ValidationError as e:
            raise e
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError(f"Failed to create lesson: {str(e)}")

    def perform_update(self, serializer):
        try:
            instance = self.get_object()
            serializer.save()
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to update lesson")

    def perform_destroy(self, instance):
        logger.info("=== Starting LessonViewSet.perform_destroy ===")
        logger.info(f"Lesson ID: {instance.id}, Title: {instance.title}")
        logger.info(f"Current deleted_at value: {instance.deleted_at}")
        
        try:
            # Check for active enrollments
            active_enrollments = instance.module.course.enrollments.filter(
                status='ENROLLED'
            ).count()
            logger.info(f"Active enrollments count: {active_enrollments}")
            
            if active_enrollments > 0:
                logger.warning(f"Lesson's course has {active_enrollments} active enrollments")
            
            # Soft delete the lesson
            instance.deleted_at = timezone.now()
            instance.save()
            logger.info("Set deleted_at to current time")
            
            # Verify soft delete
            updated_lesson = Lesson.all_objects.get(id=instance.id)
            logger.info(f"Verified soft delete - deleted_at: {updated_lesson.deleted_at}")
            
            logger.info("=== End LessonViewSet.perform_destroy ===")
        except Exception as e:
            logger.error(f"Error in perform_destroy: {str(e)}")
            raise ServerError("Failed to delete lesson")

    @action(detail=True, methods=['post'])
    def restore(self, request, course_id=None, module_id=None, pk=None):
        logger.info("=== Starting LessonViewSet.restore ===")
        logger.info(f"Lesson ID: {pk}, Module ID: {module_id}, Course ID: {course_id}")
        
        try:
            lesson = self.get_object()
            if not lesson.deleted_at:
                raise ValidationError("Lesson is not deleted")
            
            logger.info(f"Current deleted_at value: {lesson.deleted_at}")
            lesson.deleted_at = None
            lesson.save()
            logger.info("Set deleted_at to None")
            
            # Verify restore
            updated_lesson = Lesson.all_objects.get(id=lesson.id)
            logger.info(f"Verified restore - deleted_at: {updated_lesson.deleted_at}")
            
            serializer = self.get_serializer(lesson)
            logger.info("=== End LessonViewSet.restore ===")
            return Response(serializer.data)
        except ValidationError as e:
            logger.error(f"Validation error in restore: {str(e)}")
            raise e
        except Exception as e:
            logger.error(f"Error in restore: {str(e)}")
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to restore lesson")

class CourseEnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = CourseEnrollmentSerializer
    permission_classes = [IsAuthenticated, OrganizationPermission]
    http_method_names = ['get', 'patch', 'head']  # Only allow GET and PATCH operations

    def get_queryset(self):
        # Users can only see their own enrollments
        return CourseEnrollment.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        try:
            instance = self.get_object()
            
            # Only allow updating the status field
            if 'status' in serializer.validated_data:
                new_status = serializer.validated_data['status']
                
                # If marking as completed, set completed_at
                if new_status == 'COMPLETED' and instance.status != 'COMPLETED':
                    serializer.save(completed_at=timezone.now())
                # If marking as dropped, set dropped_at
                elif new_status == 'DROPPED' and instance.status != 'DROPPED':
                    serializer.save(dropped_at=timezone.now())
                else:
                    serializer.save()
            else:
                serializer.save()
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to update enrollment")

class SearchViewSet(APIView):
    permission_classes = [IsAuthenticated, OrganizationPermission]
    
    def get(self, request):
        try:
            query = request.query_params.get('q', '')
            if not query:
                return Response({
                    'courses': [],
                    'modules': [],
                    'lessons': []
                })
            
            # Search in courses
            courses = Course.objects.filter(
                Q(organization=request.user.organization) &
                (Q(title__icontains=query) | Q(description__icontains=query))
            )
            
            # Search in modules
            modules = Module.objects.filter(
                Q(course__organization=request.user.organization) &
                (Q(title__icontains=query) | Q(description__icontains=query))
            )
            
            # Search in lessons
            lessons = Lesson.objects.filter(
                Q(module__course__organization=request.user.organization) &
                (Q(title__icontains=query) | Q(description__icontains=query) | Q(content__icontains=query))
            )
            
            # Serialize the results
            course_serializer = CourseSerializer(courses, many=True, context={'request': request})
            module_serializer = ModuleSerializer(modules, many=True, context={'request': request})
            lesson_serializer = LessonSerializer(lessons, many=True, context={'request': request})
            
            return Response({
                'courses': course_serializer.data,
                'modules': module_serializer.data,
                'lessons': lesson_serializer.data
            })
            
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to perform search")

class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]
    queryset = Tag.objects.all()

    def get_queryset(self):
        # Get all tags that are used by courses in the user's organization
        return Tag.objects.filter(
            courses__organization=self.request.user.organization
        ).distinct()

    def perform_create(self, serializer):
        try:
            serializer.save()
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to create tag")

    def perform_update(self, serializer):
        try:
            serializer.save()
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to update tag")

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to delete tag")

class StatsViewSet(APIView):
    permission_classes = [IsAuthenticated, OrganizationAdminPermission]
    
    def get(self, request):
        try:
            organization = request.user.organization
            
            # Course statistics
            total_courses = Course.objects.filter(organization=organization).count()
            published_courses = Course.objects.filter(organization=organization, status='PUBLISHED').count()
            draft_courses = Course.objects.filter(organization=organization, status='DRAFT').count()
            
            # Enrollment statistics
            total_enrollments = CourseEnrollment.objects.filter(
                course__organization=organization
            ).count()
            
            completed_enrollments = CourseEnrollment.objects.filter(
                course__organization=organization,
                status='COMPLETED'
            ).count()
            
            active_enrollments = CourseEnrollment.objects.filter(
                course__organization=organization,
                status='ENROLLED'
            ).count()
            
            # User statistics
            total_users = User.objects.filter(organization=organization).count()
            active_users = User.objects.filter(
                organization=organization,
                is_active=True
            ).count()
            
            # Calculate completion rate
            completion_rate = 0
            if total_enrollments > 0:
                completion_rate = (completed_enrollments / total_enrollments) * 100
            
            # Course-wise enrollment statistics
            course_stats = []
            courses = Course.objects.filter(organization=organization)
            for course in courses:
                course_enrollments = CourseEnrollment.objects.filter(course=course)
                course_total = course_enrollments.count()
                course_completed = course_enrollments.filter(status='COMPLETED').count()
                course_active = course_enrollments.filter(status='ENROLLED').count()
                
                course_completion_rate = 0
                if course_total > 0:
                    course_completion_rate = (course_completed / course_total) * 100
                
                course_stats.append({
                    'course_id': str(course.id),
                    'title': course.title,
                    'status': course.status,
                    'total_enrollments': course_total,
                    'completed_enrollments': course_completed,
                    'active_enrollments': course_active,
                    'completion_rate': round(course_completion_rate, 2)
                })
            
            return Response({
                'overview': {
                    'total_courses': total_courses,
                    'published_courses': published_courses,
                    'draft_courses': draft_courses,
                    'total_enrollments': total_enrollments,
                    'completed_enrollments': completed_enrollments,
                    'active_enrollments': active_enrollments,
                    'total_users': total_users,
                    'active_users': active_users,
                    'completion_rate': round(completion_rate, 2)
                },
                'course_stats': course_stats
            })
            
        except Exception as e:
            logger.error(f"Error fetching stats: {str(e)}")
            raise ServerError("Failed to fetch statistics")
