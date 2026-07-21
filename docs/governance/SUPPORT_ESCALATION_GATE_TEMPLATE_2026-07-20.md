# Support Escalation Gate Template - 2026-07-20

**Gate Family:** Support escalation governance  
**State:** Template only; review-held  
**Authority Created:** false

## Template Purpose

Use this template to prepare a provider-specific escalation packet only after a
Sentinel-first evidence trail exists.

## Required Fields

- Gate ID
- Date (UTC)
- Prepared By
- Reviewer
- Lane
- Request ID
- Problem Summary
- Sentinel-First Evidence
- Cloud Attribution
- Requested External Support Action
- Governance Controls
- Decision
- Sign-Off

## Required Control Values

- `staging_authority`: false
- `commit_authority`: false
- `runtime_authority`: false
- `external_contact_authority`: false until the gate is explicitly approved

## Completion Rule

Fill the template only with evidence that already exists in the repository or a
validated local receipt. If the provider ask changes, create a new request ID
and a new gate packet rather than mutating the prior record.

## Non-Authorization

This template does not authorize provider contact, escalation approval,
staging, commit, runtime mutation, or cloud changes.
