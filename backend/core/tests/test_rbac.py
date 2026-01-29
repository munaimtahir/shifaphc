import pytest
from django.contrib.auth.models import User, Group
from rest_framework.test import APIClient
from core.models import Indicator

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def users_with_roles():
    admin = User.objects.create_user(username='admin_user', password='password')
    admin_group, _ = Group.objects.get_or_create(name='Admin')
    admin.groups.add(admin_group)

    contributor = User.objects.create_user(username='contrib_user', password='password')
    contrib_group, _ = Group.objects.get_or_create(name='Contributor')
    contributor.groups.add(contrib_group)

    reviewer = User.objects.create_user(username='review_user', password='password')
    review_group, _ = Group.objects.get_or_create(name='Reviewer')
    reviewer.groups.add(review_group)

    return {'admin': admin, 'contributor': contributor, 'reviewer': reviewer}

@pytest.fixture
def indicator():
    return Indicator.objects.create(
        section='SEC1',
        standard='STD1',
        indicator_text='Test Indicator'
    )

@pytest.mark.django_db
class TestRBAC:
    def test_indicator_import_admin_only(self, api_client, users_with_roles):
        url = '/api/indicators/import/'
        
        # Reviewer should fail
        api_client.force_authenticate(user=users_with_roles['reviewer'])
        response = api_client.post(url, {})
        assert response.status_code == 403

        # Contributor should fail
        api_client.force_authenticate(user=users_with_roles['contributor'])
        response = api_client.post(url, {})
        assert response.status_code == 403

        # Admin should pass (or at least not 403)
        api_client.force_authenticate(user=users_with_roles['admin'])
        response = api_client.post(url, {})
        assert response.status_code != 403

    def test_compliance_create_roles(self, api_client, users_with_roles, indicator):
        url = '/api/compliance/'
        data = {'indicator': indicator.id, 'notes': 'Test'}

        # Reviewer should fail
        api_client.force_authenticate(user=users_with_roles['reviewer'])
        response = api_client.post(url, data)
        assert response.status_code == 403

        # Contributor should pass
        api_client.force_authenticate(user=users_with_roles['contributor'])
        response = api_client.post(url, data)
        assert response.status_code == 201

    def test_audit_logs_access(self, api_client, users_with_roles):
        url = '/api/audit/logs/'

        # Unauthenticated should fail
        response = api_client.get(url)
        assert response.status_code == 403

        # Reviewer should pass
        api_client.force_authenticate(user=users_with_roles['reviewer'])
        response = api_client.get(url)
        assert response.status_code == 200
