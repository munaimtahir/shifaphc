from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import IndicatorViewSet, ComplianceRecordViewSet, EvidenceItemViewSet, AuditViewSet, health_check

router = DefaultRouter()
router.register(r"indicators", IndicatorViewSet, basename="indicator")
router.register(r"compliance", ComplianceRecordViewSet, basename="compliance")
router.register(r"evidence", EvidenceItemViewSet, basename="evidence")

urlpatterns = [
  path("", include(router.urls)),
  path("audit/summary/", AuditViewSet.as_view({"get":"summary"}), name="audit-summary"),
  path("health/", health_check, name="health-check"),
]
