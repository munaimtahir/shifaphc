import pytest
from django.utils import timezone
from core.models import Indicator, Frequency, ComplianceRecord
from core.services import compute_due_status

@pytest.mark.django_db
def test_not_started():
  ind = Indicator.objects.create(section="S", standard="St", indicator_text="I")
  assert compute_due_status(ind)[2] == "NOT_STARTED"

@pytest.mark.django_db
def test_one_time_compliant():
  ind = Indicator.objects.create(section="S", standard="St", indicator_text="I", frequency=Frequency.ONE_TIME)
  ComplianceRecord.objects.create(indicator=ind, compliant_on=timezone.localdate())
  assert compute_due_status(ind)[2] == "COMPLIANT"
