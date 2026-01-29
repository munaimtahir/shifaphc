from rest_framework import serializers
from .models import Indicator, ComplianceRecord, EvidenceItem, AuditLog
from .services import compute_due_status

class IndicatorSerializer(serializers.ModelSerializer):
  last_compliant_on = serializers.SerializerMethodField()
  next_due_on = serializers.SerializerMethodField()
  due_status = serializers.SerializerMethodField()

  class Meta:
    model = Indicator
    fields = [
      "id","section","standard","indicator_text","evidence_required_text",
      "responsible_person","frequency","evidence_min_rule_json","ai_prompt_template",
      "is_active","created_at","updated_at",
      "last_compliant_on","next_due_on","due_status"
    ]

  def _t(self, obj):
    return compute_due_status(obj)

  def get_last_compliant_on(self, obj): return self._t(obj)[0]
  def get_next_due_on(self, obj): return self._t(obj)[1]
  def get_due_status(self, obj): return self._t(obj)[2]

class ComplianceRecordSerializer(serializers.ModelSerializer):
  class Meta:
    model = ComplianceRecord
    fields = ["id","indicator","compliant_on","valid_until","notes","is_revoked","revoked_at","revoked_reason","created_by","created_at","updated_at"]
    read_only_fields = ["created_by","created_at","updated_at","revoked_at"]

class EvidenceItemSerializer(serializers.ModelSerializer):
  class Meta:
    model = EvidenceItem
    fields = ["id","indicator","compliance_record","type","note_text","url","file","created_by","created_at"]
    read_only_fields = ["created_by","created_at"]

class AuditLogSerializer(serializers.ModelSerializer):
  actor_username = serializers.SerializerMethodField()

  class Meta:
    model = AuditLog
    fields = [
      "id","timestamp","actor","actor_username","action","entity_type","entity_id",
      "summary","ip_address","user_agent","before","after","metadata"
    ]

  def get_actor_username(self, obj):
    return obj.actor.username if obj.actor else None
