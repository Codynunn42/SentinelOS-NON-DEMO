# Nunn Cloud LLC — NVIDIA Bounded Validation Brief

**Version:** Draft v0.2  
**Prepared:** November 3, 2026  
**Discussion target:** NVIDIA Inception membership session, November 10, 2026  
**Systems:** Sentinel AI / SentinelOS / Nexus OS  
**Classification:** Internal technical proposal — review pending  
**Authority:** No deployment, spending, external data transfer, or governance change authorized

## 1. Executive summary

Nunn Cloud develops governed enterprise AI systems that preserve human decision authority, enforce policy boundaries, and maintain traceable evidence across AI-assisted workflows. NVIDIA Inception membership is confirmed. This proposal asks whether an NVIDIA-supported inference endpoint offers measurable quality, latency, throughput, or economic benefit for one bounded workflow without weakening governance.

**Requested collaboration:** Technical guidance on one supported NVIDIA model/serving candidate, minimum suitable evaluation infrastructure, measurable benchmark, program/partner options, and an accountable technical follow-up—not a hardware commitment.

## 2. Selected workflow

**Governed technical commercialization-brief review**, consistent with the September 2026 NVIDIA/D3V discussion materials.

1. An authorized operator submits an approved or synthetic commercialization brief and supporting evidence.
2. SentinelOS checks identity, scope, policy, and permission for inference.
3. Sentinel AI routes the request to the selected inference service.
4. The model prepares evidence-linked findings, missing/conflicting/unsupported items, uncertainty flags, and recommendations.
5. Nexus OS presents results for human review.
6. The authorized reviewer records a disposition.
7. Records and evidence references are preserved within verified test capabilities.

Model output remains advisory. The inference endpoint cannot approve actions, commit funds, invoke production changes, or bypass the human reviewer.

## 3. Architecture and comparison

| Layer | Role |
|---|---|
| Nexus OS / Executive Desk | Operator review, decision visibility |
| Sentinel AI | Analysis orchestration and model selection |
| SentinelOS | Identity, policy, authorization, workflow/evidence boundaries |
| Inference endpoint | Replaceable baseline managed model or NVIDIA-supported serving candidate |
| Human reviewer | Final disposition and authority |

**Arm A:** Approved managed-model baseline, exact model/version/configuration/pricing to be frozen.  
**Arm B:** One NVIDIA-served candidate, selection and license subject to technical scoping.

A comparison between *different* models evaluates end-to-end workflow fit, not pure GPU speedup. Keep prompts, data, scoring rubric, and governance path as consistent as technically feasible; report unavoidable differences.

Candidate tools to assess, not yet selected: NVIDIA NIM, Triton Inference Server, AIPerf/GenAI-Perf, and Nsight Systems.

## 4. Proposed experimental protocol

- Start with **20 synthetic or explicitly approved cases**, frozen with input manifests and review rubrics.
- Represent complete briefs, missing evidence, conflicts, unsupported claims, ambiguity, and human escalation.
- Proposed context bands **4K / 8K / 16K tokens**, subject to model support.
- Proposed assessment output target **up to 1,024 tokens**.
- Proposed concurrency **1 / 2 / 4** and **5 repeats per case/configuration**. All figures are preliminary experimental settings, not measured baseline demand.
- Before execution fix model/serving versions, tokenizer, context sizing, generation parameters, workload mix, evaluation rubric, run plan, and numeric acceptance thresholds.
- Record exact source/build/model identity, environment, inputs, timestamps, runs, failures, raw output, redactions, reviewer observations, and cost assumptions.

## 5. Evaluation dimensions

| Dimension | Measurement or evidence |
|---|---|
| Quality | Human-rated correct findings, omissions, unsupported claims, rubric consistency |
| Traceability | Supporting reference accuracy, provenance and unsupported-reference rate |
| Latency | p50/p95 inference-only and end-to-end response time; TTFT/inter-token timing if applicable |
| Throughput | Requests/sec, tokens/sec at defined concurrency |
| Reliability | Timeouts, failures, retry/partial results |
| Governance | Wrong identity/scope, missing authorization, rejected actions, evidence/receipt failure must fail closed |
| Human effort | Review time and corrections, tracked separately |
| Economics | Compute/API cost, infrastructure/logging overhead, cost per **accepted** assessment |

