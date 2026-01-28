# DEV NOTES — Phase 2 Implementation

## Changes
- **Backend (`backend/core/`)**:
  - Added `login_view`, `logout_view`, `user_info` in `views.py`.
  - Registered auth routes in `urls.py`.
  - Added `indicator` query parameter filtering to `ComplianceRecordViewSet` and `EvidenceItemViewSet`.
  - Made `start` parameter optional in `AuditViewSet.summary` (defaults to current month).

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

## Testing Notes
- Authentication uses Django Session (cookies). Ensure `credentials: 'include'` is always used (handled in `api.ts`).
- Permissions: Public reads (Indicators), Private writes (Compliance, Evidence, Import) and Private Read (Audit).
