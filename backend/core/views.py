import csv
from io import TextIOWrapper
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from .models import Indicator, ComplianceRecord, EvidenceItem
from .serializers import IndicatorSerializer, ComplianceRecordSerializer, EvidenceItemSerializer
from .services import compute_valid_until, compute_due_status

class IndicatorViewSet(viewsets.ModelViewSet):
  queryset = Indicator.objects.all().order_by("section","standard")
  serializer_class = IndicatorSerializer


  def get_permissions(self):
    if self.action in ["list", "retrieve"]:
      return [permissions.AllowAny()]
    return [permissions.IsAuthenticated()]

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
      
      for i, row in enumerate(reader):
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
        
      if errors:
        return Response({"created": created, "errors": errors}, status=207 if created > 0 else 400)
      return Response({"created": created})
    except Exception as e:
      return Response({"detail": f"CSV Parse Error: {str(e)}"}, status=400)

class ComplianceRecordViewSet(viewsets.ModelViewSet):
  queryset = ComplianceRecord.objects.select_related("indicator").all().order_by("-compliant_on","-created_at")
  serializer_class = ComplianceRecordSerializer
  permission_classes = [permissions.IsAuthenticated]

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
    serializer.save(created_by=self.request.user, valid_until=valid_until)

class EvidenceItemViewSet(viewsets.ModelViewSet):
  queryset = EvidenceItem.objects.select_related("indicator","compliance_record").all().order_by("-created_at")
  serializer_class = EvidenceItemSerializer
  permission_classes = [permissions.IsAuthenticated]

  def get_queryset(self):
    qs = super().get_queryset()
    ind = self.request.query_params.get("indicator")
    if ind:
      qs = qs.filter(indicator_id=ind)
    return qs

  def perform_create(self, serializer):
    serializer.save(created_by=self.request.user)

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
        return Response({"detail": "Logged in", "username": user.username})
    return Response({"detail": "Invalid credentials"}, status=400)

@api_view(["POST"])
def logout_view(request):
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
