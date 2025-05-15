from rest_framework import permissions
from core.exceptions import PermissionError
from users.models import Organization

class OrganizationPermission(permissions.BasePermission):
    """
    Base permission class for organization-based access control.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if not request.user.organization:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        # Special handling for Organization model
        if isinstance(obj, Organization):
            return obj == request.user.organization

        # For models that don't have a direct organization field
        # but are linked to an organization through relationships
        if hasattr(obj, 'assessable_type') and hasattr(obj, 'assessable_id'):
            from courses.models import Course
            try:
                if obj.assessable_type == 'Course':
                    course = Course.objects.get(id=obj.assessable_id)
                    return course.organization == request.user.organization
            except Course.DoesNotExist:
                return False

        # For other models, check their organization field
        obj_organization = getattr(obj, 'organization', None)
        if not obj_organization:
            return False
        return obj_organization == request.user.organization

class OrganizationAdminPermission(OrganizationPermission):
    """
    Permission class for organization admin access.
    """
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.is_staff or request.user.is_superuser 