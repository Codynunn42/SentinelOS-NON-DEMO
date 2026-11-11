# Forethought Discovery Lens + C4 integration candidate

Prepared November 11, 2026. Draft PR #73 is expanded at the user's explicit request to integrate the preserved C4 Advisory Job candidate with the revised Stage 3 Discovery Lens. This supersedes the earlier *relationship decision pending* posture for research-source integration only. It does not authorize merge, deployment, live adapters, spending, independent acceptance, or governance transitions.

## Source and provenance

- Integration parent: `9d95b5b2028c72849b8f3deb12e81332f13481d6` on `review/forethought-stage3-revised-2026-11-11`.
- The original Stage 3 core/adapter are retained unchanged by this expansion.
- Original C4 archive remains unchanged in `../forethought-stage3-2026-11-10/Sentinel_Forethought_Advisory_C4_Candidate_v0_2.zip`.
- Original C4 SHA-256: `ce82c5961f3a0790f3ce786bfa5a12e66c22d0628b0c72c1357ef83f97dfc45b`. The local supplied archive and PR-preserved archive match exactly. Earlier package/base/blob/patch verification is preserved in the original reconciliation.
- This combined source is a NEW candidate, not the original C4 v0.2 package and not the prior standalone Stage 3 candidate. Earlier benchmark and hosted-CI results do not validate this expansion.
- User authorization to integrate does not independently authenticate external archive provenance. Independent review and the final provenance disposition remain outstanding.
- `source-sha256.txt` identifies the tested code, fixtures, wrapper, benchmark, package and lockfile. `SHA256SUMS` identifies this evidence packet. The PR head commit plus those hashes is the review identity.

## Integration and contracts

The executable entry point is `apps/sentinel/src/forethought/discoveryLens/advisoryBridge.js:runDiscoveryAdvisoryJob(request, deps)`. It calls the actual Stage 3 `prepareEvidence` and invariant-checking `interpretEvidence`, rather than treating C4's keyword lookup as Discovery Lens.

| Integration point | Contract and current status |
|---|---|
| `authenticate(caller)` | Trusted synchronous adapter: verified subject/tenant/clearance plus explicit sensitivity, release, environment and trusted-scope grants. Fixture implementation only; no production identity provider selected. |
| `resolvePolicy(id)` | Trusted read entitlement/classification/holds, active version, artifact digest and authority binding. Fixture implementation only. No request-supplied authority grants. |
| `loadLensSnapshot()` | Trusted, complete versioned context/corpus snapshot. The roster and sensitivity grants must remain identical through release; changes block and require a new job. Production snapshot/store transaction semantics remain unimplemented. |
| `store` | Metadata inventory and exact-version content fetch. Content is fetched after C4 entitlement checks. Trusted Lens records must match content, source ID and version; no fabricated version fallback. Fixture implementation only. |
| `clock()` | Trusted UTC freshness clock. Caller timestamps do not establish authority. |

The bridge preserves the complete scoped metadata roster before lexical selection, so query-irrelevant release holds are not discarded. C4 gates access/holds/content identity before Lens receives source text. Stage 3 then selects evidence and validates its packet against the trusted snapshot; C4 synthesizes only selected artifacts. Before release, access/freshness/identity and the snapshot are rechecked and Lens selection is rerun. In the C4 stage telemetry, Sentinel and Desk include this Lens selection/validation work; their timings are not pure authorization or rendering cost.

`fixture_verified` is not evidence of current authority. Expired/untrusted support is downgraded. C4 conflicts or required gaps also downgrade a Lens prerequisite-support verdict. A blocking Lens review supplies the packet's next evidence request. Authorization/execution remain false; signoff remains pending human review.

The archive-intake refactor removes fixed May current-truth/current-approval tags and fixed confidence. Freshness is a remaining-validity heuristic, not probability, factual confidence or permission. Current authority requires a trusted registry binding. Digests are identity checks, not signature verification. Historical source references are preserved; legacy keyword matches now require human review. No runtime route is added for the bridge.

## Validation observed locally

- Clean clone pinned to the integration parent; no user worktree was edited.
- Declared pnpm `10.33.4`, frozen lockfile install. The initially installed pnpm 11 rejected the lockfile/override format; the declared version succeeded without lockfile changes.
- `pnpm test`: **125 passing, 3 pending**, exit 0. The added Mocha wrapper runs the isolated Node test suite; its one wrapper test is included in 125, not an additional 29 Mocha tests.
- Node C4/bridge runner: **29 passing, 0 failed** (19 carried-forward C4 cases and 10 new bridge cases).
- Stage 3: all **42 probes** remain programmatically verified through the repository suite.
- Updated archive docking regression passes. Deployment-contract gate and Executive Desk TypeScript checks pass.
- Environment: Node `v24.22.1`, Linux x64. Hosted CI uses Node 20; local evidence must not be described as exact hosted-runtime evidence.
- Test-generated `.data/closeout-state.json` changes are excluded from the integration commit.

## New benchmark

Run `node scripts/benchmark-forethought-advisory.js`. There are 100 synthetic cases, 10 repetitions and one excluded warmup pass, totaling **3,800 observations**. C3 explicitly skips 200 cases without prevalidated input. C1 is the unvalidated dump; C2 now invokes the actual Stage 3 Lens without C4 gates (synthetic negative control); C3 is prevalidated deterministic synthesis; C4 is the new combined path. C2's timing fields are excluded from semantic repeatability hashes, and its request ID is fixed per case.

C4: 1,000 calls, 800 review packets, 200 expected blocked receipts; semantic repeatability passes. Completed-packet p50/p95/p99 are recorded in `benchmark.json`; do not substitute the original package's 0.188/0.356 ms results. Arms do not provide equivalent capabilities, so latency differences are not acceleration evidence. Inputs, policy and semantic outcomes are fixture-based, not human-scored operational assessments. No live I/O/model, Light mode, energy, carbon or green-standard compliance is measured.

CPU time, RSS and heap are separate resource measures. Sampled boundary maxima are not true per-request peaks; process maxRSS is a lifetime high-water mark. The RSS MB-hour estimate includes shared runtime memory. CPU time plus memory-time cannot be summed into a physical energy quantity.

## Review remaining

Independent reviewer assignment and technical/provenance disposition; expanded-scope current-head hosted CI; missing real identity/policy/store adapters and signed provenance validation; operational verification and authorized acceptance. Microsoft agenda reconciliation remains separate and outstanding. GOV-001 Conditional; GOV-002 HOLD; GOV-006 verification outstanding. Nothing in this packet closes a gate.
