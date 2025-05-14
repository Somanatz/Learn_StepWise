from rest_framework import permissions

class IsTeacher(permissions.BasePermission):
    """
    Custom permission to only allow users with role 'Teacher' to access.
    """
    def has_permission(self, request, view):
        # Check if the user is authenticated and their role is 'Teacher'
        return request.user and request.user.is_authenticated and request.user.role == 'Teacher'

class IsParent(permissions.BasePermission):
    """
    Custom permission to only allow users with role 'Parent' to access.
    """
    def has_permission(self, request, view):
        # Check if the user is authenticated and their role is 'Parent'
        return request.user and request.user.is_authenticated and request.user.role == 'Parent'

class IsStudent(permissions.BasePermission):
    """
    Custom permission to only allow users with role 'Student' to access.
    """
    def has_permission(self, request, view):
        # Check if the user is authenticated and their role is 'Student'
        return request.user and request.user.is_authenticated and request.user.role == 'Student'

class IsTeacherOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow teachers to edit, but allow anyone to read.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any authenticated request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Write permissions are only allowed to users with role 'Teacher'.
        return request.user and request.user.is_authenticated and request.user.role == 'Teacher'