import pytest
from django.contrib.auth.models import User, Group
from rest_framework.test import APIClient
from core.models import Indicator, AuditLog, ComplianceRecord

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def contributor():
    user = User.objects.create_user(username='contrib_user', password='password')
    group, _ = Group.objects.get_or_create(name='Contributor')
    user.groups.add(group)
    return user

@pytest.fixture
def indicator():
    return Indicator.objects.create(
        section='SEC1',
        standard='STD1',
        indicator_text='Test Indicator'
    )

@pytest.mark.django_db
class TestAuditTrail:
    def test_compliance_creation_logs(self, api_client, contributor, indicator):
        api_client.force_authenticate(user=contributor)
        url = '/api/compliance/'
        data = {'indicator': indicator.id, 'notes': 'Test compliance log'}
        
        response = api_client.post(url, data)
        assert response.status_code == 201
        
        # Check AuditLog
        log = AuditLog.objects.filter(action='CREATE', entity_type='ComplianceRecord').first()
        assert log is not None
        assert log.actor == contributor
        assert str(indicator.id) in log.summary

    def test_compliance_revoke_logs(self, api_client, contributor, indicator):
        record = ComplianceRecord.objects.create(indicator=indicator, notes='Initial')
        api_client.force_authenticate(user=contributor)
        url = f'/api/compliance/{record.id}/'
        data = {'is_revoked': True, 'revoked_reason': 'Testing audit'}
        
        response = api_client.patch(url, data)
        assert response.status_code == 200
        
        # Check AuditLog
        log = AuditLog.objects.filter(action='REVOKE', entity_type='ComplianceRecord', entity_id=str(record.id)).first()
        assert log is not None
        assert log.actor == contributor
        assert 'Revoked' in log.summary

    def test_snapshot_export_logs(self, api_client, contributor):
        api_client.force_authenticate(user=contributor)
        url = '/api/audit/snapshot/'
        
        response = api_client.get(url)
        assert response.status_code == 200
        
        # Check AuditLog
        log = AuditLog.objects.filter(action='EXPORT_SNAPSHOT').first()
        assert log is not None
        assert log.actor == contributor
