from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AccessRequestViewSet, AuthViewSet, UserViewSet, OrganizationViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'organizations', OrganizationViewSet, basename='organization')

urlpatterns = [
    path('', include(router.urls)),
    path('access_requests/', AccessRequestViewSet.as_view({'get': 'list', 'post': 'create'}), name='access-request-list'),
    path('access_requests/<int:pk>/', AccessRequestViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='access-request-detail'),
    path('access_requests/<int:pk>/approve/', AccessRequestViewSet.as_view({'post': 'approve'}), name='access-request-approve'),
    path('access_requests/<int:pk>/reject/', AccessRequestViewSet.as_view({'post': 'reject'}), name='access-request-reject'),
] 