# Sentinel AI Forethought — docked SynapseEco research build

Prepared November 11, 2026 (Phoenix). Built from PR #73 head `51490c22c9091f95d92da312e73c9cf246e17578` on the isolated `research/synapseeco-docked-advisory` branch. This continuation does not alter PR #73, main, deployed services, subscriptions or governance dispositions. Independent acceptance remains outstanding.

## The outcome we are building

An authorized operator asks a scoped question. Discovery Lens selects versioned evidence, C4 checks access and current authority, Forethought runs a bounded domain evaluator, and Executive Desk receives a cited packet with gaps, conflicts and one next step. Human review remains required. Docking provides an explicit compatibility and permission contract; it does not make every connected system trusted.

Cody's requirements define the product: finish the useful job, preserve human authority, measure the complete job, make resource/green claims only from evidence, and keep the first facility experiment to one flexible load and one objective. Sentinel's implemented logic supplies the lifecycle/authority boundaries, exact evidence identity, immutable packets, fail-closed outcomes and reproducible tests. No claim of autonomous or conscious AI is implied.

## Working, with evidence boundaries

| Component | What works | Practical limit |
|---|---|---|
| Discovery Lens / C4 | Real Stage 3 retrieval and invariant adapter feed the advisory job; current-authority and hold checks; review packet assembly. | Identity, policy and store adapters remain synthetic in this experiment. |
| Intake authority | Fixed May truth assignments removed; expired, superseded or untrusted artifacts cannot become current authority. | Registry digest binding is not independent signature verification. |
| Shared-source bridge | Distinct record IDs may share an identical source/version/content. Sources are read once for C4; Lens record identity and hold channel are retained. | Conflicting versions/content are rejected. This continuation does not silently loosen version policy. |
| SynapseEco evaluator | Deterministic 1R-1C simulation, symmetric baseline/proposal, finite arithmetic, 24 dense hourly intervals, explicit units/facility, full-precision schedules, cost ceiling and terminal tolerance. | A heuristic, uncommissioned model; no proof of globally optimal or real facility outcomes. |
| Research docking profile | Unsupported protocol versions, unknown capabilities, writes, expired/revoked grants, wrong code and wrong facility/tenant are denied. | The legacy universal-docking scaffold remains unchanged and must not be used as equivalent enforcement. |
| Docked end-to-end job | Actual Lens/C4 calls, pinned evidence JSON, local grant admission, evaluation and pre-release rechecks; citations and pending signoff. | No API endpoint, provider integration, actuator connection or operator approval UI is activated. |
| Resource telemetry | Process CPU time, wall time and sampled RSS are separate measures. | They are not hardware joules, allocated vCPU time or carbon. |

## Build interfaces

- `apps/sentinel/src/integrations/docking/advisoryPolicy.js`: restrictive, reusable advisory-only grant profile. Explicit independent grant is required; requested trust tiers cannot authorize it. The capability registry admits READ_TELEMETRY, READ_STATUS and RUN_ADVISORY_EVALUATION only.
- `apps/sentinel/src/forethought/evaluators/synapseEcoEvaluator.js`: four states: MODELED_IMPROVEMENT, NO_IMPROVEMENT_FOUND, INFEASIBLE and INSUFFICIENT_EVIDENCE. JSON-data contract only. No universal zero-crash guarantee is asserted for arbitrary JavaScript objects, proxies, engine failure or resource exhaustion.
- `apps/sentinel/src/forethought/evaluators/synapseEcoJob.js`: docking grant -> Lens/C4 -> exact current-authority artifact -> domain evaluation -> Lens/C4/grant/source recheck -> immutable human-review packet. Failures discard domain results.
- `tests/forethoughtAdvisory/synapseEcoFixtures.js`: the synthetic identity, grant, evidence and forecast adapters; they are not production authentication.

The authorized artifact is `{config, payload}` JSON. It must be selected by Lens, current in C4, and bound to the requested facility. Payload units are explicitly degC, kW_electric, gCO2/kWh and USD/kWh. The simulation is 24 hourly intervals starting exactly at the trusted evaluation clock. Latest telemetry is assumed unchanged until start; this assumption is disclosed and must be assessed against facility evidence. R/C, constant COP, operating limits, weather/internal gains and carbon forecasts remain provisional.

The machine schedule retains full precision so its energy sum reconciles with comparative totals. Human-facing conclusion text is rounded. Terminal agreement means within 0.15 C of the modeled baseline final state, not exact measured physical equality. The model checks its step trajectory under its declared assumptions; it is not a commissioned comfort/safety controller.

