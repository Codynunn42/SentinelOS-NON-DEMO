# Runtime Evidence Remediation — 2026-09-15

## Scope

This change set addresses the unresolved runtime findings following PRs #20, #24, and #25. It does not authorize production deployment or customer-data processing.

## Controls introduced

- Node 20 uses a compatible, pinned pnpm 10 toolchain.
- The API listens on unprivileged port 3000 while running as the non-root `node` user.
- Mutable runtime evidence is directed to `SENTINEL_DATA_DIR` rather than root-owned application source paths.
- Container repository scans identify themselves as partial runtime-image inventories when build exclusions apply.
- CI and Azure deployment validation require frozen dependency installation, tests, type checks, end-to-end checks, runtime-storage checks, and a container image build.

## Local verification

- Frozen installation with pnpm 10.33.4: pass, including the esbuild postinstall.
- Automated test suite: 83 passing, 3 pending.
- TypeScript validation: pass.
- Executive Desk end-to-end check: pass.
- Runtime storage check: pass.
- Repo-read, policy, receipt, tenant-isolation, drift, XE, execution-integrity, performance, and recovery checks: pass.

## Remaining gate

GitHub Actions must complete successfully on the pull request before merge. Production readiness and Kuber data use remain held until container execution and any required live-environment evidence are reviewed.
