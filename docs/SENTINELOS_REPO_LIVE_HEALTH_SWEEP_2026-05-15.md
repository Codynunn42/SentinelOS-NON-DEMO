# SentinelOS Repository and Live Health Sweep - 2026-05-15

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Scope

Health sweep covered:

* `SentinelOS-NON-DEMO`
* `nunncorp-global-mono`
* `nunncorporation.com`
* live Sentinel backend referenced by `nunncorporation.com`

## Executive Result

```txt
Live Sentinel backend: healthy
nunncorporation.com /api/status: healthy
SentinelOS NON DEMO governance checks: healthy
nunncorp-global-mono repo hygiene: degraded
nunncorp-global-mono Nexus UI local build: blocked / hung
Public route parity: drift detected
```

## Confirmed Healthy

### SentinelOS NON DEMO

Passed:

```txt
pnpm run check:execution-integrity
pnpm run check:policy
pnpm run check:faceplane-fork-continuity
pnpm run check:approval-bottleneck
pnpm run check:ready
```

Notes:

* `check:ready` only passed when allowed to bind `127.0.0.1` outside the sandbox.
* `healthcheck` failed because no local server was running at `http://localhost:3000/health`.
* Governance execution integrity is intact.
* Approval bottleneck analysis is intact.
* Faceplane fork continuity remains repeatable.

### Live Sentinel Backend

Endpoint checked:

```txt
https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/health
```

Returned:

```json
{
  "status": "ok",
  "service": "sentinel-api",
  "mode": "non-demo",
  "tier": "PUBLIC",
  "database": "enabled"
}
```

### nunncorporation.com Backend Status

Endpoint checked:

```txt
https://nunncorporation.com/api/status
```

Returned:

```json
{
  "status": "connected",
  "backend": {
    "status": "ok",
    "service": "sentinel-api",
    "mode": "non-demo",
    "database": "enabled"
  }
}
```

## Health Issues Found

### 1. nunncorp-global-mono Git Health Is Degraded

Observed:

* `git status --short`
* `git status --short --untracked-files=no`
* `git branch --show-current`
* `git log -1 --oneline`

These commands hung and required termination.

Repo metadata also shows stale/duplicate Git internals:

```txt
.git/HEAD 2
.git/config 2
.git/index 2
.git/index 3
.git/index 4
.git/index 4.lock
.git/packed-refs.lock
.git/objects 2
.git/refs 2
```

Classification:

```txt
category: repository_integrity
severity: high
approval: human approval required before cleanup
```

Recommended XE step:

```txt
Quarantine and inspect stale Git duplicate files and lock files before deleting anything.
Do not run destructive Git cleanup until a clean backup or fresh clone is available.
```

### 2. Nexus UI Build Verification Hangs

Command:

```txt
pnpm --filter @nunncorp/nexus-ui build
```

Result:

```txt
Hung for more than two minutes at next build.
Terminated to close the health sweep cleanly.
```

Classification:

```txt
category: deployment_verification
severity: high
approval: approved to investigate
```

Recommended XE step:

```txt
Run a focused Next build investigation for apps/nexus-ui.
Check route compilation, Next cache, package/runtime mismatch, and any build-time network dependency.
```

### 3. Nexus UI Lint Verification Also Hung

Command:

```txt
pnpm --filter @nunncorp/nexus-ui lint
```

Result:

```txt
Hung after starting next lint.
Terminated with the build process.
```

Classification:

```txt
category: deployment_verification
severity: elevated
approval: approved to investigate
```

Recommended XE step:

```txt
Investigate Next lint startup and dependency/runtime state after the build hang is isolated.
```

### 4. Public Route Parity Drift

Source contains:

```txt
apps/nexus-ui/src/app/api/alchemy/status/route.ts
```

Live route checked:

```txt
https://nunncorporation.com/api/alchemy/status
```

Live result:

```txt
404
```

Classification:

```txt
category: deployment_drift
severity: medium
approval: approval required before redeploy
```

Recommended XE step:

```txt
Confirm whether the Alchemy status route should be public.
If yes, fix build/deploy parity and redeploy Nexus UI.
If no, remove or document the stale source route.
```

### 5. nunncorporation.com Public Copy/State Drift

Live HTML is serving the OwnerFI pilot surface.

Observed:

* static HTML starts with `SYSTEM STATUS: LOADING`
* backend connection resolves through `/api/status`
* repo footer says `SentinelOS Non-Demo Repository`
* non-demo footer URL points to `https://github.com/Codynunn42/SentinelOS`

Classification:

```txt
category: public_surface_confidence
severity: medium
approval: approved to review
```

Recommended XE step:

```txt
Confirm whether public surface should remain OwnerFI-focused or shift back to SentinelOS command positioning.
Fix repo labels/links if they do not match actual repo boundaries.
```

### 6. SentinelOS NON DEMO Worktree Is Large And Uncommitted

Observed:

* many modified files
* many untracked hardening artifacts
* new scripts, docs, commands, and runtime mock results

Classification:

```txt
category: release_discipline
severity: elevated
approval: human review before commit/push
```

Recommended XE step:

