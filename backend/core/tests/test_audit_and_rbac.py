import pytest
from django.contrib.auth.models import Group, User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from core.models import AuditAction, AuditLog, ComplianceRecord, EvidenceItem, Indicator


@pytest.fixture
def groups(db):
    for name in ["Admin", "Contributor", "Reviewer"]:
        Group.objects.get_or_create(name=name)


@pytest.fixture
def users(groups):
    admin = User.objects.create_user(username="admin", password="pass", is_staff=True, is_superuser=True)
    contributor = User.objects.create_user(username="contrib", password="pass")
    reviewer = User.objects.create_user(username="reviewer", password="pass")
    contributor.groups.add(Group.objects.get(name="Contributor"))
    reviewer.groups.add(Group.objects.get(name="Reviewer"))
    return {"admin": admin, "contributor": contributor, "reviewer": reviewer}


@pytest.fixture
def indicator(db):
    return Indicator.objects.create(section="S1", standard="STD1", indicator_text="Indicator 1")


def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
def test_unauth_cannot_access_protected_endpoints(indicator):
    client = APIClient()
    assert client.get("/api/compliance/").status_code == 403
    assert client.get("/api/evidence/").status_code == 403
    assert client.get("/api/audit/logs/").status_code == 403
    assert client.get("/api/audit/snapshot/").status_code == 403


@pytest.mark.django_db
def test_reviewer_read_only_permissions(users, indicator):
    client = auth_client(users["reviewer"])
    assert client.get("/api/audit/logs/").status_code == 200
    assert client.get("/api/audit/snapshot/").status_code == 200
    resp = client.post(
        "/api/compliance/",
        {"indicator": str(indicator.id), "compliant_on": "2026-01-01"},
        format="json",
    )
    assert resp.status_code == 403
    resp = client.post(
        "/api/evidence/",
        {"indicator": str(indicator.id), "type": "NOTE", "note_text": "Note"},
        format="json",
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_contributor_permissions(users, indicator):
    client = auth_client(users["contributor"])
    resp = client.post(
        "/api/compliance/",
        {"indicator": str(indicator.id), "compliant_on": "2026-01-01"},
        format="json",
    )
    assert resp.status_code == 201
    resp = client.post(
        "/api/evidence/",
        {"indicator": str(indicator.id), "type": "NOTE", "note_text": "Note"},
        format="json",
    )
    assert resp.status_code == 201

    csv_content = "Section,Standard,Indicator\nSec,Std,Ind\n"
    csv_file = SimpleUploadedFile("import.csv", csv_content.encode("utf-8"), content_type="text/csv")
    resp = client.post("/api/indicators/import/", {"file": csv_file})
    assert resp.status_code == 403


@pytest.mark.django_db
def test_admin_permissions(users):
    client = auth_client(users["admin"])
    assert client.get("/api/audit/logs/").status_code == 200


@pytest.mark.django_db
def test_audit_log_creation_for_compliance_and_evidence(users, indicator):
    client = auth_client(users["contributor"])
    resp = client.post(
        "/api/compliance/",
        {"indicator": str(indicator.id), "compliant_on": "2026-01-01"},
        format="json",
    )
    compliance_id = resp.data["id"]
    assert AuditLog.objects.filter(action=AuditAction.CREATE, entity_id=compliance_id).exists()

    resp = client.patch(
        f"/api/compliance/{compliance_id}/",
        {"is_revoked": True, "revoked_reason": "Test"},
        format="json",
    )
    assert resp.status_code == 200
    assert AuditLog.objects.filter(action=AuditAction.REVOKE, entity_id=compliance_id).exists()

    resp = client.post(
        "/api/evidence/",
        {"indicator": str(indicator.id), "type": "NOTE", "note_text": "Note"},
        format="json",
    )
    evidence_id = resp.data["id"]
    assert AuditLog.objects.filter(action=AuditAction.CREATE, entity_id=evidence_id).exists()

    resp = client.delete(f"/api/evidence/{evidence_id}/")
    assert resp.status_code == 204
    log = AuditLog.objects.filter(action=AuditAction.DELETE, entity_id=evidence_id).first()
    assert log is not None
    assert log.metadata["file_deleted"] is False


@pytest.mark.django_db
def test_audit_log_creation_for_import_and_snapshot(users, indicator):
    client = auth_client(users["admin"])
    csv_content = "Section,Standard,Indicator\nSec,Std,Ind\n"
    csv_file = SimpleUploadedFile("import.csv", csv_content.encode("utf-8"), content_type="text/csv")
    resp = client.post("/api/indicators/import/", {"file": csv_file})
    assert resp.status_code in (200, 207)
    assert AuditLog.objects.filter(action=AuditAction.IMPORT, entity_type="Indicator").exists()

    resp = client.get("/api/audit/snapshot/export/")
    assert resp.status_code == 200
    assert AuditLog.objects.filter(action=AuditAction.EXPORT_SNAPSHOT, entity_type="Snapshot").exists()


@pytest.mark.django_db
def test_snapshot_response(users, indicator):
    client = auth_client(users["reviewer"])
    resp = client.get("/api/audit/snapshot/")
    assert resp.status_code == 200
    data = resp.json()
    assert "summary" in data
    assert "indicators" in data
    assert "latest_compliance" in data
    assert "evidence" in data
    resp = client.get("/api/audit/snapshot/export/")
    assert resp.status_code == 200
    assert resp["Content-Type"].startswith("text/csv")
