# DEV NOTES — Phase 3B (Prod Config & API Sanity)

## CORS/CSRF production sanity
- `CORS_ALLOWED_ORIGINS` is read from `CORS_ALLOWED_ORIGINS` env var.
- `CSRF_TRUSTED_ORIGINS` is derived from `CORS_ALLOWED_ORIGINS`, with HTTPS enforced when `DJANGO_DEBUG=0`.
- `CORS_ALLOW_CREDENTIALS=True` to support session auth; ensure only trusted origins are listed.

**Prod check for sos.alshifalab.pk**
- Ensure `CORS_ALLOWED_ORIGINS` includes `https://sos.alshifalab.pk`.
- Validate `CSRF_TRUSTED_ORIGINS` resolves to `https://sos.alshifalab.pk`.

## `/api/*` routing sanity + health check
Use these commands in production or staging:
```bash
curl -i https://sos.alshifalab.pk/api/health/
curl -i https://sos.alshifalab.pk/api/audit/logs/
curl -i https://sos.alshifalab.pk/api/audit/snapshot/
```
Expected: JSON responses from the backend (not SPA HTML).
