# DEV NOTES — Phase 2 Implementation

## Changes
- **Backend (`backend/core/`)**:
  - Added `login_view`, `logout_view`, `user_info` in `views.py`.
  - Registered auth routes in `urls.py`.
  - Added `indicator` query parameter filtering to `ComplianceRecordViewSet` and `EvidenceItemViewSet`.
  - Made `start` parameter optional in `AuditViewSet.summary` (defaults to current month).
  - **Security Hardening**:
    - Added file validators (Size: 10MB, Ext: pdf/doc/img/xls) to `EvidenceItem`.
    - Changed evidence upload path to `evidence/<uuid>` to prevent guessing.
    - Improved `import_csv` error handling with row-specific feedback.

- **Frontend (`frontend/src/`)**:
  - Installed `react-router-dom`.
  - Implemented `AuthProvider` and `ProtectedRoute`.
  - Created pages: `Login`, `Dashboard` (refactored), `IndicatorDetail`, `ComplianceForm`, `EvidenceUpload`, `AuditDashboard`, `ImportIndicators`.
  - Updated `api.ts` with comprehensive `request` wrapper handling CSRF and Session Auth, plus all necessary fetchers.

## How to Run
1. Backend: Ensure Django is running (`python manage.py runserver`).
2. Frontend: `cd frontend && npm install && npm run dev`.
3. Open `http://localhost:5173` (or configured port).

## Manual Smoke Test Checklist
1. **Public Access**: Open `/`. You should see the dashboard. Click an indicator. See detail page.
2. **Restricted Access**: Try to access `/audit` or `/compliance/new`. Should redirect to `/login`.
3. **Login**: Go to `/login`. Enter invalid creds (error), then valid creds. Redirects back.
4. **Write Flow**:
   - Go to an indicator.
   - Click "New Compliance Record". Submit.
   - See it appear in history on detail page.
5. **Evidence**: Upload a file. See it appear in list.
6. **Audit**: Go to `/audit`. Check stats.
7. **Import**: Go to "Import" (nav). Download sample. Upload CSV. Verify new indicators appear on Dashboard.
8. **Logout**: Click Logout. Verify you are redirected or UI updates.

## Deployment & Routing (Production Hardening)
- **Caddy Configuration**:
  - Updated `/etc/caddy/Caddyfile` for `sos.alshifalab.pk`.
  - Implemented `route` block to explicitly separate `/api/*`, `/admin/*`, and `/media/*` (proxied to Backend port 8017) from general traffic (proxied to Frontend port 8083).
  - This ensures API calls don't fallback to the frontend's `index.html`.

## Security Audit & Hardening (Phase 2 Final)
### Implemented Fixes
1.  **Evidence Upload Hardening**:
    - Enforced 10MB file size limit (Backend `EvidenceItem` model).
    - Enforced allowed extensions: pdf, doc, docx, jpg, jpeg, png, xlsx, xls.
    - Obscured upload paths using UUIDs (`evidence/<uuid>.<ext>`) to prevent URL guessing.
2.  **Bulk Import Safety**:
    - Improved `import_csv` logic to catch parsing errors and missing fields.
    - Returns detailed error messages (row-by-row) instead of crashing or silent failures.
3.  **Permission Confirmation**:
    - Confirmed `ComplianceRecordViewSet` and `EvidenceItemViewSet` require `IsAuthenticated`.
    - Confirmed `IndicatorViewSet` public endpoints only expose metadata.
4.  **Frontend/Backend Alignment**:
    - Confirmed Frontend hiding matches Backend enforcement.

### Explicit Checklist
- [x] Compliance records not readable without auth (`ComplianceRecordViewSet` has `IsAuthenticated`).
- [x] Evidence not readable without auth (`EvidenceItemViewSet` has `IsAuthenticated`).
- [x] CSRF enforced on all writes (`api.ts` handles CSRF token, `django.middleware.csrf` enabled).
- [x] Status logic backend-only (`compute_due_status` in services.py/serializers.py).
- [x] No frontend-only security (Backend enforces all constraints).
- [x] Uploads securely stored (UUID paths) and validated (Size/Type).
- [x] Caddy routing enforced and verified (API/Admin/Media routed to Backend).

### Production Ready
- Docker stack is configured and running.
- Migrations have been applied.
- Superuser created (`admin`/`admin123`).
- All tests passing.
