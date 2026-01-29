# DEV NOTES - PHASE 3B (Governance & Trust)

## Progress Checklist
- [x] Task 0: Repo discovery & policy lock
- [x] Task 1: RBAC (Roles & Permission Enforcement)
- [x] Task 2: Audit Logging (Mutation Ledger)
- [x] Task 3: Audit Log UI + Search + Export
- [x] Task 4: Reviewer Mode (Read-only Experience)
- [x] Task 5: Audit Snapshot Export (Executive-ready)
- [x] Task 6: Security & Compliance Hardening Checks
- [x] Task 7: Testing & Docker Validation

## Implementation Notes

### RBAC Approach
- Using Django Groups: `Admin`, `Contributor`, `Reviewer`.
- Custom DRF Permission Classes: `IsAdmin`, `IsContributorOrAdmin`, `IsReviewerOrHigher`.
- Frontend role-gating using `useAuth` hook and `canMutate` / `isReviewer` properties.

### Audit Logging
- New `AuditLog` model with `UUID` primary key for immutability-lite.
- Captures actor, action, timestamp, entity details, and before/after JSON snapshots.
- `log_audit` utility with JSON sanitization (handling UUIDs/datetimes).
- Actions logged: CREATE, UPDATE, DELETE, REVOKE, IMPORT, ASSIGN_ROLE, DOWNLOAD_EVIDENCE, EXPORT_LOGS, EXPORT_SNAPSHOT.

### Snapshot Export
- `/api/audit/snapshot/` generates a point-in-time state of all indicators, their status, and latest evidence.
- Frontend `/audit/snapshot` page with CSV export and Print-to-PDF support.

### Security Hardening
- Secure download endpoint `/api/evidence/:id/download/` prevents unauthenticated access to media files.
- RBAC strictly enforced on the backend; frontend hides mutation controls for Reviewers.

### Testing
- Automated tests in `core/tests/test_rbac.py` and `core/tests/test_audit.py`.
- Verified 100% pass rate in Docker environment.
