from datetime import timedelta
from django.utils import timezone
from .models import Frequency

def compute_valid_until(freq: str, compliant_on):
  if freq == Frequency.ONE_TIME:
    return None
  if freq == Frequency.DAILY:
    return compliant_on + timedelta(days=1)
  if freq == Frequency.WEEKLY:
    return compliant_on + timedelta(days=7)
  if freq == Frequency.MONTHLY:
    return compliant_on + timedelta(days=30)
  if freq == Frequency.QUARTERLY:
    return compliant_on + timedelta(days=90)
  if freq == Frequency.ANNUALLY:
    return compliant_on + timedelta(days=365)
  return None

def compute_due_status(indicator):
  lc = indicator.compliance_records.filter(is_revoked=False).order_by("-compliant_on","-created_at").first()
  today = timezone.localdate()
  if not lc:
    return (None, today, "NOT_STARTED")
  if lc.valid_until is None:
    return (lc.compliant_on, None, "COMPLIANT")
  if lc.valid_until < today:
    return (lc.compliant_on, lc.valid_until, "OVERDUE")
  remaining = (lc.valid_until - today).days
  interval = max((lc.valid_until - lc.compliant_on).days, 1)
  due_soon = min(3, max(1, int(interval * 0.2)))
  status = "DUE_SOON" if remaining <= due_soon else "COMPLIANT"
  return (lc.compliant_on, lc.valid_until, status)
