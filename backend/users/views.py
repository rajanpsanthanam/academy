from django.shortcuts import render
from rest_framework import viewsets, status, permissions, pagination
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.http import Http404
from .models import User, AccessRequest, Organization
from .serializers import AccessRequestSerializer, UserSerializer, EmailOTPSerializer, OrganizationSerializer, UserUpdateSerializer
from .utils import create_and_send_otp, verify_otp
from rest_framework import serializers
from core.exceptions import ValidationError, NotFoundError, ServerError, AuthenticationError, APIError
from core.permissions import OrganizationPermission, OrganizationAdminPermission
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class StandardResultsSetPagination(pagination.PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

# Create your views here.

class AccessRequestViewSet(viewsets.ModelViewSet):
    serializer_class = AccessRequestSerializer
    permission_classes = [permissions.IsAuthenticated, OrganizationAdminPermission]
    pagination_class = StandardResultsSetPagination
    
    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated, OrganizationAdminPermission]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = AccessRequest.objects.select_related('organization')
        if self.request.user.is_superuser:
            queryset = queryset.all()
        else:
            queryset = queryset.filter(organization=self.request.user.organization)
        
        # Enhanced search functionality
        search_query = self.request.query_params.get('search', None)
        if search_query:
            # Split search query into words for more natural search
            search_terms = search_query.split()
            q_objects = Q()
            
            for term in search_terms:
                q_objects &= (
                    Q(email__icontains=term) |
                    Q(organization__name__icontains=term) |
                    Q(status__icontains=term) |
                    Q(processed_by__email__icontains=term)
                )
            
            queryset = queryset.filter(q_objects)
        
        # Filter by status if provided
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date and end_date:
            queryset = queryset.filter(
                created_at__date__range=[start_date, end_date]
            )
        
        # Sorting
        sort_by = self.request.query_params.get('sort_by', '-created_at')
        if sort_by in ['email', 'status', 'created_at', 'processed_at']:
            queryset = queryset.order_by(sort_by)
        else:
            queryset = queryset.order_by('-created_at')
        
        return queryset

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ValidationError("Failed to create access request")

    @action(detail=True, methods=['post'])
    def approve(self, request, *args, **kwargs):
        try:
            try:
                access_request = self.get_object()
            except Http404:
                raise NotFoundError("Access request not found")

            # Create user with organization using CustomUserManager
            user = User.objects.create_user(
                email=access_request.email,
                organization=access_request.organization,
                is_approved=True,
                approval_date=timezone.now()
            )
            
            # Update access request status
            access_request.status = 'approved'
            access_request.processed_at = timezone.now()
            access_request.processed_by = request.user
            access_request.save()

            return Response({
                'message': 'Access request approved',
                'user': UserSerializer(user).data
            })
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to approve access request")

    @action(detail=True, methods=['post'])
    def reject(self, request, *args, **kwargs):
        try:
            try:
                access_request = self.get_object()
            except Http404:
                raise NotFoundError("Access request not found")

            access_request.delete()
            return Response({'message': 'Access request rejected'})
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to reject access request")

class AuthViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    
    def get_permissions(self):
        """
        Instantiate and return the list of permissions that this view requires.
        """
        if self.action in ['request_otp', 'verify_otp']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['post'])
    def request_otp(self, request):
        try:
            serializer = EmailOTPSerializer(data=request.data, context={'action': 'request_otp'})
            serializer.is_valid(raise_exception=True)
            
            email = serializer.validated_data['email']
            purpose = serializer.validated_data['purpose']  # This is now guaranteed to exist and be valid
            
            # Get domain and check organization first for both flows
            domain = email.split('@')[1]
            try:
                organization = Organization.objects.get(domain=domain)
                if not organization.is_active:
                    raise ValidationError("Your organization is not active")
            except Organization.DoesNotExist:
                raise ValidationError("Your organization is not registered with us")
            
            if purpose == 'login':
                # Login flow validations
                user = User.objects.filter(email=email).first()
                if not user:
                    raise NotFoundError("No account found with this email address. Please register first.")
                
                if not user.is_approved:
                    raise ValidationError("Your account is pending approval")
                
                if not user.is_active:
                    raise ValidationError("Your account is inactive")

                # Check for pending access request
                pending_request = AccessRequest.objects.filter(email=email, status='pending').first()
                if pending_request:
                    raise ValidationError("Your registration request is pending approval. You will receive an email once approved.")
            else:
                # Registration flow validations
                user = User.objects.filter(email=email).first()
                if user:
                    if user.is_approved:
                        raise ValidationError("An account with this email already exists. Please login instead.")
                    else:
                        raise ValidationError("Your account is pending approval. You will receive an email once approved.")
                
                # Check if access request already exists
                pending_request = AccessRequest.objects.filter(email=email).first()
                if pending_request:
                    if pending_request.status == 'pending':
                        raise ValidationError("Your registration request is pending approval. You will receive an email once approved.")
                    elif pending_request.status == 'rejected':
                        raise ValidationError("Your previous registration request was rejected. Please contact support for assistance.")

            # Create and send OTP
            email_otp = create_and_send_otp(email, purpose=purpose)
            if not email_otp:
                raise ServerError("Failed to send OTP. Please try again later.")
                
            return Response({"detail": "OTP sent successfully"})
        except serializers.ValidationError as e:
            raise ValidationError(str(e.detail[0]) if isinstance(e.detail, list) else str(e.detail))
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            print(f"Error in request_otp: {str(e)}")  # Add debug logging
            raise ServerError("An unexpected error occurred. Please try again later.")

    @action(detail=False, methods=['post'])
    def verify_otp(self, request):
        try:
            serializer = EmailOTPSerializer(data=request.data, context={'action': 'verify_otp'})
            serializer.is_valid(raise_exception=True)
            
            email = serializer.validated_data['email']
            otp = serializer.validated_data['otp']
            purpose = serializer.validated_data['purpose']

            print(f"Verifying OTP for email: {email}, purpose: {purpose}")  # Debug log

            # Verify OTP
            if not verify_otp(email, otp, purpose):
                print(f"OTP verification failed for email: {email}")  # Debug log
                raise ValidationError("Invalid or expired OTP")

            print(f"OTP verified successfully for email: {email}")

            if purpose == 'login':
                # Login flow
                try:
                    user = User.objects.get(email=email)
                    
                    if not user.is_approved:
                        raise ValidationError("Your account is pending approval")
                    
                    if not user.is_active:
                        raise ValidationError("Your account is inactive")

                    # Update last_login
                    user.last_login = timezone.now()
                    user.save(update_fields=['last_login'])

                    # Generate tokens
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        'access': str(refresh.access_token),
                        'refresh': str(refresh),
                        'user': UserSerializer(user).data
                    })
                except User.DoesNotExist:
                    raise NotFoundError("No account found with this email address")
            else:
                # Registration flow
                # Check if organization exists for this domain
                domain = email.split('@')[1]
                try:
                    organization = Organization.objects.get(domain=domain)
                    
                    # Check if user already exists
                    if User.objects.filter(email=email).exists():
                        raise ValidationError("An account with this email already exists")

                    # Check for existing access request
                    existing_request = AccessRequest.objects.filter(email=email).first()
                    if existing_request:
                        if existing_request.status == 'pending':
                            raise ValidationError("Your registration request is already pending approval")
                        elif existing_request.status == 'rejected':
                            raise ValidationError("Your previous registration request was rejected")

                    # Create access request
                    AccessRequest.objects.create(
                        email=email,
                        organization=organization,
                        status='pending'
                    )
                    return Response({
                        'message': 'Registration request submitted successfully'
                    })
                except Organization.DoesNotExist:
                    raise ValidationError("Your organization is not registered with us")

        except Exception as e:
            print(f"Error in verify_otp: {str(e)}")  # Debug log
            if isinstance(e, (ValidationError, NotFoundError)):
                raise e
            raise ServerError("An unexpected error occurred. Please try again later.")

    @action(detail=False, methods=['post'])
    def logout(self, request):
        try:
            return Response({"detail": "Logged out successfully"})
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("An error occurred during logout")

    @action(detail=False, methods=['post'])
    def token_refresh(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                raise ValidationError("Refresh token is required")

            try:
                refresh = RefreshToken(refresh_token)
                access_token = str(refresh.access_token())
                return Response({'access': access_token})
            except Exception:
                raise ValidationError("Invalid refresh token")
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("An error occurred while refreshing token")

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, OrganizationPermission]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = User.objects.all()
        if self.request.user.is_superuser:
            queryset = queryset.exclude(id=self.request.user.id)
        else:
            queryset = queryset.filter(organization=self.request.user.organization).exclude(id=self.request.user.id)
        
        # Search functionality
        search_query = self.request.query_params.get('search', None)
        if search_query:
            # Split search query into words for more natural search
            search_terms = search_query.split()
            q_objects = Q()
            
            for term in search_terms:
                q_objects &= (
                    Q(email__icontains=term) |
                    Q(first_name__icontains=term) |
                    Q(last_name__icontains=term) |
                    Q(organization__name__icontains=term)
                )
            
            queryset = queryset.filter(q_objects)
        
        # Filter by status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        is_approved = self.request.query_params.get('is_approved', None)
        if is_approved is not None:
            queryset = queryset.filter(is_approved=is_approved.lower() == 'true')
        
        is_staff = self.request.query_params.get('is_staff', None)
        if is_staff is not None:
            queryset = queryset.filter(is_staff=is_staff.lower() == 'true')
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date and end_date:
            queryset = queryset.filter(
                date_joined__date__range=[start_date, end_date]
            )
        
        # Sorting
        sort_by = self.request.query_params.get('sort_by', '-last_login')
        if sort_by in ['email', 'first_name', 'last_name', 'date_joined', 'last_login', 'is_active', 'is_approved', 'is_staff']:
            queryset = queryset.order_by(sort_by)
        else:
            queryset = queryset.order_by('-last_login')
        
        return queryset

    def perform_create(self, serializer):
        try:
            serializer.save(organization=self.request.user.organization)
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ValidationError("Failed to create user")

    def perform_update(self, serializer):
        try:
            instance = self.get_object()
            serializer.save()
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to update user")

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to delete user")

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = UserUpdateSerializer(request.user, data=request.data, partial=request.method == 'PATCH')
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def revoke(self, request, *args, **kwargs):
        try:
            user = self.get_object()
            user.is_active = False
            user.save()

            # Find and update any associated access request
            access_request = AccessRequest.objects.filter(email=user.email).first()
            if access_request:
                access_request.status = 'rejected'
                access_request.processed_at = timezone.now()
                access_request.processed_by = request.user
                access_request.save()

            return Response({
                'message': 'User access revoked successfully',
                'user': self.get_serializer(user).data
            })
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to revoke user access")

    @action(detail=True, methods=['post'])
    def restore(self, request, *args, **kwargs):
        try:
            user = self.get_object()
            user.is_active = True
            user.save()

            # Find and update any associated access request
            access_request = AccessRequest.objects.filter(email=user.email).first()
            if access_request:
                access_request.status = 'approved'
                access_request.processed_at = timezone.now()
                access_request.processed_by = request.user
                access_request.save()

            return Response({
                'message': 'User access restored successfully',
                'user': self.get_serializer(user).data
            })
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to restore user access")

class OrganizationViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated, OrganizationPermission]
    lookup_field = 'id'
    lookup_url_kwarg = 'id'

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Organization.objects.all()
        return Organization.objects.filter(id=self.request.user.organization.id)

    def get_permissions(self):
        if self.action in ['retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated, OrganizationAdminPermission]
        return [permission() for permission in permission_classes]

    def perform_update(self, serializer):
        try:
            serializer.save()
        except Exception as e:
            if isinstance(e, APIError):
                raise e
            raise ServerError("Failed to update organization")
