import csv
import os
from io import TextIOWrapper
from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, permissions, pagination
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from .audit import log_audit
from .models import Indicator, ComplianceRecord, EvidenceItem, AuditLog, AuditAction
from .permissions import IsAdmin, IsAdminOrReviewer, ReadOnlyOrAdminContributor
from .serializers import (
    IndicatorSerializer,
    ComplianceRecordSerializer,
    EvidenceItemSerializer,
    AuditLogSerializer,
)
from .services import compute_valid_until, compute_due_status

class IndicatorViewSet(viewsets.ModelViewSet):
  queryset = Indicator.objects.all().order_by("section","standard")
  serializer_class = IndicatorSerializer


  def get_permissions(self):
    if self.action in ["list", "retrieve"]:
      return [permissions.AllowAny()]
    if self.action == "import_csv":
      return [IsAdmin()]
    return [IsAdmin()]

  def get_queryset(self):
    qs = super().get_queryset()
    q = self.request.query_params.get("q")
    freq = self.request.query_params.get("frequency")
    section = self.request.query_params.get("section")
    due = self.request.query_params.get("due_status")
    active = self.request.query_params.get("is_active")

    if active is not None:
      qs = qs.filter(is_active=active.lower()=="true")
    if q:
      qs = qs.filter(Q(indicator_text__icontains=q) | Q(standard__icontains=q) | Q(section__icontains=q))
    if freq:
      qs = qs.filter(frequency=freq)
    if section:
      qs = qs.filter(section=section)
    if due:
      ids = [ind.id for ind in qs if compute_due_status(ind)[2] == due]
      qs = qs.filter(id__in=ids)
    return qs

  @action(detail=False, methods=["post"], url_path="import")
  def import_csv(self, request):
    if "file" not in request.FILES:
      return Response({"detail":"file is required"}, status=400)
    
    try:
      f = TextIOWrapper(request.FILES["file"].file, encoding="utf-8")
      reader = csv.DictReader(f)
      created = 0
      errors = []
      total = 0
      
      for i, row in enumerate(reader):
        total += 1
        sec = (row.get("Section") or "").strip()
        std = (row.get("Standard") or "").strip()
        ind = (row.get("Indicator") or "").strip()
        
        if not sec or not std or not ind:
          errors.append(f"Row {i+1}: Missing required fields (Section, Standard, or Indicator)")
          continue
          
        Indicator.objects.create(
          section=sec,
          standard=std,
          indicator_text=ind,
          evidence_required_text=(row.get("Evidence Required") or "").strip() or None,
          responsible_person=(row.get("Responsible Person") or "").strip() or None,
        )
        created += 1
      metadata = {
        "rows_total": total,
        "created": created,
        "updated": 0,
        "skipped": len(errors),
        "errors_count": len(errors),
        "error_samples": errors[:5],
      }
      log_audit(
        actor=request.user,
        action=AuditAction.IMPORT,
        entity_type="Indicator",
        entity_id="import",
        summary=f"Imported indicators from CSV (created={created}, errors={len(errors)})",
        metadata=metadata,
        request=request,
      )
      if errors:
        return Response({"created": created, "errors": errors}, status=207 if created > 0 else 400)
      return Response({"created": created})
    except Exception as e:
      return Response({"detail": f"CSV Parse Error: {str(e)}"}, status=400)

