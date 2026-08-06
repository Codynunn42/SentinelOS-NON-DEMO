# nunncorp-global-mono Cleanup Boundary Report - 2026-05-17

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:CLEANUP-BOUNDARY-REPORT]
```

## Approval Boundary

Approved item:

```txt
A3.3 - Produce cleanup boundary report.
```

This report defines cleanup candidates and boundaries only. It does not authorize deletion, quarantine, reset, history rewrite, branch rewrite, remote push, or mutation inside `nunncorp-global-mono`.

## Source Evidence

This report follows:

- `docs/NUNNCORP_GLOBAL_MONO_FRESH_CLONE_COMPARISON_2026-05-17.md`

Compared paths:

| Role | Path |
| --- | --- |
| Degraded checkout | `/Users/codynunn/Documents/GitHub/nunncorp-global-mono` |
| Fresh comparison clone | `/private/tmp/nunncorp-global-mono-compare-20260517` |

## Boundary Summary

The degraded checkout contains suffix-numbered duplicate Git-internal artifacts that are absent from the fresh clone.

The strongest cleanup boundary is:

```txt
only suffix-numbered duplicate Git-internal artifacts are cleanup candidates
canonical non-suffixed Git internals must be preserved
destructive cleanup remains blocked until A3.4 is explicitly approved
```

## Candidate Classification

| Candidate | Type | Evidence | Boundary Recommendation |
| --- | --- | --- | --- |
| `.git/FETCH_HEAD 2` | duplicate file | suffix-numbered, absent from fresh clone | quarantine candidate |
| `.git/HEAD 2` | duplicate file | matches canonical `.git/HEAD` | quarantine candidate |
| `.git/ORIG_HEAD 2` | duplicate file | contains older commit ref | preserve in backup before quarantine |
| `.git/config 2` | duplicate file | differs from canonical `.git/config` | preserve in backup before quarantine |
| `.git/description 2` | duplicate file | matches canonical `.git/description` | quarantine candidate |
| `.git/gk 2` | duplicate directory | empty duplicate directory | quarantine candidate |
| `.git/hooks 2` | duplicate directory | empty duplicate directory | quarantine candidate |
| `.git/index 2` | duplicate index file | older duplicate index-sized file | preserve in backup before quarantine |
| `.git/index 3` | duplicate index file | older duplicate index-sized file | preserve in backup before quarantine |
| `.git/index 4` | duplicate index file | older duplicate index-sized file | preserve in backup before quarantine |
| `.git/info 2` | duplicate directory | empty duplicate directory | quarantine candidate |
| `.git/logs 2` | duplicate directory | empty duplicate directory | quarantine candidate |
| `.git/objects 2` | duplicate directory | empty duplicate directory | quarantine candidate |
| `.git/refs 2` | duplicate directory | empty duplicate directory | quarantine candidate |

No `.lock` files were observed during this boundary pass.

## Preserve Boundary

The following must not be altered by cleanup:

- `.git/HEAD`
- `.git/config`
- `.git/index`
- `.git/objects`
- `.git/refs`
- `.git/logs`
- `.git/hooks`
- `.git/info`
- `.git/packed-refs` if present later
- working tree files outside `.git`
- branch refs
- remote refs
- commits
- tags
- stash records

## Proposed A3.4 Cleanup Shape

If A3.4 is later approved, the safest cleanup shape is quarantine, not immediate deletion.

Proposed quarantine directory:

```txt
/Users/codynunn/Documents/GitHub/nunncorp-global-mono/.git/cleanup-quarantine-20260517/
```

Proposed action:

```txt
move suffix-numbered duplicate artifacts into quarantine
do not remove canonical files
do not modify refs
do not reset worktree
do not rewrite history
```

Quarantine candidates:

```txt
.git/FETCH_HEAD 2
.git/HEAD 2
.git/ORIG_HEAD 2
.git/config 2
.git/description 2
.git/gk 2
.git/hooks 2
.git/index 2
.git/index 3
.git/index 4
.git/info 2
.git/logs 2
.git/objects 2
.git/refs 2
```

## Required Pre-Cleanup Checks

Before A3.4 cleanup:

1. Confirm no Git process is active in `nunncorp-global-mono`.
2. Create a backup or quarantine plan inside the degraded checkout.
3. Confirm the fresh comparison clone remains available.
4. Confirm canonical `.git/HEAD` points to `refs/heads/main`.
5. Confirm canonical `.git/refs/heads/main` remains readable.
6. Run a short timeout-bound status check if safe.
7. Preserve a list of every moved artifact.

## Required Post-Cleanup Checks

If A3.4 is approved and quarantine is performed, verify:

```bash
git -C /Users/codynunn/Documents/GitHub/nunncorp-global-mono status --short
git -C /Users/codynunn/Documents/GitHub/nunncorp-global-mono log -1 --oneline
git -C /Users/codynunn/Documents/GitHub/nunncorp-global-mono fsck --no-progress
find /Users/codynunn/Documents/GitHub/nunncorp-global-mono/.git -maxdepth 2 \( -name '* 2' -o -name '* 3' -o -name '* 4' -o -name '*.lock' \) -print
```

If any verification fails, restore quarantined artifacts before continuing.

## Rollback Boundary

Rollback should be possible by moving quarantined artifacts back to their original paths.

Rollback requires:

- original path list
- quarantine path list
- no canonical file overwrite
- no reset
- no branch rewrite
- no remote operation

## Blocked Actions

The following remain blocked:

- delete duplicate artifacts
- move duplicate artifacts
- edit canonical Git internals
- run `git reset`
- run `git checkout --`
- rewrite refs
- rewrite history
- push
- clean working tree files
- remove duplicate Git internals without quarantine

## Recommended Next Approval

```txt
Approve A3.4 quarantine-only cleanup of suffix-numbered duplicate Git-internal artifacts.
```

Recommended A3.4 scope:

```txt
quarantine suffix-numbered duplicate artifacts only
no canonical Git internals
no working tree files
no reset
no deletion
no push
```

## Non-Authorization Clause

This report defines cleanup boundaries. It does not authorize cleanup, deletion, quarantine, reset, history rewrite, branch rewrite, remote push, or mutation inside `nunncorp-global-mono`.
