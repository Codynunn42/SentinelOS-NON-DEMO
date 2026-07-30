# Executive Standing Focus Block — Executive Brief Preparation, Evidence Scan, Next-Action Review

Owner: Strategy Intelligence Lead
Cadence: Weekdays (Mon–Fri)
Source artifact: government-readiness/governance/cadence/daily/2026-07-18_EXECUTIVE_INTELLIGENCE_BRIEF.md
Purpose: Ensure the daily executive brief is prepared, evidence (EV-RUN) is scanned/merged, and next actions are assigned or scheduled.

## Inputs

- Latest evidence bundle: `apps/executive-desk/evidence/EV-RUN-002-001/`
- Render templates: `apps/executive-desk/cadence/templates/`
- Runtime metadata: `runtime_metadata.yaml`, `gpt_revision_metadata.yaml`
- Sentinel ingestion status (Log Analytics)

## Agenda / Steps (short)

1. Prepare executive brief draft from template (render with `render_template.py`).
2. Run evidence scan and merge builder metadata (`update_evrun_evidence.py`).
3. Run `2026-07-28_next_block_scan.sh` to perform health checks and TILDA ingestion verification.
4. Review outstanding next-actions and assign/close items.
5. If an item requires follow-up or is blocked, set due date and owner (or create an incident/issue).

## Outputs

- Rendered executive brief(s) in `apps/executive-desk/cadence/rendered_templates/`
- Updated `evidence_record.yaml` and `MANIFEST.sha256`
- Ingested records into Microsoft Sentinel (Log Analytics) under `ExecutiveTemplates_CL` or `TILDA_CL`
- Incident or task created if human input required

## Acceptance / Done Criteria

- Brief draft ready for review (owner or deputy)
- Evidence metadata merged and manifest updated
- Any missing artifacts requested via Faceplane/bridge workflow
- Sentinel query confirms at least one new TILDA/ExecutiveTemplates entry (when applicable)
- Next actions assigned or scheduled

## Escalation

- If evidence merge fails -> notify Strategy Intelligence Lead + Engineering (email/Teams)
- If Sentinel ingestion fails -> open ticket with Cloud Ops and include request-id and logs

## Schedule & Automation

- Run the scan and render steps automatically each weekday at 08:30 UTC via:
  - Option A: Azure Logic App (recurrence) that calls a webhook on repo runner / function
  - Option B: Cron on a trusted runner (example below)

Cron example (runner):
`30 8 * * 1-5 /full/path/to/2026-07-28_next_block_scan.sh >> /var/log/executive_scan.log 2>&1`

## Notes

- Local Sentinel (internal helper) remains for testing. All ingestion for production must use Microsoft Sentinel (Log Analytics) in Azure.
- Store sensitive keys in Azure Key Vault and reference them in Logic Apps or CI secrets.
