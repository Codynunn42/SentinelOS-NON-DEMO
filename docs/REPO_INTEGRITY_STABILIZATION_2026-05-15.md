# Repository Integrity Stabilization - 2026-05-15

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:REPO-INTEGRITY-STABILIZATION-REPORT]
```

## Command Envelope

```txt
ENV-2026-05-15-002-REPO-INTEGRITY
operation: repository.integrity.stabilize
status: executed_read_only
```

## Executive Result

Repository integrity stabilization was executed in read-only mode.

No destructive reset, forced history rewrite, lock deletion, duplicate-file deletion, or worktree cleanup was performed.

Current result:

| Repository | Continuity Status | Integrity Classification |
| --- | --- | --- |
| `SentinelOS-NON-DEMO` | responsive | active worktree, no shallow Git-internal duplicate/lock finding |
| `nunncorp-global-mono` | degraded | duplicate Git internals and hung read-only Git diagnostics |

## SentinelOS NON-DEMO Snapshot

Path:

```txt
/Users/codynunn/SentinelOS/SentinelOS-NON-DEMO/SentinelOS-NON-DEMO
```

Branch:

```txt
hardening/telemetry-signature-correlation
```

Latest commit:

```txt
4f19f43 Normalize archive intelligence component names
```

Git responsiveness:

| Check | Result |
| --- | --- |
| `git status --short` | completed |
| `git branch --show-current` | completed |
| `git log -1 --oneline` | completed |
| `find .git ... duplicate/lock scan` | completed, no output |
| `git fsck --no-progress` | completed |

`git fsck` reported dangling blobs and trees only. No fatal corruption was reported.

Worktree posture:

```txt
large active hardening worktree
many added docs, runtime artifacts, scripts, and command/governance files
```

Classification:

```txt
active_worktree_continuity
severity: elevated
decision: preserve; do not clean or reset
```

The active worktree appears intentional and tied to the May 15 hardening, operational upgrade, approval, telemetry, and command-envelope work. It should be checkpointed intentionally, not cleaned opportunistically.

## nunncorp-global-mono Snapshot

Path:

```txt
/Users/codynunn/Documents/GitHub/nunncorp-global-mono
```

Branch:

```txt
main
```

Latest commit:

```txt
c3564cce Polish Nexus landing status signal
```

Top-level path:

```txt
/Users/codynunn/Documents/GitHub/nunncorp-global-mono
```

Git directory size:

```txt
12K .git
```

Observed duplicate Git internals:

```txt
.git/HEAD 2
.git/config 2
.git/index 2
.git/index 3
.git/index 4
.git/refs 2
.git/objects 2
.git/logs 2
.git/hooks 2
.git/info 2
.git/gk 2
.git/FETCH_HEAD 2
.git/ORIG_HEAD 2
.git/description 2
```

Observed pack scratch files in active objects directory:

```txt
.git/objects/pack/tmp_pack_zycVhK
.git/objects/pack/tmp_pack_dR2Hz0
.git/objects/pack/tmp_pack_9ck2xg
.git/objects/pack/tmp_pack_aloIJE
```

Index files exist with different sizes:

```txt
.git/index    60523 bytes
.git/index 2  58363 bytes
.git/index 3  58635 bytes
.git/index 4  57898 bytes
```

`HEAD` and `HEAD 2` both point to:

```txt
ref: refs/heads/main
```

Git responsiveness:

| Check | Result |
| --- | --- |
| `git branch --show-current` | slow, eventually returned `main` |
| `git log -1 --oneline` | slow, returned latest commit |
| `git rev-parse --show-toplevel` | completed |
| `git status --short --untracked-files=no` | hung and was terminated |
| `git fsck --no-progress` | hung and was terminated |

Classification:

```txt
repository_integrity_degraded
severity: high
decision: no cleanup without backup/fresh-clone comparison
```

## Drift Classification

| Drift | Repository | Severity | Meaning |
| --- | --- | --- | --- |
| Active worktree continuity risk | SentinelOS NON-DEMO | elevated | Many changes are active; preserve and checkpoint intentionally |
| Duplicate Git-internal artifacts | nunncorp-global-mono | high | Files/directories with suffixes like ` 2`, ` 3`, ` 4` suggest filesystem conflict or duplicated metadata |
| Git responsiveness degradation | nunncorp-global-mono | high | `status` and `fsck` hung; this threatens routine release and audit workflow |
| Pack scratch residue | nunncorp-global-mono | medium | `tmp_pack_*` files exist under `.git/objects/pack`; inspect before removal |
| Branch/commit lineage reachable | nunncorp-global-mono | medium-positive | `main` and latest commit are still readable, so recovery should be possible without history rewrite |

## Recommended Remediation Boundaries

### Allowed Now

- Preserve all active worktrees.
- Create a fresh clone of `nunncorp-global-mono` into a separate path for comparison.
- Compare `.git` structure between the current repo and fresh clone.
- Generate a cleanup candidate list without deleting anything.
- Checkpoint SentinelOS NON-DEMO work intentionally before large repo cleanup.

### Requires Explicit Approval

- Deleting duplicate `.git/* 2`, `.git/* 3`, `.git/* 4` files or directories.
- Deleting `.git/objects/pack/tmp_pack_*` files.
- Replacing `.git/index` with any alternate index.
- Running `git gc`, `git repack`, or `git prune` inside the degraded monorepo.
- Any branch reset, forced checkout, or history rewrite.

### Not Recommended

- `git reset --hard`
- blind lock-file deletion
- cleanup before backup or fresh clone
- treating duplicate Git internals as harmless without comparison
- continuing deployment work from a degraded Git directory

## Recommended Next Step

Create a clean comparison clone of `nunncorp-global-mono` outside the current directory, then generate a candidate remediation plan:

```txt
fresh clone -> compare Git internals -> classify duplicate artifacts -> approve cleanup -> validate status/fsck -> preserve lineage
```

Until then, treat `nunncorp-global-mono` as operationally degraded but partially readable.

## Commands Run

SentinelOS NON-DEMO:

```bash
git status --short
git branch --show-current
git log -1 --oneline
find .git -maxdepth 2 -name '*.lock' -o -name '* 2' -o -name '* 3' -o -name '* 4'
git fsck --no-progress
```

nunncorp-global-mono:

```bash
find .git -maxdepth 2 -name '*.lock' -o -name '* 2' -o -name '* 3' -o -name '* 4'
find .git -maxdepth 1 -type f -print
find .git -maxdepth 1 -type d -print
git branch --show-current
git log -1 --oneline
git status --short --untracked-files=no
git fsck --no-progress
git rev-parse --show-toplevel
du -sh .git
wc -c .git/index '.git/index 2' '.git/index 3' '.git/index 4'
```

Hung diagnostic processes were terminated with `pkill -f git` to close the read-only stabilization pass. No repository files were modified.
