from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import AuthenticationFailed as JWTAuthenticationFailed, InvalidToken, TokenError
from django.conf import settings

class APIError(Exception):
    """Base class for API errors"""
    def __init__(self, message, code=400, details=None):
        self.message = message
        self.code = code
        self.details = details
        super().__init__(message)

class ValidationError(APIError):
    """Raised when there's a validation error"""
    def __init__(self, message, details=None):
        super().__init__(message, code=400, details=details)

class AuthenticationError(APIError):
    """Raised when there's an authentication error"""
    def __init__(self, message, details=None):
        super().__init__(message, code=401, details=details)

class PermissionError(APIError):
    """Raised when there's a permission error"""
    def __init__(self, message, details=None):
        super().__init__(message, code=403, details=details)

class NotFoundError(APIError):
    """Raised when a resource is not found"""
    def __init__(self, message, details=None):
        super().__init__(message, code=404, details=details)

class ServerError(APIError):
    """Raised when there's a server error"""
    def __init__(self, message, details=None):
        super().__init__(message, code=500, details=details)

def custom_exception_handler(exc, context):
    """
    Custom exception handler that formats error responses consistently.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is None:
        # If the exception is an APIError, format it
        if isinstance(exc, APIError):
            data = {
                'error': {
                    'message': str(exc),
                    'code': exc.code,
                    'details': exc.details
                }
            }
            return Response(data, status=exc.code)
        return response

    # Format the response data to match our structure
    if isinstance(response.data, dict):
        # If it's already in our format, return as is
        if 'error' in response.data:
            return response

        # Handle JWT authentication errors
        if isinstance(exc, (JWTAuthenticationFailed, InvalidToken, TokenError)):
            # Get the error code from the exception
            error_code = getattr(exc, 'code', 'token_not_valid')
            
            # Get the error message from JWT settings if available
            jwt_error_messages = getattr(settings, 'SIMPLE_JWT', {}).get('ERROR_MESSAGES', {})
            error_config = jwt_error_messages.get(error_code, {
                'message': str(exc),
                'code': 401,
                'details': None
            })

            error_data = {
                'error': {
                    'message': error_config['message'],
                    'code': error_config['code'],
                    'details': error_config['details']
                }
            }
            return Response(error_data, status=error_config['code'])

        # Handle DRF authentication errors
        if isinstance(exc, AuthenticationFailed):
            error_data = {
                'error': {
                    'message': str(exc.detail),
                    'code': 401,
                    'details': None
                }
            }
            return Response(error_data, status=401)

        # Convert Django REST framework's error format to our format
        error_data = {
            'error': {
                'message': str(exc),
                'code': response.status_code,
                'details': response.data
            }
        }
        return Response(error_data, status=response.status_code)

    return response 