```txt
Split current worktree into reviewable commits:
1. execution integrity
2. telemetry/workflow retry
3. faceplane continuity
4. human steering and approval bottleneck
5. issue classification and health reports
```

## Security Sweep

Basic secret-pattern scan:

* No obvious committed private keys found in `SentinelOS-NON-DEMO`.
* No obvious committed private keys found in `nunncorp-global-mono`.
* Matches were documentation placeholders or scripts referencing runtime-provided tokens.

Security notes:

* `nunncorp-global-mono` has workflow logic that exports `DOCKING_GH_TOKEN` to `GITHUB_ENV`; verify masking and scope before production use.
* `SentinelOS-NON-DEMO` docs include API-key examples; keep them as placeholders only.

## Approval Queue

1. **Approve repo-integrity investigation for `nunncorp-global-mono`**
   * Do not delete `.git` duplicate/lock files until inspected.
   * Best option may be fresh clone comparison before cleanup.

2. **Approve Nexus UI build/lint investigation**
   * This blocks confidence in future `nunncorporation.com` deploys.

3. **Approve public route parity decision**
   * Decide whether `/api/alchemy/status` should exist live.

4. **Approve public surface copy/link review**
   * Confirm OwnerFI-first positioning and repo footer accuracy.

5. **Approve SentinelOS NON DEMO commit packaging**
   * Current hardening work should be grouped before more changes accumulate.

## Sentinel Verdict

The live backend is healthy. The problem is not core Sentinel availability.

The higher-risk issues are:

```txt
nunncorp-global-mono repository integrity
Nexus UI build/lint verification hang
public route parity drift
large uncommitted SentinelOS NON DEMO hardening set
```

These issues can absolutely affect things from taking shape because they weaken the deployment feedback loop. The next controlled outcome should be repository/deployment stabilization before adding more surface area.

## Phase A Repair Addendum

### Backup Attempt

A full archive backup was attempted:

```txt
/private/tmp/nunncorp-global-mono-pre-repair-2026-05-15.tar.gz
```

Result:

```txt
Full tar backup stalled and was terminated.
Filtered rsync backup also stalled and was terminated.
```

This reinforced the original finding that repo/filesystem traversal is degraded.

### Surgical Backup Completed

Created:

```txt
/private/tmp/nunncorp-global-mono-git-pre-repair-2026-05-15
```

Backed up:

* `HEAD`
* `packed-refs.lock`
* `index 4.lock`
* `refs/remotes/origin/HEAD 2.lock`
* `refs/remotes/origin/main.lock`
* `refs/remotes/origin/HEAD 2`

### Confirmed Stale Locks Removed

Removed only confirmed zero-byte stale locks:

```txt
.git/packed-refs.lock
.git/index 4.lock
.git/refs/remotes/origin/HEAD 2.lock
.git/refs/remotes/origin/main.lock
```

After removal:

```txt
find .git -name "*.lock"
```

returned no lock files.

### Invalid Ref Removed

`git fsck` exposed:

```txt
refs/remotes/origin/HEAD 2: badRefName: invalid refname format
```

The duplicate invalid ref was backed up and removed:

```txt
.git/refs/remotes/origin/HEAD 2
```

### Missing Remote Main Restored

`refs/remotes/origin/HEAD` pointed to:

```txt
ref: refs/remotes/origin/main
```

but `refs/remotes/origin/main` was missing.

Restored:

```txt
refs/remotes/origin/main = c3564cceea29f8083f4b6bfd8379f00d9f8ee5fc
```

This matches:

```txt
HEAD
refs/heads/main
```

### Improved State

These commands returned successfully after repair:

```txt
git branch --show-current
git log -1 --oneline
git ls-files | wc -l
git diff --cached --stat
git status --short --untracked-files=no
git fsck --no-progress --connectivity-only
```

Observed status output:

```txt
M .github/workflows/ci.yml
M apps/nexus-ui/.gitignore
M apps/nexus-ui/README.md
M apps/nexus-ui/src/app/globals.css
M apps/nexus-ui/src/app/sentinel-console.tsx
M infra/docker/sentinel/Dockerfile
```

`git fsck --no-progress --connectivity-only` completed with only dangling objects:

```txt
dangling commit fa99a23c5a3900d58f394c33a494439da39c0b9f
dangling tree c6fc971dc429ba4e6548d6f1fef8d8bf4b0a52bb
```

### Remaining Concern

Repeated concurrent `git status` and `git fsck` checks later became slow again and were stopped after exceeding the verification window.

Classification:

```txt
Phase A status: partially repaired
Git refs/locks: repaired
Basic branch/log: responsive
Worktree/integrity traversal: still performance-degraded under repeated or concurrent checks
Do not run git gc --prune=now yet
```

Reason to hold `git gc --prune=now`:

```txt
Full backup failed, and dangling objects may still be useful recovery evidence.
```

## Next XE Step

Proceed to Phase B only after acknowledging Phase A is improved but not perfect:

```txt
NEXT_TELEMETRY_DISABLED=1 pnpm --filter @nunncorp/nexus-ui build --debug
```

Run build isolation one command at a time. Do not run concurrent Git integrity scans while isolating the Nexus UI build hang.
