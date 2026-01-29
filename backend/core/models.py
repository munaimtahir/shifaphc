import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
import os

def validate_file_size(value):
  limit = 10 * 1024 * 1024  # 10 MB
  if value.size > limit:
    raise ValidationError('File too large. Size should not exceed 10 MB.')

def evidence_upload_path(instance, filename):
  ext = filename.split('.')[-1]
  filename = f"{uuid.uuid4()}.{ext}"
  return f"evidence/{filename}"

User = get_user_model()

class Frequency(models.TextChoices):
  ONE_TIME="ONE_TIME","One-time"
  DAILY="DAILY","Daily"
  WEEKLY="WEEKLY","Weekly"
  MONTHLY="MONTHLY","Monthly"
  QUARTERLY="QUARTERLY","Quarterly"
  ANNUALLY="ANNUALLY","Annually"

class EvidenceType(models.TextChoices):
  NOTE="NOTE","Note"
  FILE="FILE","File"
  PHOTO="PHOTO","Photo"
  SCREENSHOT="SCREENSHOT","Screenshot"
  LINK="LINK","Link"

class Indicator(models.Model):
  id=models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
  section=models.TextField()
  standard=models.TextField()
  indicator_text=models.TextField()
  evidence_required_text=models.TextField(blank=True, null=True)
  responsible_person=models.CharField(max_length=255, blank=True, null=True)
  frequency=models.CharField(max_length=16, choices=Frequency.choices, default=Frequency.ONE_TIME)
  evidence_min_rule_json=models.JSONField(blank=True, null=True)
  ai_prompt_template=models.TextField(blank=True, null=True)
  is_active=models.BooleanField(default=True)
  created_at=models.DateTimeField(auto_now_add=True)
  updated_at=models.DateTimeField(auto_now=True)

class ComplianceRecord(models.Model):
  id=models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
  indicator=models.ForeignKey(Indicator, on_delete=models.CASCADE, related_name="compliance_records")
  compliant_on=models.DateField(default=timezone.localdate)
  valid_until=models.DateField(blank=True, null=True)
  notes=models.TextField(blank=True, null=True)
  is_revoked=models.BooleanField(default=False)
  revoked_at=models.DateTimeField(null=True, blank=True)
  revoked_reason=models.TextField(blank=True, null=True)
  created_by=models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="created_compliance_records")
  created_at=models.DateTimeField(auto_now_add=True)
  updated_at=models.DateTimeField(auto_now=True)

class EvidenceItem(models.Model):
  id=models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
  indicator=models.ForeignKey(Indicator, on_delete=models.CASCADE, related_name="evidence_items")
  compliance_record=models.ForeignKey(ComplianceRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name="evidence_items")
  type=models.CharField(max_length=16, choices=EvidenceType.choices)
  note_text=models.TextField(blank=True, null=True)
  url=models.URLField(blank=True, null=True)
  file=models.FileField(
    upload_to=evidence_upload_path,
    blank=True,
    null=True,
    validators=[
      FileExtensionValidator(['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'xlsx', 'xls']),
      validate_file_size
    ]
  )
  created_by=models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="created_evidence_items")
  created_at=models.DateTimeField(auto_now_add=True)

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs")
    action = models.CharField(max_length=64)
    entity_type = models.CharField(max_length=64)
    entity_id = models.CharField(max_length=128, null=True, blank=True)
    summary = models.TextField()
    before_snapshot = models.JSONField(null=True, blank=True)
    after_snapshot = models.JSONField(null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

from django.db.models.signals import post_delete
from django.dispatch import receiver

@receiver(post_delete, sender=EvidenceItem)
def auto_delete_file_on_delete(sender, instance, **kwargs):
  if instance.file:
    try:
      if instance.file.path and os.path.isfile(instance.file.path):
        os.remove(instance.file.path)
    except Exception:
      pass
