from django.contrib import admin
from .models import Indicator, ComplianceRecord, EvidenceItem

@admin.register(Indicator)
class IndicatorAdmin(admin.ModelAdmin):
  list_display=("section","frequency","is_active","updated_at")
  search_fields=("section","standard","indicator_text")
  list_filter=("frequency","is_active","section")

@admin.register(ComplianceRecord)
class ComplianceRecordAdmin(admin.ModelAdmin):
  list_display=("indicator","compliant_on","valid_until","created_at")
  search_fields=("indicator__indicator_text",)

@admin.register(EvidenceItem)
class EvidenceItemAdmin(admin.ModelAdmin):
  list_display=("indicator","type","created_at")
  list_filter=("type",)
