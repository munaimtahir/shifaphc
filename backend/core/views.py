import csv
import os
from io import TextIOWrapper
from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, permissions, pagination
from rest_framework.decorators import action, api_view, permission_classes
from .permissions import IsAdmin, IsContributorOrAdmin, IsReviewerOrHigher, ReadOnly, IsAdminOrReviewer, ReadOnlyOrAdminContributor
from rest_framework.response import Response

from .models import Indicator, ComplianceRecord, EvidenceItem, User, AuditLog, AuditAction, Project, Frequency
from .serializers import (
    IndicatorSerializer, ComplianceRecordSerializer, EvidenceItemSerializer, 
    UserSerializer, AuditLogSerializer, ProjectSerializer
)
from .services import compute_valid_until, compute_due_status
from .utils import log_audit
from django.contrib.auth.models import Group
from django.http import HttpResponse

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("username")
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    @action(detail=True, methods=["post"], url_path="assign-role")
    def assign_role(self, request, pk=None):
        user = self.get_object()
        role_name = request.data.get("role")
        if not role_name:
            return Response({"detail": "Role name is required"}, status=400)
        
        try:
            group = Group.objects.get(name=role_name)
            user.groups.add(group)
            log_audit(
                actor=request.user,
                action="ASSIGN_ROLE",
                entity_type="User",
                entity_id=user.id,
                summary=f"Assigned role {role_name} to {user.username}",
                metadata={"role": role_name},
                request=request
            )
            return Response({"detail": f"Role {role_name} assigned to {user.username}"})
        except Group.DoesNotExist:
            return Response({"detail": f"Role {role_name} does not exist"}, status=400)

    @action(detail=True, methods=["post"], url_path="remove-role")
    def remove_role(self, request, pk=None):
        user = self.get_object()
        role_name = request.data.get("role")
        if not role_name:
            return Response({"detail": "Role name is required"}, status=400)
        
        try:
            group = Group.objects.get(name=role_name)
            user.groups.remove(group)
            log_audit(
                actor=request.user,
                action="REMOVE_ROLE",
                entity_type="User",
                entity_id=user.id,
                summary=f"Removed role {role_name} from {user.username}",
                metadata={"role": role_name},
                request=request
            )
            return Response({"detail": f"Role {role_name} removed from {user.username}"})
        except Group.DoesNotExist:
            return Response({"detail": f"Role {role_name} does not exist"}, status=400)

class IndicatorViewSet(viewsets.ModelViewSet):
  queryset = Indicator.objects.all().order_by("section","standard")
  serializer_class = IndicatorSerializer


  def get_permissions(self):
    if self.action in ["list", "retrieve"]:
      return [ReadOnlyOrAdminContributor()]
    return [IsContributorOrAdmin()]

  def get_queryset(self):
    qs = super().get_queryset()
    q = self.request.query_params.get("q")
    freq = self.request.query_params.get("frequency")
    section = self.request.query_params.get("section")
    due = self.request.query_params.get("due_status")
    active = self.request.query_params.get("is_active")
    project = self.request.query_params.get("project")

    if active is not None:
      qs = qs.filter(is_active=active.lower()=="true")
    if q:
      qs = qs.filter(Q(indicator_text__icontains=q) | Q(standard__icontains=q) | Q(section__icontains=q))
    if freq:
      qs = qs.filter(frequency=freq)
    if section:
      qs = qs.filter(section=section)
    if project:
      qs = qs.filter(project_id=project)
    if due:
      ids = [ind.id for ind in qs if compute_due_status(ind)[2] == due]
      qs = qs.filter(id__in=ids)
    return qs


