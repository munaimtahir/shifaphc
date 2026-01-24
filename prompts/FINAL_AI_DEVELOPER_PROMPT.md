# Final AI Developer Prompt — Accred Checklist OS (Keyless)

Implement the MVP as described in docs. Non-negotiables:
- No AI API keys/calls
- No iframe embedding
- No browser automation
- Deterministic scheduling/evidence/export

Must run:
- `docker compose up --build`
- `docker compose exec backend python manage.py import_indicators --path "/data/Final PHC list.csv"`
