## Completed Tasks

### 1. Compliance Improvements
- **Revoke/Invalidate**: Added `is_revoked`, `revoked_at`, and `revoked_reason` fields to `ComplianceRecord`.
- **Status Computation**: Updated `compute_due_status` service to ignore revoked records.
- **Edit Compliance**: Implemented `/compliance/:id/edit` route and functional `ComplianceForm` for updates.
- **UI Actions**: Added "Edit" and "Revoke" buttons to the compliance history list.

### 2. Evidence Management
- **Delete Evidence**: Implemented DELETE endpoint and added `post_delete` signal to clean up media files from storage.
- **Edit Evidence**: Added ability to edit evidence `note_text` via inline prompt in the workbench.
- **Safer UX**: Added confirmation prompts ("Type DELETE to confirm") for all destructive actions.

### 3. Indicator Workbench
- **Parallel Fetching**: Section-wise loading states for Indicator detail, Compliance history, and Evidence items.
- **Quick Action Panel**: Sticky panel at the top for Add Compliance, Upload Evidence, and View Audit.
- **Breadcrumbs**: Improved navigation context.
- **Empty States**: Professional placeholders with CTAs when no records/items exist.

### 4. Indicators List (Dashboard)
- **Pagination**: Client-side pagination (default 25/page) with controls for page size and navigation.
- **Filters**: Added status filter (Compliant, Due Soon, Overdue, Not Started) integrated with backend filtering.
- **Refined Styling**: Modern table layout with improved typography and status badges.

### 5. Global UX
- **Toast Notifications**: Implemented a lightweight `ToastProvider` for success/error feedback.
- **Protected Actions**: Actions only visible and accessible to authenticated users.
- **Consistent Dates**: Standardized date formatting using `toLocaleDateString`.

## Technical Details
- **Migrations**: `0003_compliancerecord_is_revoked_and_more.py` applied.
- **Signal Handlers**: Added to `core/models.py` for file cleanup.
- **Frontend State**: Used `useCallback` and `useMemo` for performance in larger lists.

## Smoke Test Checklist
- [x] Login/Logout cycle works.
- [x] Indicator search and status filtering works.
- [x] Dashboard pagination works across pages.
- [x] Indicator detail page loads correctly with parallel segments.
- [x] Creating new compliance record updates indicator status.
- [x] Editing compliance record works and reflects changes.
- [x] Revoking compliance record correctly triggers status change (e.g., COMPLIANT -> OVERDUE).
- [x] Uploading evidence (Files/Notes) works.
- [x] Editing evidence note works.
- [x] Deleting evidence works and removes file from disk.
- [x] Toast notifications show for all above actions.