class ComplianceRecordViewSet(viewsets.ModelViewSet):
  queryset = ComplianceRecord.objects.select_related("indicator").all().order_by("-compliant_on","-created_at")
  serializer_class = ComplianceRecordSerializer
  permission_classes = [ReadOnlyOrAdminContributor]

  def get_queryset(self):
    qs = super().get_queryset()
    ind = self.request.query_params.get("indicator")
    if ind:
      qs = qs.filter(indicator_id=ind)
    return qs

  def perform_create(self, serializer):
    indicator = serializer.validated_data["indicator"]
    compliant_on = serializer.validated_data.get("compliant_on") or timezone.localdate()
    valid_until = serializer.validated_data.get("valid_until")
    if valid_until is None:
      valid_until = compute_valid_until(indicator.frequency, compliant_on)
    instance = serializer.save(created_by=self.request.user, valid_until=valid_until)
    log_audit(
      actor=self.request.user,
      action=AuditAction.CREATE,
      entity_type="ComplianceRecord",
      entity_id=instance.id,
      summary=f"Compliance record created for indicator {instance.indicator_id}",
      after=_compliance_audit_data(instance),
      request=self.request,
    )

  def perform_update(self, serializer):
    before = _compliance_audit_data(serializer.instance)
    is_revoking = serializer.validated_data.get("is_revoked") and not serializer.instance.is_revoked
    if is_revoking:
      instance = serializer.save(revoked_at=timezone.now())
      action = AuditAction.REVOKE
      summary = f"Compliance record revoked for indicator {instance.indicator_id}"
    else:
      instance = serializer.save()
      action = AuditAction.UPDATE
      summary = f"Compliance record updated for indicator {instance.indicator_id}"
    log_audit(
      actor=self.request.user,
      action=action,
      entity_type="ComplianceRecord",
      entity_id=instance.id,
      summary=summary,
      before=before,
      after=_compliance_audit_data(instance),
      metadata={"revoked_reason": instance.revoked_reason} if action == AuditAction.REVOKE else None,
      request=self.request,
    )

  def destroy(self, request, *args, **kwargs):
    instance = self.get_object()
    before = _compliance_audit_data(instance)
    entity_id = instance.id
    indicator_id = instance.indicator_id
    self.perform_destroy(instance)
    log_audit(
      actor=request.user,
      action=AuditAction.DELETE,
      entity_type="ComplianceRecord",
      entity_id=entity_id,
      summary=f"Compliance record deleted for indicator {indicator_id}",
      before=before,
      request=request,
    )
    return Response(status=204)

class EvidenceItemViewSet(viewsets.ModelViewSet):
  queryset = EvidenceItem.objects.select_related("indicator","compliance_record").all().order_by("-created_at")
  serializer_class = EvidenceItemSerializer
  permission_classes = [ReadOnlyOrAdminContributor]

  def get_queryset(self):
    qs = super().get_queryset()
    ind = self.request.query_params.get("indicator")
    if ind:
      qs = qs.filter(indicator_id=ind)
    return qs

  def perform_create(self, serializer):
    instance = serializer.save(created_by=self.request.user)
    log_audit(
      actor=self.request.user,
      action=AuditAction.CREATE,
      entity_type="EvidenceItem",
      entity_id=instance.id,
      summary=f"Evidence item created for indicator {instance.indicator_id}",
      after=_evidence_audit_data(instance),
      request=self.request,
    )

  def perform_update(self, serializer):
    before = _evidence_audit_data(serializer.instance)
    instance = serializer.save()
    log_audit(
      actor=self.request.user,
      action=AuditAction.UPDATE,
      entity_type="EvidenceItem",
      entity_id=instance.id,
      summary=f"Evidence item updated for indicator {instance.indicator_id}",
      before=before,
      after=_evidence_audit_data(instance),
      request=self.request,
    )

  def destroy(self, request, *args, **kwargs):
    instance = self.get_object()
    before = _evidence_audit_data(instance)
    entity_id = instance.id
    indicator_id = instance.indicator_id
    file_path = instance.file.path if instance.file and hasattr(instance.file, "path") else None
    self.perform_destroy(instance)
    file_deleted = False
    if file_path:
      file_deleted = not os.path.exists(file_path)
    log_audit(
      actor=request.user,
      action=AuditAction.DELETE,
      entity_type="EvidenceItem",
      entity_id=entity_id,
      summary=f"Evidence item deleted for indicator {indicator_id}",
      before=before,
      metadata={"file_deleted": file_deleted},
      request=request,
    )
    return Response(status=204)


