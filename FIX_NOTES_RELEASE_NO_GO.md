# FIX NOTES — Release No-Go Remediation

## Current state summary (pre-fix)
- Audit Logs API and model were missing; `/api/audit/logs/` returned 404.
- Audit logging was not wired into compliance/evidence mutations or indicator import.
- Snapshot export endpoint was missing.
- Backend tests lacked RBAC and audit coverage (only due-status tests existed).
- CORS/CSRF production settings existed but needed confirmation and documentation.

## Changes to implement (this patch)
- Add `AuditLog` model + migration and register in admin.
- Add `log_audit()` utility with sanitization and request metadata capture.
- Wire audit logging into compliance/evidence create/update/revoke/delete, indicator import, and snapshot export.
- Add Audit Logs list + CSV export endpoints with filters and pagination.
- Add Snapshot endpoint + CSV export and audit the export action.
- Add RBAC + audit + snapshot tests.
- Document prod CORS/CSRF settings and `/api/health/` checks in `DEV_NOTES_PHASE3B.md`.