`sentinelBoundary` inside the evaluator is explicitly an advisory declaration. The surrounding profile produces an `UNSIGNED_LOCAL_DECISION` binding manifest, code hash, identity, facility and grant expiry, with execution false. Its SHA-256 is an integrity identifier, not a signature, trusted timestamp, Vault audit chain, or deployment/physical-isolation attestation. A production SentinelOS-issued receipt is not implemented here.

## What the tests show

- Repository Mocha suite: **144 passing, 3 pending**. The suite includes 19 evaluator/docking/end-to-end tests.
- The C4/bridge Node runner: **31 passing**. Its Mocha wrapper is counted once in the repository suite. Do not add 31 to 144 as separate repository passes.
- Original Stage 3 still reports 42 probes. Deployment-contract gate and Executive Desk TypeScript checks pass locally.
- Runtime: Node v24.22.1, pnpm 10.33.4, Linux x64. Hosted Node 20 CI is a separate check on the published candidate head.
- 100 synthetic profiles x five repetitions: **500 measured calls**: 300 MODELED_IMPROVEMENT, 50 NO_IMPROVEMENT_FOUND, 50 INFEASIBLE, 50 INSUFFICIENT_EVIDENCE, 50 BLOCKED. Semantic results repeat after excluding process measurements and presentation timestamps; all returned numbers are finite in these observations.
- The local completed-packet timings, raw samples, source identities and exact outputs are retained under `docs/executive-desk/evidence/synapseeco-docked-research-2026-11-11/`. These are correlated in-memory fixtures, not a production SLO, model quality study or speedup claim.

The illustrative fixture reproduces approximately 6,723.2 g modeled avoided emissions, $3.25 modeled savings, 0.485 kWh extra energy, and both modeled final temperatures 21.5 C. More energy can coexist with lower modeled emissions/cost under this input series. This result is not verified physical savings, a carbon offset or standards compliance.

## Not working or not yet established

1. No live identity provider, trusted policy/authority registry, transactional versioned store, signed enforcement receipts or deployed bridge is established by this build.
2. No real facility, commissioned R/C/COP, authorized comfort policy, meter stream, geography-matched carbon feed, tariff feed or realized savings is validated.
3. No human-scored model quality study or independent acceptance. Three pending repository tests remain pending.
4. No working Light speed benefit. The earlier two-worker path was slower for its tested JS transform; it remains excluded. This build uses normal serial evaluation.
5. No hardware compute-energy or carbon measurement; no green initiative/standard has been selected and satisfied. Resource efficiency and emissions scenarios must remain separate from certification.
6. RFID/5G recall/radio experiments are separate transport research. This build does not establish real-device reads, worldwide delivery performance or end-to-end transport energy savings.
7. The legacy docking manifest evaluator still tolerates unknown capabilities/protocols. Only the new restrictive profile has the tested denials above; a universal migration requires explicit compatibility review.
8. No physical-control writes, automatic orchestration, tenant access grants, billing changes, funding claims or governance clearance.

## Completion path and measurable acceptance

1. Independently review this exact continuation and shared-source fix, reconcile findings, and verify exact-head hosted CI. Preserve the original archive and distinguish its source integrity from final provenance acceptance.
2. Bind actual identity, grants, policy/versioned evidence and enforcement receipts through approved interfaces. Test expiration, revocation, changed sources/holds, audit failure and concurrent snapshot changes. Retain exact source/configuration identity.
3. Name one facility, one flexible load and one primary objective. Validate meter units/timestamps, model calibration, operating limits, tariff and carbon method/geography. Commissioned settings come from the accountable facility owner, not generic defaults.
4. Run read-only shadow assessment with a declared baseline and forecast-error metrics. Fourteen days is a proposed observation period, not automatic proof of realized counterfactual savings. Record disagreement, feasibility, comfort trajectories and uncertainty.
5. Profile the complete realistic job. Only then introduce Light as an opt-in mechanism against the measured bottleneck: at least 20% median improvement, no p95/p99 regression, invariant/quality parity, and a declared resource budget. Domain shadow validation need not wait for Light.
6. Evaluate green outcomes only within a declared measurement boundary. Use actual energy/carbon evidence and the selected initiative's requirements before making compliance or exceeded-standard claims. CPU time and RSS cannot substitute for energy.

GOV-001 Conditional; GOV-002 HOLD; GOV-006 verification outstanding. Test evidence supports review, not gate closure.

## Reproduce

```
pnpm install --frozen-lockfile
pnpm test
pnpm run check:synapseeco-research
pnpm run benchmark:synapseeco-research
```

Use the declared pnpm 10.33.4. Benchmark output is synthetic and local. The generated sample review packet demonstrates the operator artifact; no browser/UI or deployment is required.