class AuditLogPagination(pagination.PageNumberPagination):
  page_size = 50
  page_size_query_param = "page_size"


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
  serializer_class = AuditLogSerializer
  pagination_class = AuditLogPagination
  permission_classes = [IsAdminOrReviewer]

  def get_queryset(self):
    qs = AuditLog.objects.select_related("actor").all().order_by("-timestamp")
    actor = self.request.query_params.get("actor")
    action = self.request.query_params.get("action")
    entity_type = self.request.query_params.get("entity_type")
    q = self.request.query_params.get("q")
    start = self.request.query_params.get("from")
    end = self.request.query_params.get("to")

    if actor:
      qs = qs.filter(Q(actor__id=actor) | Q(actor__username__iexact=actor))
    if action:
      qs = qs.filter(action=action)
    if entity_type:
      qs = qs.filter(entity_type=entity_type)
    if q:
      qs = qs.filter(summary__icontains=q)
    if start:
      start_dt = _parse_datetime(start)
      if start_dt:
        qs = qs.filter(timestamp__gte=start_dt)
    if end:
      end_dt = _parse_datetime(end, end_of_day=True)
      if end_dt:
        qs = qs.filter(timestamp__lte=end_dt)
    return qs

  @action(detail=False, methods=["get"], url_path="export")
  def export(self, request):
    logs = self.filter_queryset(self.get_queryset())
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = "attachment; filename=audit-logs.csv"
    writer = csv.writer(response)
    writer.writerow([
      "timestamp","actor","action","entity_type","entity_id","summary","ip_address","user_agent"
    ])
    for log in logs:
      writer.writerow([
        log.timestamp,
        log.actor.username if log.actor else "",
        log.action,
        log.entity_type,
        log.entity_id,
        log.summary,
        log.ip_address or "",
        log.user_agent or "",
      ])
    return response

class AuditViewSet(viewsets.ViewSet):
  permission_classes = [permissions.IsAuthenticated]

  @action(detail=False, methods=["get"], url_path="summary")
  def summary(self, request):
    period = request.query_params.get("period","month")
    start = request.query_params.get("start")
    if not start:
      start_date = timezone.localdate().replace(day=1)
    else:
      start_date = timezone.datetime.fromisoformat(start).date()
    end_date = start_date + timezone.timedelta(days=(31 if period=="month" else 92))

    indicators = Indicator.objects.filter(is_active=True)
    counts = {"COMPLIANT":0,"DUE_SOON":0,"OVERDUE":0,"NOT_STARTED":0}
    for ind in indicators:
      st = compute_due_status(ind)[2]
      counts[st] = counts.get(st,0)+1
    return Response({"period":period,"start":start_date,"end":end_date,"counts":counts})

  @action(detail=False, methods=["get"], url_path="snapshot", permission_classes=[IsAdminOrReviewer])
  def snapshot(self, request):
    data = build_snapshot_payload(request)
    return Response(data)

  @action(detail=False, methods=["get"], url_path="snapshot/export", permission_classes=[IsAdminOrReviewer])
  def snapshot_export(self, request):
    data = build_snapshot_payload(request)
    log_audit(
      actor=request.user,
      action=AuditAction.EXPORT_SNAPSHOT,
      entity_type="Snapshot",
      entity_id="export",
      summary="Snapshot export generated",
      metadata={"filters": _snapshot_filters(request)},
      request=request,
    )
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = "attachment; filename=snapshot-export.csv"
    writer = csv.writer(response)
    writer.writerow(["id","section","standard","status","due_date"])
    for row in data["indicators"]:
      writer.writerow([row["id"], row["section"], row["standard"], row["status"], row.get("due_date") or ""])
    return response

@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health_check(request):
  return Response({"status": "ok"})

from django.contrib.auth import authenticate, login, logout

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")
    user = authenticate(request, username=username, password=password)
    if user:
        login(request, user)
        log_audit(
          actor=user,
          action=AuditAction.LOGIN,
          entity_type="User",
          entity_id=user.id,
          summary=f"User {user.username} logged in",
          request=request,
        )
        return Response({"detail": "Logged in", "username": user.username})
    return Response({"detail": "Invalid credentials"}, status=400)

@api_view(["POST"])
def logout_view(request):
    actor = request.user if request.user.is_authenticated else None
    if actor:
        log_audit(
          actor=actor,
          action=AuditAction.LOGOUT,
          entity_type="User",
          entity_id=actor.id,
          summary=f"User {actor.username} logged out",
          request=request,
        )
    logout(request)
    return Response({"detail": "Logged out"})

