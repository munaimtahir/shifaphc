# API/Interfaces

Base: `/api/`

- Indicators CRUD: `/api/indicators/`
  - filters: q, section, frequency, due_status, is_active
  - computed: last_compliant_on, next_due_on, due_status
  - CSV import endpoint: POST `/api/indicators/import/` (multipart file)

- Compliance CRUD: `/api/compliance/`
  - create computes valid_until from indicator.frequency if not provided

- Evidence CRUD: `/api/evidence/` (multipart upload)

- Audit
  - GET `/api/audit/summary?period=month|quarter&start=YYYY-MM-DD`
  - (v1) export endpoint returns zip with summary + manifest + evidence
