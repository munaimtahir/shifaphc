from core.models import Indicator, ComplianceRecord, EvidenceItem, EvidenceType
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()
admin = User.objects.get(username='admin')
contrib1 = User.objects.get(username='contrib1')

indicators = list(Indicator.objects.all())

if len(indicators) < 5:
    print("Not enough indicators")
    exit()

# 1. Overdue Indicator
ind_overdue = indicators[0]
ind_overdue.frequency = 'MONTHLY'
ind_overdue.save()

comp_date = timezone.localdate() - timedelta(days=40)
valid_until = comp_date + timedelta(days=30)

ComplianceRecord.objects.create(
    indicator=ind_overdue,
    compliant_on=comp_date,
    valid_until=valid_until,
    created_by=contrib1,
    notes="This should be overdue"
)
print(f"Created overdue record for {ind_overdue.id}")

# 2. Due Soon Indicator
ind_duesoon = indicators[1]
ind_duesoon.frequency = 'MONTHLY'
ind_duesoon.save()

comp_date = timezone.localdate() - timedelta(days=25)
valid_until = comp_date + timedelta(days=30)

ComplianceRecord.objects.create(
    indicator=ind_duesoon,
    compliant_on=comp_date,
    valid_until=valid_until,
    created_by=contrib1,
    notes="This should be due soon"
)
print(f"Created due soon record for {ind_duesoon.id}")

# 3. Indicator with history and revoked record
ind_hist = indicators[2]
ind_hist.frequency = 'WEEKLY'
ind_hist.save()

ComplianceRecord.objects.create(
    indicator=ind_hist,
    compliant_on=timezone.localdate() - timedelta(days=100),
    valid_until=timezone.localdate() - timedelta(days=93),
    created_by=contrib1
)

revoked = ComplianceRecord.objects.create(
    indicator=ind_hist,
    compliant_on=timezone.localdate() - timedelta(days=50),
    valid_until=timezone.localdate() - timedelta(days=43),
    created_by=contrib1,
    is_revoked=True,
    revoked_at=timezone.now(),
    revoked_reason="Uploaded wrong evidence"
)

ComplianceRecord.objects.create(
    indicator=ind_hist,
    compliant_on=timezone.localdate(),
    valid_until=timezone.localdate() + timedelta(days=7),
    created_by=contrib1
)
print(f"Created history for {ind_hist.id}")

# 4. Evidence Items
ind_ev = indicators[3]
rec = ComplianceRecord.objects.create(
    indicator=ind_ev,
    compliant_on=timezone.localdate(),
    created_by=contrib1
)

EvidenceItem.objects.create(
    indicator=ind_ev,
    compliance_record=rec,
    type=EvidenceType.NOTE,
    note_text="This is a note only evidence",
    created_by=contrib1
)

EvidenceItem.objects.create(
    indicator=ind_ev,
    compliance_record=rec,
    type=EvidenceType.LINK,
    url="http://example.com/evidence",
    created_by=contrib1
)

print(f"Created evidence for {ind_ev.id}")
