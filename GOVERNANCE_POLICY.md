# Governance Policy - Accredify SOS Module

## Roles & Permissions

| Feature | Admin | Contributor | Reviewer |
| :--- | :---: | :---: | :---: |
| **Indicators** | CRUD | R | R |
| **Compliance Records** | CRUD | CRU | R |
| **Evidence Items** | CRUD | CRD | R |
| **Import Indicators** | YES | NO | NO |
| **User Management** | YES | NO | NO |
| **Audit Logs** | YES | YES (Read) | YES (Read) |
| **Audit Summary** | YES | YES | YES |
| **Snapshot Export** | YES | YES | YES |

**Legend:**
- **C**: Create
- **R**: Read
- **U**: Update / Edit / Revoke
- **D**: Delete

## Reviewer Mode Behavior
- Reviewers have read-only access to all compliance and evidence data.
- Mutation endpoints (POST, PATCH, PUT, DELETE) are blocked for Reviewers.
- UI elements for mutation actions (buttons, forms) are hidden for Reviewers.

## Audit Log Guarantees
- Every mutation (Create, Update, Revoke, Delete, Import) generates a durable audit log entry.
- Audit logs include: Actor, Timestamp, Action, Entity Type, Entity ID, Summary, and Before/After snapshots (where applicable and safe).
- Audit logs are append-only.

## Security Posture
- Least privilege access is enforced.
- No leakage to unauthenticated users for compliance/evidence/logs.
- Indicators read-only access may be permitted for unauthenticated users if specified (currently set to AllowAny for list/retrieve).
