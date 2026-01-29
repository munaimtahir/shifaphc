from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import IndicatorViewSet, ComplianceRecordViewSet, EvidenceItemViewSet, AuditViewSet, UserViewSet, health_check, login_view, logout_view, user_info

router = DefaultRouter()
router.register(r"indicators", IndicatorViewSet, basename="indicator")
router.register(r"compliance", ComplianceRecordViewSet, basename="compliance")
router.register(r"evidence", EvidenceItemViewSet, basename="evidence")
router.register(r"users", UserViewSet, basename="user")
router.register(r"audit", AuditViewSet, basename="audit")

urlpatterns = [
  path("", include(router.urls)),
  path("health/", health_check, name="health-check"),
  path("auth/login/", login_view, name="login"),
  path("auth/logout/", logout_view, name="logout"),
  path("auth/user/", user_info, name="user-info"),
]
