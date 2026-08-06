# SentinelOS Command Envelope

## Command Identity

```yaml
command:
  id: "repo.governance.documents.classify-and-organize"
  version: "1.0.0"
  tenant: "nunncloud"
  principal_id: "codynunn"
  executor_role: "owner"
  operating_mode: "review-first"
  execution_class: "repository-document-governance"
  mutation_authority: "conditional"
  external_use: false
  runtime_mutation: false
  deployment_authority: false
  azure_authority: false
  commit_authority: false
  push_authority: false
```

## Executive Direction
Perform a complete governance, classification, and organization review of the
SentinelOS-NON-DEMO documentation repository.

The objective is not merely to create a cleaner folder structure.

The objective is to establish a defensible canonical repository in which:

1. the Master Operating Binder remains the enterprise operating authority;
2. the Government Blueprint inherits from the MOB;
3. the Executive Desk operationalizes governing doctrine;
4. customer-experience materials express the institutional philosophy;
5. cadence records remain distinct from active doctrine;
6. evidence remains distinct from policy;
7. release artifacts remain distinct from current operating authority;
8. superseded records preserve their history and lineage;
9. every active document has one clear canonical home;
10. no parallel doctrine is created.

## Repository Scope

```
repository:
  path: "/Users/codynunn/SentinelOS/SentinelOS-NON-DEMO/SentinelOS-NON-DEMO"
  remote: "https://github.com/Codynunn42/SentinelOS-NON-DEMO.git"
  working_branch: "ops/closeout-2026-06-20"
  protected_branch: "main"
```

## Authoritative Inputs
Review and reconcile at minimum:

- `docs/governance/CANONICAL_DOCUMENTS_INDEX_2026-05-11.md`
- `docs/governance/REPO_AUTHORITY_MAP_2026-05-08.md`
- `docs/governance/REPO_CONTROL_LAYER.md`
- `docs/GBP/doctrine/NUNN_CORPORATION_MASTER_OPERATING_BINDER_2026-06-15.md`
- `docs/GBP/doctrine/JULY_03_MASTER_OPERATING_BLUEPRINT_OVERLAY_2026-07-03.md`
- `docs/GBP/assessments/JULY_05_EXECUTIVE_MOB_BOARD_COMPARISON_2026-07-05.md`
- `docs/GBP/assessments/JULY_05_MOB_DRIFT_REPORT_2026-07-05.md`
- `docs/GBP/assessments/MOB_MOVEMENT_MAP_2026-07-05.md`
- `docs/GBP/assessments/MOB_MOVEMENT_QUEUE_PROCESSING_RESULT_2026-07-05.md`
- `docs/governance/SENTINEL_MANAGED_REPOSITORY_ORGANIZATION_CONTROL_PACKET_2026-06-01.md`
- `docs/governance/SENTINEL_MANAGED_REPOSITORY_EVIDENCE_AND_CLASSIFICATION_2026-06-11.md`
- `docs/governance/SENTINEL_STEERING_DOCUMENT_CANCELLATION_AND_AUTHORITY_LAYER_DIRECTION_2026-06-18.md`
- `docs/governance/RECORD_CLASSIFICATION_DIRECTIVE_RECONCILIATION_2026-06-12.md`
- `docs/governance/SENTINEL_AI_RECORD_CLASSIFICATION_AND_ACCESS_SEGREGATION_POLICY_2026-06-12.md`
- current contents of:

- `docs/GBP/`
- `docs/governance/`
- `docs/executive-desk/`
- `docs/executive-desk-gpt/`
- `docs/releases/`
- `docs/sovereign/`
Do not assume that the oldest index remains authoritative where a later,
owner-approved directive explicitly supersedes it.

## Required Classification Model
Classify every candidate document using these fields:

```
classification:
  record_type:
    - doctrine
    - policy
    - blueprint
    - operating_model
    - template
    - cadence
    - decision_packet
    - approval_result
    - review_result
    - implementation_manifest
    - evidence
    - release_record
    - intelligence
    - customer_asset
    - partner_asset
    - technical_design
    - historical_record
    - archive_candidate

  authority_layer:
    - MOB
    - GBP
    - executive_desk
    - sentinel_ai
    - sentinel_os
    - customer_experience
    - runtime
    - product
    - release
    - evidence_only
    - historical

  lifecycle:
    - canonical_active
    - active_supporting
    - review_held
    - superseded
    - historical
    - archive_candidate
    - unresolved

  access:
    - public
    - protected
    - internal
    - restricted
    - held
```

## Canonical Placement Intent
Use the existing repository structure wherever it already expresses approved
authority.

Preferred homes include:

```
docs/
├── GBP/
├── governance/
├── executive-desk/
├── executive-desk-gpt/
├── releases/
├── sovereign/
├── diagrams/
├── anchors/
├── cadence/
├── intelligence/
└── archive/
```
Create new subdirectories only when necessary and justified.

Possible subdirectories:

```
docs/GBP/
├── doctrine/
├── deployment-profiles/
├── assessments/
├── overlays/
└── evidence/

docs/executive-desk/
├── operating-model/
├── customer-journey/
├── service/
├── assessments/
├── pilots/
├── customer-success/
├── templates/
└── cadence/

docs/releases/
├── executive-desk/
├── runtime/
├── ownerfi/
└── historical/
```