class ComplianceRecordViewSet(viewsets.ModelViewSet):
  queryset = ComplianceRecord.objects.select_related("indicator").all().order_by("-compliant_on","-created_at")
  serializer_class = ComplianceRecordSerializer
  permission_classes = [IsReviewerOrHigher]

  def get_permissions(self):
    if self.request.method in permissions.SAFE_METHODS:
      return [IsReviewerOrHigher()]
    return [IsContributorOrAdmin()]

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
        action="CREATE",
        entity_type="ComplianceRecord",
        entity_id=instance.id,
        summary=f"Created compliance record for indicator {indicator.id}",
        after=serializer.data,
        request=self.request
    )

  def perform_update(self, serializer):
    before = ComplianceRecordSerializer(serializer.instance).data
    if serializer.validated_data.get("is_revoked") and not serializer.instance.is_revoked:
      instance = serializer.save(revoked_at=timezone.now())
      action = "REVOKE"
      summary = f"Revoked compliance record {instance.id}"
    else:
      instance = serializer.save()
      action = "UPDATE"
      summary = f"Updated compliance record {instance.id}"
    
    log_audit(
        actor=self.request.user,
        action=action,
        entity_type="ComplianceRecord",
        entity_id=instance.id,
        summary=summary,
        before=before,
        after=serializer.data,
        request=self.request
    )

class EvidenceItemViewSet(viewsets.ModelViewSet):
  queryset = EvidenceItem.objects.select_related("indicator","compliance_record").all().order_by("-created_at")
  serializer_class = EvidenceItemSerializer
  permission_classes = [IsReviewerOrHigher]

  def get_permissions(self):
    if self.request.method in permissions.SAFE_METHODS:
      return [IsReviewerOrHigher()]
    return [IsContributorOrAdmin()]

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
        action="CREATE",
        entity_type="EvidenceItem",
        entity_id=instance.id,
        summary=f"Uploaded evidence for indicator {instance.indicator.id}",
        after=serializer.data,
        request=self.request
    )

  def perform_destroy(self, instance):
    before = EvidenceItemSerializer(instance).data
    entity_id = instance.id
    instance.delete()
    log_audit(
        actor=self.request.user,
        action="DELETE",
        entity_type="EvidenceItem",
        entity_id=entity_id,
        summary=f"Deleted evidence item {entity_id}",
        before=before,
        request=self.request
    )

  @action(detail=True, methods=["get"], url_path="download")
  def download(self, request, pk=None):
    instance = self.get_object()
    if not instance.file:
        return Response({"detail": "No file associated with this record"}, status=404)
    
    # We rely on ViewSet permission classes (IsReviewerOrHigher) for access control
    
    file_handle = instance.file.open()
    response = HttpResponse(file_handle, content_type='application/octet-stream')
    response['Content-Disposition'] = f'attachment; filename="{instance.file.name.split("/")[-1]}"'
    
    log_audit(
        actor=request.user,
        action="DOWNLOAD_EVIDENCE",
        entity_type="EvidenceItem",
        entity_id=instance.id,
        summary=f"Downloaded evidence file for indicator {instance.indicator.id}",
        request=request
    )
    
    return response

