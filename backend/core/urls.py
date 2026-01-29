from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
  IndicatorViewSet,
  ComplianceRecordViewSet,
  EvidenceItemViewSet,
  AuditViewSet,
  AuditLogViewSet,
  health_check,
  login_view,
  logout_view,
  user_info,
)

router = DefaultRouter()
router.register(r"indicators", IndicatorViewSet, basename="indicator")
router.register(r"compliance", ComplianceRecordViewSet, basename="compliance")
router.register(r"evidence", EvidenceItemViewSet, basename="evidence")

urlpatterns = [
  path("", include(router.urls)),
  path("audit/summary/", AuditViewSet.as_view({"get":"summary"}), name="audit-summary"),
  path("audit/snapshot/", AuditViewSet.as_view({"get":"snapshot"}), name="audit-snapshot"),
  path("audit/snapshot/export/", AuditViewSet.as_view({"get":"snapshot_export"}), name="audit-snapshot-export"),
  path("audit/logs/", AuditLogViewSet.as_view({"get":"list"}), name="audit-logs"),
  path("audit/logs/export/", AuditLogViewSet.as_view({"get":"export"}), name="audit-logs-export"),
  path("health/", health_check, name="health-check"),
  path("auth/login/", login_view, name="login"),
  path("auth/logout/", logout_view, name="logout"),
  path("auth/user/", user_info, name="user-info"),
]
