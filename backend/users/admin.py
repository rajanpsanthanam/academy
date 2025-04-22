from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, AccessRequest, EmailOTP, Organization

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'domain', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at', 'updated_at')
    search_fields = ('name', 'domain')
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'organization_name', 'is_approved', 'is_active', 'is_staff', 'is_superuser', 'date_joined')
    list_filter = ('is_approved', 'is_active', 'is_staff', 'is_superuser', 'date_joined', 'organization')
    search_fields = ('email', 'first_name', 'last_name', 'organization__name')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Organization', {'fields': ('organization',)}),
        ('Permissions', {'fields': ('is_active', 'is_approved', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined', 'approval_date')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'organization'),
        }),
    )

@admin.register(AccessRequest)
class AccessRequestAdmin(admin.ModelAdmin):
    list_display = ('email', 'organization', 'status', 'created_at', 'processed_at', 'processed_by')
    list_filter = ('status', 'created_at', 'processed_at', 'organization')
    search_fields = ('email', 'organization__name')
    readonly_fields = ('created_at', 'processed_at')
    ordering = ('-created_at',)

@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = ('email', 'is_used', 'created_at', 'expires_at')
    list_filter = ('is_used', 'created_at', 'expires_at')
    search_fields = ('email', 'otp')
    readonly_fields = ('created_at', 'expires_at')
    ordering = ('-created_at',)
