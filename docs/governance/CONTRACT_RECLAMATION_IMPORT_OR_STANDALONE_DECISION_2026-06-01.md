# Contract Reclamation Import Or Standalone Decision - 2026-06-01

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** import or standalone decision request  
**Selected Action:** `REQUEST_CONTRACT_RECLAMATION_IMPORT_OR_STANDALONE_DECISION`  
**State:** Review Open, Import Held  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:CONTRACT-RECLAMATION-IMPORT-OR-STANDALONE-DECISION-2026-06-01]
```

## Purpose

Decide whether `/Users/codynunn/SentinelOS/SentinelOS-NON-DEMO/contract-reclamation` should remain a standalone incubator repo or be imported into the active SentinelOS-NON-DEMO implementation repo.

No import, move, deletion, archive, staging, commit, or push is authorized by this document.

## Source Repo Snapshot

```yaml
source_repo:
  path: /Users/codynunn/SentinelOS/SentinelOS-NON-DEMO/contract-reclamation
  branch: main
  head: no_commits_yet
  remote: none
  current_status:
    - README.md: untracked
    - docs/: untracked
    - package.json: untracked
    - public/: untracked
    - scripts/: untracked
    - src/: untracked
  authority_created: false
```

## Decision Options

```yaml
decision_options:
  standalone_incubator:
    phrase: APPROVE_CONTRACT_RECLAMATION_STANDALONE_INCUBATOR
    effect: keep project as separate repo and create its own first commit/package boundary later
    recommended_when:
      - preserving isolated experimentation matters
      - runtime contract is not ready for active SentinelOS import
      - no active repo dispatch/registry repair authority exists
  import_as_active_repo_faceplane:
    phrase: APPROVE_CONTRACT_RECLAMATION_IMPORT_MANIFEST
    effect: later create exact file-by-file import manifest into active SentinelOS-NON-DEMO
    recommended_when:
      - operator wants contract reclamation inside the governed active runtime tree
      - registry/dispatch/handler contract repair is explicitly approved
      - duplicate docs and runtime paths are reconciled first
  docs_only_reference:
    phrase: APPROVE_CONTRACT_RECLAMATION_DOCS_ONLY_REFERENCE
    effect: preserve active repo docs as canonical and leave standalone runtime untouched
    recommended_when:
      - movement remains held
      - only positioning/alignment is needed
  hold:
    phrase: HOLD_CONTRACT_RECLAMATION_IMPORT_DECISION
    effect: no import and no standalone commit decision
  authority_created: false
```

## Current Recommendation

```yaml
current_recommendation:
  selected_path: APPROVE_CONTRACT_RECLAMATION_STANDALONE_INCUBATOR
  reason:
    - source_repo_has_no_commits_yet
    - active_repo_runtime_repair_is_still_held
    - active_repo_already_has_docs_only_operational_upgrade_alignment
    - data_loss_risk_is_lower_if_import_waits_for_exact_manifest
  authority_created: false
```

## Required If Import Is Later Approved

```yaml
required_import_preflight:
  - exact_source_file_manifest
  - exact_destination_file_manifest
  - duplicate_doc_reconciliation
  - registry_dispatch_contract_repair_authority
  - rollback_or_restore_plan
  - stage_commit_manifest_review
  authority_created: false
```

## Non-Authorization

This decision request does not authorize importing, moving, deleting, archiving, staging, committing, pushing, runtime repair, registry edits, handler creation, package edits, or publication.
