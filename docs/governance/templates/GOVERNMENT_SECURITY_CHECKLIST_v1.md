# Government Security Checklist v1
Version: 1.0
Status: Draft
Owner: Governance + Security Lane
Last Updated: 2026-07-21

## Purpose
Reusable government-facing security checklist for policy, audit, and readiness workflows.

## Required Evidence Fields
- `timestamp`
- `decision`
- `basis`
- `owner`
- `traceRef`
- `policyId`
- `policyVersion`

## Control Checklist
- [ ] Access Control: Role-based access enforced for policy and evidence operations.
  - Validation: Review role matrix + access tests
  - Evidence: Access test output + role mapping artifact
  - Owner: Security

- [ ] Policy Integrity: All policies versioned and immutable after approval.
  - Validation: Verify version history and lock behavior
  - Evidence: Policy version log
  - Owner: Governance

- [ ] Evidence Integrity: Required evidence fields captured for every decision.
  - Validation: Run evidence schema validator
  - Evidence: Validator output + sample records
  - Owner: Audit/Evidence

- [ ] Change Management: Policy and governance changes tracked with approver identity.
  - Validation: Confirm change record includes requester/approver/date
  - Evidence: Change log extract
  - Owner: Governance

- [ ] Encryption: Data encrypted in transit and at rest.
  - Validation: Confirm TLS + storage encryption settings
  - Evidence: Config snapshot
  - Owner: Platform

- [ ] Incident Readiness: Defined process for security events.
  - Validation: Verify playbook presence and on-call ownership
  - Evidence: Incident SOP + escalation matrix
  - Owner: Security Ops

- [ ] Retention & Deletion: Evidence retention and deletion policy defined.
  - Validation: Confirm retention window and purge method
  - Evidence: Retention policy doc + purge logs
  - Owner: Compliance

- [ ] Third-Party Integration Controls: External adapters isolated by contract and monitored.
  - Validation: Confirm mock/live boundary and failure handling
  - Evidence: Adapter contract + monitoring checks
  - Owner: Integration

## Signoff
- Governance Lead:
- Security Lead:
- Executive Desk:
- Date:
