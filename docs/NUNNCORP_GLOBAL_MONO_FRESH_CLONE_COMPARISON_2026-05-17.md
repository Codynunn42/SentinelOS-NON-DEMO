# nunncorp-global-mono Fresh Clone Comparison - 2026-05-17

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:FRESH-CLONE-COMPARISON]
```

## Approval Boundary

Approved items:

```txt
A3.1 - Create a fresh comparison clone in a separate directory.
A3.2 - Compare `.git` internals and refs between degraded repo and fresh clone.
```

This report is read-only comparison evidence. It does not authorize deletion, cleanup, reset, history rewrite, branch rewrite, remote push, or mutation inside the degraded repo.

## Compared Repositories

| Role | Path |
| --- | --- |
| Degraded checkout | `/Users/codynunn/Documents/GitHub/nunncorp-global-mono` |
| Fresh comparison clone | `/private/tmp/nunncorp-global-mono-compare-20260517` |

Remote:

```txt
https://github.com/Codynunn42/nunncorp-global-mono.git
```

## Fresh Clone Result

The fresh comparison clone completed successfully.

| Check | Result |
| --- | --- |
| Branch | `main` |
| Latest commit | `cdc53d1 Sentinel deploy sync (#226)` |
| `git status --short` | clean |
| `git fsck --no-progress` | passed with no output |
| duplicate `.git` internals scan | none found |
| heads/tags ref count | `22` |

## Degraded Checkout Findings

The degraded checkout still resolves as a Git worktree:

| Check | Result |
| --- | --- |
| Worktree path | `/Users/codynunn/Documents/GitHub/nunncorp-global-mono` |
| Branch | `main` |
| HEAD ref | `refs/heads/main` |
| Local `main` ref | `c3564cceea29f8083f4b6bfd8379f00d9f8ee5fc` |
| Latest commit observed | `c3564cce Polish Nexus landing status signal` |
| heads/tags ref count | `20` |

Read responsiveness:

```txt
git log -1 --oneline: eventually returned after delay
git status --short: hung longer than 30 seconds and was stopped
```

## Duplicate Git Internals Observed

Filesystem scan found duplicate Git-internal artifacts in the degraded checkout:

```txt
.git/gk 2
.git/refs 2
.git/info 2
.git/description 2
.git/FETCH_HEAD 2
.git/objects 2
.git/ORIG_HEAD 2
.git/logs 2
.git/config 2
.git/hooks 2
.git/index 2
.git/index 3
.git/index 4
.git/HEAD 2
```

The fresh clone did not contain matching duplicate `* 2`, `* 3`, `* 4`, or `.lock` artifacts at the same scan depth.

## Comparison Interpretation

The fresh clone is clean and responsive. The degraded checkout contains duplicate Git-internal artifacts and has degraded read responsiveness.

Important distinction:

```txt
comparison confirms degradation indicators;
comparison does not prove which duplicate artifacts are safe to remove
```

## Cleanup Boundary

A3.4 remains blocked.

Before any cleanup approval, a separate cleanup boundary report should identify:

- exact duplicate artifact path
- whether an active Git command references it
- whether the canonical non-suffixed counterpart exists
- whether the fresh clone contains an equivalent
- whether a backup/snapshot exists
- proposed action: preserve, quarantine, or remove
- rollback method

No cleanup should occur from this comparison report alone.

## Recommended Next Approval

```txt
Approve A3.3 only:
Produce cleanup boundary report for duplicate Git-internal artifacts.
```

A3.4 destructive cleanup should remain blocked until A3.3 is reviewed and explicitly approved.

## Non-Authorization Clause

This report documents fresh-clone comparison evidence. It does not authorize destructive cleanup, deletion, reset, history rewrite, branch rewrite, push, or mutation of `nunncorp-global-mono`.