class AuditViewSet(viewsets.ViewSet):
  permission_classes = [IsReviewerOrHigher]

  @action(detail=False, methods=["get"], url_path="logs")
  def logs(self, request):
    queryset = AuditLog.objects.all()
    
    actor = request.query_params.get("actor")
    action_type = request.query_params.get("action")
    entity_type = request.query_params.get("entity_type")
    q = request.query_params.get("q")
    start_date = request.query_params.get("start_date")
    end_date = request.query_params.get("end_date")

    if actor: queryset = queryset.filter(actor_id=actor)
    if action_type: queryset = queryset.filter(action=action_type)
    if entity_type: queryset = queryset.filter(entity_type=entity_type)
    if q: queryset = queryset.filter(summary__icontains=q)
    if start_date: queryset = queryset.filter(timestamp__date__gte=start_date)
    if end_date: queryset = queryset.filter(timestamp__date__lte=end_date)

    from django.core.paginator import Paginator
    page_size = request.query_params.get("page_size", 50)
    page_number = request.query_params.get("page", 1)
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page_number)

    serializer = AuditLogSerializer(page_obj, many=True)
    return Response({
        "results": serializer.data,
        "count": paginator.count,
        "num_pages": paginator.num_pages,
        "current_page": page_obj.number
    })

  @action(detail=False, methods=["get"], url_path="logs/export")
  def export_logs(self, request):
    queryset = AuditLog.objects.all()
    actor = request.query_params.get("actor")
    action_type = request.query_params.get("action")
    entity_type = request.query_params.get("entity_type")
    q = request.query_params.get("q")
    start_date = request.query_params.get("start_date")
    end_date = request.query_params.get("end_date")

    if actor: queryset = queryset.filter(actor_id=actor)
    if action_type: queryset = queryset.filter(action=action_type)
    if entity_type: queryset = queryset.filter(entity_type=entity_type)
    if q: queryset = queryset.filter(summary__icontains=q)
    if start_date: queryset = queryset.filter(timestamp__date__gte=start_date)
    if end_date: queryset = queryset.filter(timestamp__date__lte=end_date)

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="audit_logs.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Timestamp', 'Actor', 'Action', 'Entity', 'Summary', 'IP Address'])
    
    for log in queryset:
        writer.writerow([
            log.timestamp.isoformat(),
            log.actor.username if log.actor else "System",
            log.action,
            f"{log.entity_type} ({log.entity_id})",
            log.summary,
            log.ip_address or ""
        ])
    
    log_audit(
        actor=request.user,
        action="EXPORT_LOGS",
        entity_type="AuditLog",
        summary="Exported audit logs to CSV",
        request=request
    )
    
    return response

  @action(detail=False, methods=["get"], url_path="snapshot")
  def snapshot(self, request):
    indicators = Indicator.objects.filter(is_active=True).order_by("section", "standard")
    
    snapshot_data = []
    summary_counts = {"COMPLIANT": 0, "DUE_SOON": 0, "OVERDUE": 0, "NOT_STARTED": 0}
    
    for ind in indicators:
      last_date, next_due, status = compute_due_status(ind)
      summary_counts[status] += 1
      
      # Get latest compliance records
      recs = ind.compliance_records.filter(is_revoked=False).order_by("-compliant_on")[:3]
      rec_data = ComplianceRecordSerializer(recs, many=True).data
      
      # Get evidence pointers
      evs = ind.evidence_items.all().order_by("-created_at")
      ev_data = []
      for ev in evs:
          ev_data.append({
              "id": ev.id,
              "type": ev.type,
              "created_at": ev.created_at,
              "filename": ev.file.name.split('/')[-1] if ev.file else None,
              "url": ev.url
          })
          
      snapshot_data.append({
          "indicator_id": ind.id,
          "section": ind.section,
          "standard": ind.standard,
          "text": ind.indicator_text,
          "status": status,
          "last_compliant": last_date,
          "next_due": next_due,
          "compliance_history": rec_data,
          "evidence": ev_data
      })
      
    log_audit(
        actor=request.user,
        action="EXPORT_SNAPSHOT",
        entity_type="AuditLog",
        summary="Generated compliance snapshot",
        request=request
    )
    
    return Response({
        "timestamp": timezone.now(),
        "summary": summary_counts,
        "indicators": snapshot_data
    })

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

@api_view(["GET"])
def dashboard_stats(request):
  return Response({
    "projects": Project.objects.count(),
    "indicators": Indicator.objects.count(),
    "compliance_records": ComplianceRecord.objects.count(),
  })

from django.contrib.auth import authenticate, login, logout

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")
    user = authenticate(request, username=username, password=password)
    if user:
        login(request, user)
        roles = list(user.groups.values_list('name', flat=True))
        return Response({"detail": "Logged in", "username": user.username, "roles": roles})
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

