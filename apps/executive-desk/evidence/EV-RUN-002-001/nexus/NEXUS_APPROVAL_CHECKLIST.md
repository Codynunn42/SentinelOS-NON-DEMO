# NEXUS Approval Checklist
**Evidence ID:** EV-RUN-002-001
**Owner:** Executive Desk
**Standard:** White Glove Service Agreement

## Pre-Gate Checklist

| # | Check | Required Artifact | Status |
|---|-------|-------------------|--------|
| 1 | Runtime health confirmed | GET /health response | [ ] |
| 2 | Bridge execution confirmed | POST /faceplane/openai/execute response with workflowId + hash | [ ] |
| 3 | Decision record present | Gate decision record markdown on disk | [ ] |
| 4 | Reviewer attributed | Named reviewer or Executive Desk Automated Verification in record | [ ] |
| 5 | Timestamp recorded | UTC timestamp in decision record | [ ] |
| 6 | Evidence references present | Artifacts cited by path | [ ] |
| 7 | Findings documented | Exceptions or zero-exception note | [ ] |
| 8 | Constitutional attestation present | Four-point attestation in record | [ ] |

## Approval Rule
All 8 checks must be marked complete before a gate is declared PASS and the checklist is filed as evidence.

## WGSS Standard
Approval is determined by verified completion criteria, not declared intent.
