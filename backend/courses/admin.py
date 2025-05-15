from django.contrib import admin
from .models import Course, Module, Lesson, Tag, Assessment

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at', 'updated_at')
    search_fields = ('name', 'description')
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'organization', 'status', 'created_at', 'updated_at', 'deleted_at')
    list_filter = ('organization', 'status', 'created_at', 'tags', 'deleted_at')
    search_fields = ('title', 'description', 'organization__name', 'tags__name')
    filter_horizontal = ('tags',)
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'deleted_at')

    def get_queryset(self, request):
        return Course.all_objects.all()

@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'created_at', 'deleted_at')
    list_filter = ('course__organization', 'course', 'created_at', 'deleted_at')
    search_fields = ('title', 'description', 'course__title')
    ordering = ('course', 'order')
    readonly_fields = ('created_at', 'updated_at', 'deleted_at')

    def get_queryset(self, request):
        return Module.all_objects.all()

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'module', 'order', 'created_at', 'deleted_at')
    list_filter = ('module__course__organization', 'module__course', 'module', 'created_at', 'deleted_at')
    search_fields = ('title', 'description', 'module__title', 'module__course__title')
    ordering = ('module', 'order')
    readonly_fields = ('created_at', 'updated_at', 'deleted_at')

    def get_queryset(self, request):
        return Lesson.all_objects.all()

@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'assessable_type', 'assessable_id', 'created_at', 'deleted_at')
    list_filter = ('assessable_type', 'created_at', 'deleted_at')
    search_fields = ('title', 'description', 'assessable_type')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'deleted_at')

    def get_queryset(self, request):
        return Assessment.all_objects.all()