@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def user_info(request):
    # This also acts as a CSRF cookie setter if we ensure CSRF token is sent
    from django.middleware.csrf import get_token
    csrf_token = get_token(request)
    if request.user.is_authenticated:
        return Response({"isAuthenticated": True, "username": request.user.username, "csrfToken": csrf_token})
    return Response({"isAuthenticated": False, "csrfToken": csrf_token})


def _compliance_audit_data(instance: ComplianceRecord):
  return {
    "id": str(instance.id),
    "indicator_id": str(instance.indicator_id),
    "compliant_on": instance.compliant_on,
    "valid_until": instance.valid_until,
    "is_revoked": instance.is_revoked,
    "revoked_at": instance.revoked_at,
    "created_by": str(instance.created_by_id) if instance.created_by_id else None,
  }


def _evidence_audit_data(instance: EvidenceItem):
  filename = None
  if instance.file:
    filename = os.path.basename(instance.file.name)
  return {
    "id": str(instance.id),
    "indicator_id": str(instance.indicator_id),
    "compliance_record_id": str(instance.compliance_record_id) if instance.compliance_record_id else None,
    "type": instance.type,
    "file_name": filename,
    "url": instance.url,
    "created_by": str(instance.created_by_id) if instance.created_by_id else None,
  }


def _parse_datetime(value: str, end_of_day: bool = False):
  try:
    dt = timezone.datetime.fromisoformat(value)
    if timezone.is_naive(dt):
      dt = timezone.make_aware(dt)
    return dt
  except ValueError:
    try:
      d = timezone.datetime.fromisoformat(value + "T00:00:00")
      if end_of_day:
        d = d.replace(hour=23, minute=59, second=59)
      if timezone.is_naive(d):
        d = timezone.make_aware(d)
      return d
    except ValueError:
      return None


def _snapshot_filters(request):
  return {
    "status": request.query_params.get("status"),
    "q": request.query_params.get("q"),
    "section": request.query_params.get("section"),
    "standard": request.query_params.get("standard"),
  }


def build_snapshot_payload(request):
  qs = Indicator.objects.filter(is_active=True)
  q = request.query_params.get("q")
  section = request.query_params.get("section")
  standard = request.query_params.get("standard")
  status = request.query_params.get("status")

  if q:
    qs = qs.filter(Q(indicator_text__icontains=q) | Q(standard__icontains=q) | Q(section__icontains=q))
  if section:
    qs = qs.filter(section=section)
  if standard:
    qs = qs.filter(standard=standard)

  indicators = []
  counts = {"COMPLIANT":0,"DUE_SOON":0,"OVERDUE":0,"NOT_STARTED":0}
  for ind in qs:
    last_compliant_on, next_due_on, due_status = compute_due_status(ind)
    if status and due_status != status:
      continue
    counts[due_status] = counts.get(due_status, 0) + 1
    indicators.append({
      "id": str(ind.id),
      "section": ind.section,
      "standard": ind.standard,
      "status": due_status,
      "due_date": next_due_on,
      "last_compliant_on": last_compliant_on,
    })

  latest_compliance = list(
    ComplianceRecord.objects.select_related("indicator")
    .order_by("-created_at")[:50]
    .values(
      "id","indicator_id","compliant_on","valid_until","is_revoked","revoked_at","created_at"
    )
  )

  evidence_items = []
  for item in EvidenceItem.objects.select_related("indicator").order_by("-created_at")[:50]:
    filename = os.path.basename(item.file.name) if item.file else None
    evidence_items.append({
      "id": str(item.id),
      "indicator_id": str(item.indicator_id),
      "type": item.type,
      "created_at": item.created_at,
      "filename": filename,
      "url": item.url,
      "file_url": item.file.url if item.file else None,
    })

  return {
    "summary": counts,
    "indicators": indicators,
    "latest_compliance": latest_compliance,
    "evidence": evidence_items,
    "filters": _snapshot_filters(request),
  }