**Selection principle:** Performance does not override quality, human authority, traceability, or agreed failure-handling criteria. Numeric pass/fail thresholds remain TBD pending authorized review.

## 6. Cloud and partner roles — proposals only

- **Nunn Cloud:** Owns workload, authorized inputs, governance boundary, evaluation rubric, and go/no-go.
- **D3V / Google Cloud:** Historical pilot proposal; reconfirm involvement, IAM, network, quotas, GPU availability, monitoring, costs, and operator responsibilities.
- **NVIDIA:** Request model/serving guidance, minimum GPU sizing, technical contact, benchmark/profiling methodology, and applicable Inception support.
- **Azure:** Existing infrastructure context; no automatic permission to use it for GPU validation.

No partner commitment, approved cloud route, purchased hardware, funded credits, GPU sizing, or live pilot is established by this document.

## 7. Resource and cost plan required before execution

Record selected GPU count/type/memory, cloud/region, quota, supported model/container, runtime hours, logging/storage/egress expenses, billable rates, maximum authorized spend, alerts, shutoff/cleanup, identities/permissions, and approval owner. Distinguish **requested** benefits from **awarded** credits. Start with one isolated, appropriately sized environment; no multi-GPU or Blackwell-scale requirement is established.

## 8. Governance gates and stop conditions

Before any execution, require approved synthetic or otherwise permitted data, exact environment and source identity, authorized operator, documented scope/budget/expiry, isolation from production, credentials and data controls, reproducible evidence collection, and a reviewer acceptance plan.

**Stop for:** Missing authorization; unauthorized model/external actions; secret/restricted-data exposure; unapproved production reachability; missing required audit/evidence; wrong artifact identity; budget/scope overrun.

GOV-006 remains open, GOV-001 Conditional, GOV-002 HOLD. Research evidence does not close any operational-readiness requirement. Deployment, billing, access, and runtime actions require separate human authorization.

## 9. Expected outputs

1. Approved experimental protocol and frozen test-input manifest.
2. Baseline and NVIDIA configuration identities.
3. Raw benchmark and scored quality results.
4. Latency/throughput/reliability analysis.
5. Cost per accepted assessment and utilization.
6. Governance and failure-case evidence.
7. Evidence inventory, limits, reviewer findings.
8. Executive **adopt / revise / defer** decision based on attributable results.

## 10. Questions for NVIDIA — November 10

1. Which supported NVIDIA model fits structured, evidence-grounded document review?
2. What is the smallest practical NIM/Triton/managed-serving candidate?
3. What minimum GPU, region, and quota should be considered?
4. Which benchmark/profiling tools and versions should be used?
5. Can a technical contact and follow-up scope review be identified?
6. Which credits, training, engineering resources, or partner paths are actually eligible for a pre-revenue startup?
7. Can a scoping meeting include the appropriate cloud partner after responsibilities are confirmed?

**November 10 success criterion:** An agreed *next technical scoping path* (candidate, inputs, potential owner, resource/eligibility questions and follow-up), **not** a running GPU service or production-readiness claim.

## Source and lineage

- `NVIDIA_Meeting_Brief_2026-09-17.pdf` (historical speaking brief).
- `NVIDIA_Pilot_Leave_Behind_2026-09-17.pdf` (governed commercialization-review workflow).
- `Nunn_Cloud_NVIDIA_Technical_Discussion_Brief.docx` (architecture and candidate/tool questions).
- Inception acceptance received October 23–24, 2026 (correspondence).
- November 3 executive drafting session; this draft records planning proposals, not verified benchmark data.

**Review state:** Draft v0.2. Human approval pending. No merge/deployment authorized.
