# SENTINEL AI — MANAGED REPOSITORY SCHEDULE
**Date:** 2026-08-03
**Owner:** Cody Nunn / Sentinel Executive Desk

## Managed Repositories
| Repo | Tier | Scan Frequency | Owner |
|------|------|---------------|-------|
| SentinelOS-NON-DEMO | P0 — Critical | Every 6h | Cody |
| [repo-2] | P1 — High | Daily 09:00 | TBD |
| [repo-3] | P2 — Standard | Daily 13:30 | TBD |

## Daily Schedule
| Time | Task | Trigger |
|------|------|---------|
| 08:30 | Branch health + posture | Manual / cron |
| 10:30 | Governance pass | Automated |
| 13:30 | PR/risk triage | Automated |
| 15:00 | Evidence reconciliation | Automated |
| 17:30 | Executive closeout | Manual |

## Activation Checklist
- [ ] Repos listed and tiered
- [ ] Cron jobs or CI hooks configured
- [ ] Sentinel AI API key / endpoint confirmed
- [ ] First scan output filed under evidence/