## Permanent Filename Controls
Preserve the canonical filename:

```
Phase-4-Deployment-Profiles.md
```
Do not create a parallel file named:

```
Deployment-Profiles.md
```
Preserve:

```
NUNN_CORPORATION_MASTER_OPERATING_BINDER_2026-06-15.md
```
unless a later owner-approved canonical successor is explicitly identified.

Do not rename documents merely to improve style.

## Phase 1 — Read-Only Discovery
Perform the following without moving files:

1. inventory every file under `docs/`;
2. identify current canonical indexes;
3. identify authority declarations;
4. identify exact duplicate files by SHA-256;
5. identify duplicate or conflicting filenames;
6. identify near-duplicate doctrine;
7. identify documents stored outside their likely canonical domain;
8. identify active doctrine stored under release folders;
9. identify release evidence stored as active doctrine;
10. identify cadence records mixed with governing documents;
11. identify broken or ambiguous supersession chains;
12. identify links that would break if proposed moves were executed;
13. identify documents whose ownership cannot be resolved;
14. identify untracked or ignored governance records;
15. compare the working branch with `main` without switching branches.

## Phase 1 Required Outputs
Create:

```
docs/reviews/<date>-repository-governance/
├── REPOSITORY_GOVERNANCE_EXECUTIVE_SUMMARY.md
├── DOCUMENT_CLASSIFICATION_REGISTER.csv
├── CANONICAL_AUTHORITY_MAP.md
├── PROPOSED_MOVEMENT_MANIFEST.csv
├── DUPLICATE_AND_CONFLICT_REPORT.md
├── BROKEN_REFERENCE_RISK_REPORT.md
├── SUPPORT_NEEDED_REGISTER.md
├── BRANCH_COMPARISON_REPORT.md
├── PROPOSED_FOLDER_TREE.md
└── OWNER_DECISION_PACKET.md
```
The proposed movement manifest must contain:

```
fields:
  - source_path
  - proposed_destination
  - filename
  - record_type
  - authority_layer
  - lifecycle
  - access
  - governing_source
  - supersedes
  - superseded_by
  - duplicate_status
  - reference_risk
  - rationale
  - confidence
  - owner_decision_required
```

## Phase 2 — Conditional Organization
Phase 2 is not authorized until the owner approves the Phase 1 decision packet.

When authorized:

1. create approved destination directories;
2. use `git mv` for tracked files;
3. never overwrite an existing file;
4. never delete a record;
5. never flatten distinct evidence into one document;
6. preserve canonical filenames;
7. preserve Git history;
8. update internal relative links affected by approved moves;
9. update the canonical documents index;
10. create a movement receipt for every file;
11. run reference and repository validation;
12. stop if any ambiguity or collision is found.

## Mandatory Holds
The following actions are prohibited:

- no runtime mutation;
- no application-code changes;
- no Azure action;
- no deployment;
- no database action;
- no package installation;
- no secret access;
- no external publication;
- no file deletion;
- no overwrite;
- no forced Git operation;
- no branch switch;
- no merge;
- no rebase;
- no commit;
- no push;
- no pull request;
- no movement of unresolved files.

## Stop Conditions
Stop and report support needed if:

1. more than one document claims canonical authority;
2. MOB or GBP inheritance is ambiguous;
3. a move would break unresolved references;
4. a destination file already exists;
5. a file is modified but uncommitted;
6. a nested Git repository is encountered;
7. a file belongs to another repository;
8. an external-use classification cannot be verified;
9. a document contains secrets or credentials;
10. the correct lifecycle state cannot be determined;
11. the current branch differs materially from `main`;
12. an existing governance hold prohibits the operation.

## Acceptance Criteria
Phase 1 is complete only when:

- all `docs/` files are inventoried;
- all candidate governance records are classified;
- the MOB is identified;
- GBP authority and inheritance are identified;
- Executive Desk materials are mapped;
- cadence records are mapped;
- release records are mapped;
- duplicate and conflict risks are documented;
- all proposed moves include rationale;
- all unresolved items appear in the support register;
- no existing files were moved or edited;
- no commit or push occurred.
Phase 2 is complete only when:

- every approved movement used `git mv`;
- no file was overwritten or deleted;
- references were updated and validated;
- canonical indexes reflect the final structure;
- the working tree contains only approved documentation changes;
- validation evidence and movement receipts were created;
- commit and push remain separately held.

## Executive Philosophy
The repository must reflect the same institutional standard as the company:

- listen before recommending;
- evidence before interpretation;
- preserve human authority;
- relationships rather than transactions;
- stewardship rather than control;
- leave every person, organization, and mission better than we found it.

## Required Final Response
Return:

1. executive summary;
2. current repository truth;
3. classification totals;
4. proposed movement totals;
5. duplicates and conflicts;
6. reference risks;
7. support needed;
8. owner decisions required;
9. exact paths to generated evidence;
10. confirmation that no files were moved;
11. confirmation that no commit or push occurred.
