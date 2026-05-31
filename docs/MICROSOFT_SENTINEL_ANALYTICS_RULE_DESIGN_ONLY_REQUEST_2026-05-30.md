# Microsoft Sentinel Analytics Rule Design Only Request - 2026-05-30

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** analytics rule design-only request  
**Selected Action:** `REQUEST_ANALYTICS_RULE_DESIGN_ONLY`  
**State:** Design Only, No Rule Creation  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:MICROSOFT-SENTINEL-ANALYTICS-RULE-DESIGN-ONLY-REQUEST-2026-05-30]
```

## Purpose

Authorize review-only design of future Microsoft Sentinel analytics rules without creating rules, querying Log Analytics, changing diagnostics, or mutating runtime.

## Request Classification

```yaml
request_classification:
  selected_action: REQUEST_ANALYTICS_RULE_DESIGN_ONLY
  classification: review_only
  analytics_rule_creation_authorized: false
  log_analytics_live_query_authorized: false
  diagnostic_setting_mutation_authorized: false
  runtime_mutation_authorized: false
  authority_created: false
```

## Design Inputs

```yaml
design_inputs:
  event_name_reconciliation_report: docs/EVENT_NAME_RECONCILIATION_REPORT_2026-05-30.md
  taxonomy_reconciliation: docs/SECURITY_EVENT_TAXONOMY_RECONCILIATION_2026-05-30.md
  phase1_acceptance_review: docs/MICROSOFT_SENTINEL_PHASE1_ACCEPTANCE_REVIEW_2026-05-30.md
  observability_export: docs/MICROSOFT_SENTINEL.md
```

## Candidate Rule Designs

These are draft designs only.

| Candidate Rule | Event Basis | Draft Intent | Creation Authority |
| --- | --- | --- | --- |
| Repeated command auth denied | `command.auth.denied` | Detect repeated unauthorized command attempts in a time window. | Not authorized. |
| Command auth misconfigured | `command.auth.misconfigured` | Detect missing or broken API key registry state. | Not authorized. |
| Governed command block | `blocked-path` | Detect governed command blocks from `/v1/command` execution guard or policy. | Not authorized. |
| Legacy command executed | `command.executed` | Detect legacy `/command` execution receipts only. | Not authorized. |
| Command rate limited | `command.rate_limited` | Detect command-boundary rate limiting after classification. | Not authorized. |
| Passport signing failure | `command.passport.signing_failed` | Detect missing or failed execution passport signing after classification. | Not authorized. |

## Draft KQL Patterns

These are design sketches and must not be run without separate live verification authority.

```kusto
ContainerAppConsoleLogs
| where TimeGenerated > ago(1h)
| where Log contains '"source":"sentinel-api"'
| where Log contains '"eventType":"command.auth.denied"'
```

```kusto
ContainerAppConsoleLogs
| where TimeGenerated > ago(1h)
| where Log contains '"source":"sentinel-api"'
| where Log contains '"eventType":"blocked-path"'
```

## Required Before Rule Creation

```yaml
required_before_rule_creation:
  - explicit_microsoft_sentinel_analytics_rule_creation_authority
  - workspace_scope_confirmation
  - live_KQL_verification_authority
  - false_positive_review
  - alert_threshold_review
  - rule_name_and_severity_review
  - rollback_or_disable_plan
```

## Non-Authorization

This design-only request does not authorize Microsoft Sentinel analytics-rule creation, Log Analytics queries, diagnostic-setting mutation, runtime mutation, command changes, event schema changes, deployment, staging, committing, pushing, publication expansion, or external sharing.
