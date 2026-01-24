# DATAMODEL.md

## Indicator
- id (uuid)
- section, standard, indicator_text
- evidence_required_text (optional)
- frequency (enum)
- responsible_person (optional)
- evidence_min_rule_json (optional) e.g. {"note":1,"file":1}
- ai_prompt_template (optional; stored text)
- is_active
- timestamps

## ComplianceRecord
- indicator (FK)
- compliant_on (date)
- valid_until (date or null for one-time)
- notes (optional)
- created_by, created_at

## EvidenceItem
- indicator (FK)
- compliance_record (FK optional)
- type (NOTE/FILE/PHOTO/SCREENSHOT/LINK)
- note_text/url/file
- created_by, created_at
