# Constitutional Language Boundary Rules - 2026-05-24

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** semantic authority hardening  
**Posture:** prevent language drift from becoming authority drift  
**Authority Created:** false

## Artifact Decision

`[KEEP:CONSTITUTIONAL-LANGUAGE-BOUNDARY-RULES-2026-05-24]`

## Boundary Table

| Term | Allowed Meaning | Must Not Mean |
| --- | --- | --- |
| review | evaluation or assessment | execution approval |
| approved | explicitly granted scope | broad authority |
| eligible | may be considered | authorized |
| ready | prepared for next review | deployed or active |
| authorized | explicitly approved action | implied permission |
| modeled | represented or planned | executed |
| observed | read-only evidence captured | mutated |
| executed | action completed within authority | reviewed or simulated |
| verified | evidence checked | future guarantee |
| aligned | current scope matches approval | permission for future changes |

## Required Phrasing Discipline

```yaml
language_rules:
  say_review_only_when_no_execution_authority: true
  say_internal_draft_when_no_publication_authority: true
  say_verified_current_pass_when_freshness_can_expire: true
  say_aligned_to_approved_scope_not_broadly_authorized: true
  say_held_when_authority_is_absent: true
```

## Prohibited Shortcuts

- "basically approved"
- "ready to deploy" unless deployment authority exists
- "published" unless publication occurred
- "production ready" without production certification
- "safe to execute" without execution authority
- "green means approved"

## Non-Authorization

These language rules do not authorize execution, deployment, publication, runtime mutation, ruleset mutation, billing, funnels, or pilots.

