# Sentinel AI Work Packet — DOE Executive Assessment

This packet is the handoff for parallel Sentinel AI work while the primary operator lane stays focused on website, deployment, and production launch execution.

## Purpose

Run the DOE-focused Executive Assessment content and intake design work in parallel without blocking Executive Desk production finishing work.

## Background Context

- Executive Desk is the governed executive operating surface for SentinelOS.
- Public positioning is shifting from pilot/demo language toward outcome-first executive assessment and governed operations.
- The public GPT surface should act as a concierge and assessment front door, not as a privileged execution agent.
- DOE-oriented intake must emphasize decision readiness, operating constraints, governance, delegation, cadence, and audit posture.

## Parallel Scope

Sentinel AI owns the following two jobs in parallel:

1. GPT Builder conversation starters for DOE-focused Executive Assessment intake.
2. DOE-focused Executive Assessment intake schema and validation design.

Do not expand into production deployment, backend auth changes, command execution changes, or website deployment operations.

## Global Constraints

- Tone: executive, concise, governed, outcome-first.
- Avoid generic chatbot phrasing.
- Do not describe the public GPT as having privileged authority.
- Do not imply government approval, compliance certification, or production authorization that has not been explicitly verified.
- Keep the public GPT in concierge/assessment posture.
- Prioritize decision readiness, authority clarity, execution bottlenecks, risk, cadence, and auditability.

## Job 2 — GPT Builder Conversation Starters

### Job 2 Objective

Create production-ready GPT Builder conversation starters for SentinelOS Executive Desk focused on DOE-oriented Executive Assessment intake.

### Job 2 Sentinel AI Prompt

```text
Create a production-ready set of GPT Builder conversation starters for SentinelOS Executive Desk focused on DOE-oriented Executive Assessment intake.

Requirements:
- Audience: executive operators, program leads, strategic partners, and decision-makers evaluating DOE-related opportunities or operating risk.
- Tone: concise, executive, outcome-focused, governance-aware.
- Avoid generic chatbot language.
- Produce 12 conversation starters.
- Each starter must be specific enough to trigger a high-value assessment workflow.
- Emphasize decision readiness, bottlenecks, authority, delegation, cadence, risk, compliance posture, and execution constraints.
- Do not frame the system as a casual assistant; frame it as a governed executive assessment surface.
- Output format:
  1. Short title
  2. Starter prompt
  3. One-line explanation of what assessment it triggers

Include a final recommended top 4 starters for public GPT Builder use.
```

### Job 2 Deliverables

- A set of 12 final conversation starters.
- A recommended top 4 for public GPT Builder configuration.
- A short rationale for why the top 4 should be public defaults.

### Job 2 Acceptance Criteria

- All 12 starters are specific and non-generic.
- At least 8 of 12 clearly invoke decision readiness, governance, or execution risk.
- None of the starters imply the GPT can directly perform privileged DOE execution.
- The top 4 are suitable for immediate GPT Builder starter use.

## Job 3 — DOE Intake Form Schema

### Job 3 Objective

Design a DOE-focused Executive Assessment intake schema for SentinelOS Executive Desk.

### Job 3 Sentinel AI Prompt

```text
Design a DOE-focused Executive Assessment intake form schema for SentinelOS Executive Desk.

Requirements:
- The schema should support executive intake, not a general support form.
- Capture the minimum fields required to assess decision readiness, governance posture, execution constraints, risk, and reporting cadence.
- Include field name, label, type, required/optional status, and short rationale.
- Organize fields into logical sections.
- Include recommended enums/select options where applicable.
- Include fields for:
  - organization identity
  - initiative/program name
  - mission objective
  - current stage
  - decision needed
  - decision deadline
  - stakeholders / authority owners
  - constraints / blockers
  - compliance or regulatory concerns
  - operational cadence
  - success criteria
  - known risks
  - requested outcome from Executive Desk
- Output:
  1. Human-readable form structure
  2. JSON schema draft
  3. Suggested validation rules
  4. Recommended “minimum viable intake” version for fast submission
```

### Job 3 Deliverables

- Human-readable form structure grouped by section.
- JSON schema draft suitable for frontend or API validation work.
- Suggested validation rules for required fields, enums, dates, and text lengths.
- A minimum viable intake subset for quick public submission.

### Job 3 Acceptance Criteria

- Schema is executive-assessment oriented, not customer support oriented.
- Required fields are limited to the minimum needed for triage and assessment quality.
- The minimum viable intake can be completed quickly while still supporting a meaningful assessment.
- Validation rules are concrete enough to implement directly.

## Optional Stretch Work

Only run this after Jobs 2 and 3 are complete.

### Optional Job 4 — Synthesis Pass

Combine the Job 2 starter set and Job 3 intake schema into a recommended public GPT intake flow.

Expected output:

- recommended first message for the GPT
- recommended order of conversation starters
- recommended handoff point from GPT to human Executive Assessment workflow
- note on which schema fields should be gathered conversationally vs. through a form

## Explicit Out Of Scope

- website code changes
- Vercel or public site deployment
- auth hardening implementation
- proxy/API command surface changes
- database migrations
- production readiness sign-off
- legal/compliance claims beyond documented facts

## Handoff Output Format

Sentinel AI should return results in this order:

1. Job 2 final output
2. Job 3 final output
3. Optional Job 4 output, if completed
4. Open questions that require human/operator decisions

## Operator Note

Primary operator focus remains on:

- finishing public website repositioning
- validating the correct production source and build path
- clearing deployment blockers
- preparing the public-facing Executive Assessment funnel

This packet exists to keep content and intake design moving in parallel.

DATABASE_URL=postgres://user:password@sentinel-postgres:5432/sentinelos
