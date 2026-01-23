# ARCHITECTURE.md

Backend: Django/DRF REST API
Frontend: React/Vite/TS UI
DB: Postgres

Key principle: app is deterministic; AI is external and optional.

Services (dev):
- postgres
- backend
- frontend

Media: local bind volume in docker-compose (`./volumes/media`).
