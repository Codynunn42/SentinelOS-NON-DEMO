# nunncorp-global-mono Residual Duplicate Diagnostic - 2026-05-17

Status: `[KEEP:RESIDUAL-DUPLICATE-DIAGNOSTIC-COMPLETED]`

## Purpose

Document the remaining suffix-numbered Git-internal artifact left after the approved A3.4 quarantine pass, define the A3.5/A3.4R approval boundary, and record completion of the approved move-only quarantine.

This diagnostic does not authorize deletion, reset, history rewrite, runtime mutation, deployment mutation, or additional cleanup.

## Residual Artifact

```txt
/Users/codynunn/Documents/GitHub/nunncorp-global-mono/.git/logs/refs/remotes/origin/HEAD 2
```

## Why It Remained

A3.4 approved quarantine only for the explicit top-level duplicate Git-internal candidates identified by the cleanup boundary report.

The remaining artifact is nested under:

```txt
.git/logs/refs/remotes/origin/
```

It was outside the approved candidate list and therefore remained held rather than moved.

## Classification

| Field | Classification |
| --- | --- |
| Artifact type | remote-tracking reflog duplicate |
| Canonical active ref | no |
| Object database | no |
| Branch tip | no |
| Runtime dependency | no evidence |
| Cleanup status | completed by approved move-only quarantine |
| Recommended posture | preserve quarantine; no deletion |

## Evidence Summary

Canonical reflog:

```txt
.git/logs/refs/remotes/origin/HEAD
size: 303 bytes
line count: 2
sha1: 2e7663819c93db38bd81bb4a6838bbe28988c5e1
mtime: 2026-04-20 01:55
content pattern: initial fetch and remote set-head entries
```

Residual duplicate:

```txt
.git/logs/refs/remotes/origin/HEAD 2
size: 1200 bytes
line count: 8
sha1: cd74ba58b2f12ffb621fa1f8c6a04961a2678d1e
mtime: 2026-04-21 16:15
xattr: com.apple.provenance
content pattern: repeated fetch prune entries with zeroed ref values
```

## Sentinel AI Diagnostic

The residual is most consistent with a macOS/Finder/iCloud/tooling duplicate artifact or prior copy/sync event that created a suffix-numbered reflog file.

The artifact is not the canonical `origin/HEAD` reflog and is not an active Git ref. Its content shows remote fetch/prune reflog activity rather than branch or object-store authority.

The artifact still matters because it is a suffix-numbered Git-internal file under `.git`. Broad repo-health scans will continue to classify it as residual Git-internal drift until it is explicitly quarantined or preserved by decision.

## Risk Assessment

| Risk | Level | Notes |
| --- | --- | --- |
| Active ref corruption | low | artifact is not the canonical remote HEAD reflog |
| Git responsiveness impact | low to medium | broad scans may still inspect suffix-numbered Git internals |
| Audit confusion | medium | residual duplicate can make cleanup status look incomplete |
| Cleanup risk | low if quarantined only | deletion remains blocked |

## Approved A3.5/A3.4R Action

```txt
A3.5 / A3.4R - residual nested duplicate quarantine-only cleanup
```

Approved action was limited to moving:

```txt
.git/logs/refs/remotes/origin/HEAD 2
```

into the existing quarantine area:

```txt
.git/cleanup-quarantine-20260517/
```

No deletion is recommended.

## Completion Evidence

Completed move target:

```txt
/Users/codynunn/Documents/GitHub/nunncorp-global-mono/.git/cleanup-quarantine-20260517/logs/refs/remotes/origin/HEAD 2
```

Post-move active suffix scan:

```txt
find .git -path .git/cleanup-quarantine-20260517 -prune -o \( -name '* 2' -o -name '* 3' -o -name '* 4' \) -print
```

Result:

```txt
no non-quarantined suffix-numbered Git-internal artifacts reported
```

Branch verification:

```txt
git branch --show-current
main
```

Commit verification:

```txt
git log -1 --oneline
c3564cce Polish Nexus landing status signal
```

Status verification note:

```txt
git status --short continued to hang after the residual quarantine and was stopped as a bounded diagnostic.
```

This indicates the residual duplicate cleanup removed the known suffix-numbered audit/scan residue, but it did not by itself resolve all responsiveness issues in the degraded checkout.

## Required Post-Approval Verification

If additional cleanup is proposed later, verify:

```bash
find .git -path .git/cleanup-quarantine-20260517 -prune -o \( -name '* 2' -o -name '* 3' -o -name '* 4' \) -print
git status --short
git log -1 --oneline
git fsck --no-progress
```

Expected outcome:

```txt
No non-quarantined suffix-numbered Git-internal artifacts remain.
Branch and commit lineage remain readable.
Any continued status or fsck hang is classified separately from suffix-duplicate cleanup.
```

## Non-Authorization Clause

This diagnostic records the approved residual move-only quarantine. It does not authorize deletion, reset, history rewrite, further cleanup, runtime mutation, deployment mutation, or public claims.
