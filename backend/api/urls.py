from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, VendorViewSet, SavedVendorViewSet,
    LineItemViewSet, SavedLineItemViewSet, PurchaseOrderViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'vendors', VendorViewSet)
router.register(r'saved-vendors', SavedVendorViewSet, basename='saved-vendor')
router.register(r'line-items', LineItemViewSet)
router.register(r'saved-line-items', SavedLineItemViewSet, basename='saved-line-item')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-order')

urlpatterns = [
    path('', include(router.urls)),
] 