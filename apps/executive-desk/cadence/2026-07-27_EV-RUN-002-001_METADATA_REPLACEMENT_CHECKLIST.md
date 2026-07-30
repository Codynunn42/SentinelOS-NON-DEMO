# EV-RUN-002-001 Metadata Replacement Checklist

Date: 2026-07-27
Record: EV-RUN-002-001
Prepared by: Cody Nunn (Interim, role: Executive Desk)

## Purpose

Capture and apply exact GPT Builder revision metadata values so all current Unverified revision fields can be closed without inferred values.

## Owner Model

- Named-owner collection authority: COO / Chief of Staff
- Interim execution owner until named list is finalized: Cody Nunn

## Replacement Checklist

1. File: evidence/EV-RUN-002-001/gpt_revision_metadata.yaml

- Field: revision.revision_id
- Current value: Unverified
- Required action: Replace with exact revision ID from GPT Builder revision history.
- Source of truth: GPT Builder Version/Revision History
- Owner: Cody Nunn (Interim, role: COO / Chief of Staff)
- Status: Pending

1. File: evidence/EV-RUN-002-001/gpt_revision_metadata.yaml

- Field: revision.version_label
- Current value: Unverified
- Required action: Replace with exact version label from GPT Builder.
- Source of truth: GPT Builder Version/Revision History
- Owner: Cody Nunn (Interim, role: COO / Chief of Staff)
- Status: Pending

1. File: evidence/EV-RUN-002-001/gpt_revision_metadata.yaml

- Field: revision.revision_timestamp
- Current value: Unverified
- Required action: Replace with exact builder timestamp if present in revision history; if no timestamp is exposed, keep explicit Unverified and record capture limitation.
- Source of truth: GPT Builder Version/Revision History
- Owner: Cody Nunn (Interim, role: COO / Chief of Staff)
- Status: Pending

1. File: evidence/EV-RUN-002-001/gpt_revision_metadata.yaml

- Field: capture.captured_at_utc
- Current value: 2026-07-26T14:18:18.214Z
- Required action: Replace with actual capture timestamp used for metadata extraction.
- Source of truth: Capture log and evidence timestamp records
- Owner: Cody Nunn (Interim, role: Executive Desk)
- Status: Pending refresh at time of source capture

1. File: evidence/EV-RUN-002-001/request_response.json

- Field: evidence_record.gpt_revision_id
- Current value: Unverified
- Required action: Replace with exact revision ID from GPT Builder.
- Source of truth: GPT Builder Version/Revision History
- Owner: Cody Nunn (Interim, role: COO / Chief of Staff)
- Status: Pending

1. File: evidence/EV-RUN-002-001/runtime_metadata.yaml

- Field: evidence_record.gpt_revision_id
- Current value: Unverified
- Required action: Replace with exact revision ID from GPT Builder.
- Source of truth: GPT Builder Version/Revision History
- Owner: Cody Nunn (Interim, role: COO / Chief of Staff)
- Status: Pending

1. File: evidence/EV-RUN-002-001/request_response.json

- Field: evidence_record.service_version.sentinel-api
- Current value: not exposed by application
- Required action: Confirm this is an intentional final value; if service version becomes available, replace with exact version string.
- Source of truth: Runtime health response and service metadata endpoint/logs
- Owner: Cody Nunn (Interim, role: Executive Desk)
- Status: Completed (normalized to value/source structure)

1. File: evidence/EV-RUN-002-001/runtime_metadata.yaml

- Field: runtime_metadata.service.version and evidence_record.service_version.sentinel-api
- Current value: not exposed by application
- Required action: Confirm intentional final value and normalize formatting with runtime_metadata.yaml.
- Source of truth: Runtime health response and service metadata endpoint/logs
- Owner: Cody Nunn (Interim, role: Executive Desk)
- Status: Completed (canonicalized in runtime_metadata.yaml; duplicate file removed)

## Live Source-Capture Runbook

Precondition for this runbook:

- Complete and publish the serious V2 Builder revision package first.
- Reference: cadence/2026-07-28_GPT_V2_REVISION_PACKAGE.md

1. Capture source values from GPT Builder Version/Revision History.

- Required values to copy exactly:
  - revision_id
  - version_label
  - revision_timestamp (if exposed)
- Capture rules:
  - Copy values exactly as shown (case, punctuation, timezone).
  - Do not transform formatting.
  - If timestamp is unavailable in Builder UI, keep revision_timestamp as Unverified and log reason.

1. Record capture event metadata.

- capture.captured_at_utc: set to current UTC timestamp at extraction time.
- capture.captured_by: confirm operator name.
- revision.source_capture_status:
  - Set to Captured if all available fields were collected.
  - Keep explicit not-captured language if any required field remains unavailable.

1. Apply values to all required files.

- evidence/EV-RUN-002-001/gpt_revision_metadata.yaml
- evidence/EV-RUN-002-001/runtime_metadata.yaml
- evidence/EV-RUN-002-001/request_response.json

1. Regenerate integrity manifest.

- cd evidence/EV-RUN-002-001 && shasum -a 256 evidence_record.yaml request_response.json runtime_metadata.yaml reviewer_attestation.yaml gpt_revision_metadata.yaml > MANIFEST.sha256

1. Re-run evidence scans.

- Placeholder scan:
  - rg -n "<EXACT|placeholder|TODO|TBD|REPLACE" evidence/EV-RUN-002-001
- Unverified scan:
  - rg -n "\\bUnverified\\b|UNVERIFIED" evidence/EV-RUN-002-001

1. Log the result in the validation record.

- Update: cadence/2026-07-27_FINAL_PLACEHOLDER_VALIDATION_RECORD.md
- Include: timestamp, owner, fields captured, remaining Unverified fields (if any), manifest regeneration confirmation.

Additional log requirement for V2 cycle:

- Record the V2 publish event name/label and publish timestamp before logging capture outcome.

## Capture Worksheet (Fill Before Apply)

- revision_id: [paste exact value]
- version_label: [paste exact value]
- revision_timestamp: [paste exact value or write Not exposed in Builder UI]
- captured_at_utc: [UTC timestamp at moment of capture]
- captured_by: Cody Nunn

## Completion Criteria

- gpt_revision_id is no longer Unverified in runtime_metadata.yaml and request_response.json.
- revision_id and version_label are no longer Unverified in gpt_revision_metadata.yaml.
- revision_timestamp is replaced if source provides it; otherwise explicit capture limitation is documented.
- MANIFEST.sha256 is regenerated after any file change.
- Validation record contains a dated Step 5 entry with capture outcome.

## Normalization Note

- Duplicate runtime metadata files are present:
  - evidence/EV-RUN-002-001/runtime_metadata.yaml
- Action: select canonical file for sign-off package and align values to prevent review ambiguity.
- Owner: Cody Nunn (Interim, role: Executive Desk)
- Status: Completed (runtime_metadata.yaml selected as canonical; duplicate removed)

## Step 2 Done Criteria

- All placeholder tokens replaced or explicitly documented as unavailable with source note.
- Service version value disposition confirmed and normalized.
- Canonical runtime metadata file identified for final review packet.

## Step 3 Validation Snapshot (2026-07-27)

- Manifest regenerated for canonical set: MANIFEST.sha256.
- Final placeholder scan result: PASS (0 unresolved placeholders).
- Remaining metadata gap: GPT Builder revision values remain explicitly Unverified pending source capture.
