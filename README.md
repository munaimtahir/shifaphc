# Accred Checklist OS (Keyless MVP)

A keyless accreditation compliance tracker that:
- imports PHC indicators from CSV
- assigns frequency (one-time/daily/weekly/monthly/quarterly/annually)
- tracks due/overdue status
- stores evidence (notes, files, photos, links)
- generates audit packs (month/quarter, per-indicator)

No embedded AI keys. No agent. AI is optional/external via stored prompt templates.

## Stack
- Backend: Django + DRF
- Frontend: React + Vite + TypeScript
- DB: Postgres
- Local dev: Docker Compose

## Quick start
1) `cp backend/.env.example backend/.env`
2) `docker compose up --build`
3) Import indicators:
   `docker compose exec backend python manage.py import_indicators --path "/data/Final PHC list.csv"`