class ProjectViewSet(viewsets.ModelViewSet):
  queryset = Project.objects.all().order_by("-updated_at")
  serializer_class = ProjectSerializer
  permission_classes = [ReadOnlyOrAdminContributor]

  @action(detail=True, methods=["post"], url_path="import-indicators", permission_classes=[IsContributorOrAdmin])
  def import_indicators(self, request, pk=None):
    project = self.get_object()
    upload = request.FILES.get("file")
    if not upload:
      return Response({"detail": "file is required"}, status=400)

    required_fields = ["indicator_code", "section", "text", "frequency", "mandatory"]
    created = 0
    errors = []
    total = 0

    def normalize_frequency(value: str):
      if not value:
        return None
      normalized = value.strip().upper().replace(" ", "_")
      for choice, _label in Frequency.choices:
        if normalized == choice:
          return choice
      return None

    def parse_mandatory(value: str):
      if value is None:
        return None
      normalized = value.strip().lower()
      if normalized in ["yes", "true", "1", "y"]:
        return True
      if normalized in ["no", "false", "0", "n"]:
        return False
      return None

    try:
      f = TextIOWrapper(upload.file, encoding="utf-8-sig")
      reader = csv.DictReader(f)
      if not reader.fieldnames:
        return Response({"detail": "CSV headers are required"}, status=400)

      header_map = {name.strip().lower(): name for name in reader.fieldnames}
      missing = [field for field in required_fields if field not in header_map]
      if missing:
        return Response({"detail": f"Missing required columns: {', '.join(missing)}"}, status=400)

      for row_index, row in enumerate(reader, start=2):
        total += 1
        normalized = {key.strip().lower(): (value or "").strip() for key, value in row.items()}
        indicator_code = normalized.get("indicator_code")
        section = normalized.get("section")
        text = normalized.get("text")
        frequency = normalize_frequency(normalized.get("frequency"))
        mandatory_raw = normalized.get("mandatory")
        mandatory = parse_mandatory(mandatory_raw)

        row_errors = []
        if not indicator_code:
          row_errors.append("indicator_code is required")
        if not section:
          row_errors.append("section is required")
        if not text:
          row_errors.append("text is required")
        if not frequency:
          row_errors.append("frequency must be one of: " + ", ".join([choice for choice, _label in Frequency.choices]))
        if mandatory is None:
          row_errors.append("mandatory must be yes/no")

        if row_errors:
          errors.append({"row": row_index, "errors": row_errors})
          continue

        Indicator.objects.create(
          project=project,
          section=section,
          standard=indicator_code,
          indicator_text=text,
          frequency=frequency,
          evidence_min_rule_json={"mandatory": mandatory},
          is_active=True,
        )
        created += 1

      log_audit(
        actor=request.user,
        action=AuditAction.IMPORT,
        entity_type="Indicator",
        entity_id=str(project.id),
        summary=f"Imported indicators into project {project.name}",
        metadata={"created": created, "failed": len(errors), "total": total},
        request=request,
      )

      payload = {"created": created, "failed": errors, "total": total}
      if errors:
        return Response(payload, status=207 if created else 400)
      return Response(payload)
    except Exception as exc:
      return Response({"detail": f"CSV Parse Error: {str(exc)}"}, status=400)

  def perform_create(self, serializer):
    instance = serializer.save(created_by=self.request.user)
    log_audit(
        actor=self.request.user,
        action=AuditAction.CREATE,
        entity_type="Project",
        entity_id=instance.id,
        summary=f"Created project {instance.name}",
        after=serializer.data,
        request=self.request
    )

  def perform_update(self, serializer):
    before = ProjectSerializer(serializer.instance).data
    instance = serializer.save()
    log_audit(
        actor=self.request.user,
        action=AuditAction.UPDATE,
        entity_type="Project",
        entity_id=instance.id,
        summary=f"Updated project {instance.name}",
        before=before,
        after=serializer.data,
        request=self.request
    )

  def perform_destroy(self, instance):
    before = ProjectSerializer(instance).data
    entity_id = instance.id
    name = instance.name
    instance.delete()
    log_audit(
        actor=self.request.user,
        action=AuditAction.DELETE,
        entity_type="Project",
        entity_id=entity_id,
        summary=f"Deleted project {name}",
        before=before,
        request=self.request
    )

@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def user_info(request):
    # This also acts as a CSRF cookie setter if we ensure CSRF token is sent
    from django.middleware.csrf import get_token
    csrf_token = get_token(request)
    if request.user.is_authenticated:
        roles = list(request.user.groups.values_list('name', flat=True))
        return Response({"isAuthenticated": True, "username": request.user.username, "roles": roles, "csrfToken": csrf_token})
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
