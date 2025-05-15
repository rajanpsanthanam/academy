from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet, ModuleViewSet, LessonViewSet,
    CourseEnrollmentViewSet, TagViewSet, SearchViewSet,
    StatsViewSet, AssessmentViewSet
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'assessments', AssessmentViewSet, basename='assessment')

# Nested routes for modules
course_router = DefaultRouter()
course_router.register(r'modules', ModuleViewSet, basename='course-module')

# Nested routes for lessons under modules
module_router = DefaultRouter()
module_router.register(r'lessons', LessonViewSet, basename='module-lesson')

# Other routes
router.register(r'enrollments', CourseEnrollmentViewSet, basename='enrollment')
router.register(r'tags', TagViewSet, basename='tag')

urlpatterns = [
    path('', include(router.urls)),
    path('courses/<uuid:course_id>/', include(course_router.urls)),
    path('courses/<uuid:course_id>/modules/<uuid:module_id>/', include(module_router.urls)),
    path('search/', SearchViewSet.as_view(), name='global-search'),
    path('stats/', StatsViewSet.as_view(), name='stats'),
] 