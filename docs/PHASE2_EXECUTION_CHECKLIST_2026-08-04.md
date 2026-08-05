# Phase 2 Execution Checklist - 2026-08-04

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** Phase 2 evidence execution  
**Scope:** close remaining evidence gaps and prepare the system for ORV-2 and readiness review

## 1. Create the Phase 2 work branches

- [ ] Create the umbrella branch `phase2/evidence-upgrade`
- [ ] Create the child branches:
  - [ ] `phase2/sncs-upgrade`
  - [ ] `phase2/remove-synthetic-evidence`
  - [ ] `phase2/add-missing-evidence`
  - [ ] `phase2/ai-routing-evidence`
  - [ ] `phase2/module-layer-evidence`
  - [ ] `phase2/evidence-status-backend`
  - [ ] `phase2/orv2-campaign6-tests`
  - [ ] `phase2/outcome-briefing-upgrade`

## 2. Complete SNCS evidence for partial-evidence capabilities

### Capabilities
- [ ] calendar-read
- [ ] report-generate
- [ ] repo-read
- [ ] action-execute
- [ ] deal-submission
- [ ] deal-evaluation
- [ ] deal-execution

### Execution
- [ ] Locate provider-plane implementation for each capability
- [ ] Add a real SNCS emission call after the ledger or receipt step
- [ ] Ensure the evidence chain includes the cross-provider evidence link
- [ ] Verify the Executive Desk evidence-status panel reflects the update
- [ ] Add or update an ORV-2 test case for SNCS completeness

## 3. Replace synthetic evidence with real sovereign evidence

### Capabilities
- [ ] routing
- [ ] automation
- [ ] orchestration
- [ ] state-management

### Execution
- [ ] Replace synthetic evidence emission with SPE/SER/SEL/SNCS flow
- [ ] Ensure no synthetic markers remain in the evidence path
- [ ] Verify the evidence chain is real and traceable
- [ ] Confirm the Executive Desk shows the capability as verified
- [ ] Add or update an ORV-2 workflow evidence test

## 4. Add evidence to capabilities that currently emit none

### Capabilities
- [ ] planning
- [ ] executive-packets
- [ ] outcome-briefings
- [ ] cadence

### Execution
- [ ] Add a governed session entry
- [ ] Add receipt emission
- [ ] Add ledger entry
- [ ] Add SNCS evidence
- [ ] Verify the capability appears as verified in the evidence-status panel
- [ ] Add or update an ORV-2 executive capability test

## 5. Add AI routing evidence

### Capabilities
- [ ] ai-planning
- [ ] ai-analysis
- [ ] ai-research
- [ ] ai-writing

### Execution
- [ ] Update the AI routing or model broker path
- [ ] Emit evidence at the routing decision point
- [ ] Include model, provider, and data-classification context when available
- [ ] Verify AI routing evidence appears in the ledger and Executive Desk view
- [ ] Add or update AI routing evidence tests

## 6. Add module-level evidence

### Evidence events
- [ ] module resolution
- [ ] module health aggregation
- [ ] module governance denial

### Execution
- [ ] Add evidence emission to the module resolver
- [ ] Add evidence emission to module health aggregation
- [ ] Add evidence emission to governance denial paths
- [ ] Ensure the Executive Desk can surface module-layer evidence
- [ ] Add or update ORV-2 module evidence tests

## 7. Integrate evidence status with the backend

### Execution
- [ ] Query SPE for governed sessions
- [ ] Query SER for receipts
- [ ] Query SEL for ledger entries
- [ ] Query SNCS for cross-provider evidence
- [ ] Compute a summarized evidence status for each capability
- [ ] Ensure the panel updates automatically from backend evidence
- [ ] Verify no capability remains open or pending once evidence is present

## 8. Add and run ORV-2 Campaign 6 tests

### Test areas
- [ ] capability-to-module resolution
- [ ] module health aggregation
- [ ] evidence completeness
- [ ] AI routing evidence
- [ ] module-layer evidence
- [ ] Executive Desk evidence-status consistency

### Execution
- [ ] Add the test suite for Campaign 6
- [ ] Run the relevant tests
- [ ] Fix any failures
- [ ] Re-run until the campaign passes

## 9. Generate the Phase 2 outcome briefing

### Content
- [ ] capability evidence completeness
- [ ] module evidence completeness
- [ ] AI Operations evidence
- [ ] Executive Desk verification
- [ ] ORV-2 score
- [ ] readiness recommendation

### Execution
- [ ] Produce the briefing after evidence is complete
- [ ] Confirm that no pending evidence remains
- [ ] Prepare the handoff for the next readiness declaration
