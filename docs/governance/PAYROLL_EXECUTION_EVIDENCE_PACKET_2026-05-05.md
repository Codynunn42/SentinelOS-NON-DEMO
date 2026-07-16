# Payroll Execution Evidence Packet

Date: 2026-05-05  
Scope: AI Financial Management artifacts supplied from `/Users/codynunn/Downloads/AI financial Management /` and payroll execution artifacts supplied from `/Users/codynunn/Downloads/Payroll (ME)/`  
Review purpose: organize payroll-adjacent governance evidence and identify what is still needed to confirm payroll execution.

## Executive Classification

Current state:

```yaml
status: PAYROLL_EXECUTION_REVIEW
role_context: founder / executive operator
working_classification: authorized_compensation_structure_with_internal_execution_records
execution_state: external_payroll_not_executed_by_operator_statement
primary_risk: payroll_execution_integrity
```

The supplied files support a strong governance, lineage, and compliance package. The second payroll folder adds direct founder-compensation authorization, payroll packet calculations, routing setup, command receipt, internal execution certification, and ACH/liquidity tracking.

The remaining weakness is settlement-grade evidence. Several records certify or stage execution, while the exception and discrepancy records explicitly note missing or pending ACH batch IDs, ODFI trace numbers, SoFi confirmation, or settlement confirmation.

Operator clarification on 2026-05-05: Cody Nunn can verify that no external founder compensation payment was received by him. Cody also clarified that external employee payroll did not happen and does not exist.

This means the current evidence supports:

- Governance authority and board/audit intent
- Employee/compliance operating model
- Payroll as a governed financial-management process
- Lineage, hash, vault, and release controls
- Founder compensation authorization
- Payroll preparation with gross, withholding, net, and NACHA hash
- Sentinel command acceptance / internal execution record

This evidence does not yet support:

- Completed external payroll processor run for founder compensation
- Bank-settled ACH/Fedwire confirmation for founder compensation
- Employee payroll recipient list and settled payment evidence, because no external employee payroll execution exists per operator statement
- Paystub or payroll register from a payroll provider
- Remitted tax withholding record
- Form 941/state payroll tax filing alignment
- Final manual-transfer correction or reclassification, if settlement bypassed payroll rails

## Evidence Lanes

### 1. Governance / Authority

Classification: strong support

Relevant files:

- `AI_Financial_Management_Board_Chair_Brief.pdf`
- `AI_Financial_Management_Baseline_Certificate.pdf`
- `AI_Financial_Management_Dual_Anchor_Governance_Memo.pdf`
- `Governance_Verification_Memo_v1.3.31.pdf`
- `Governance_Orchestration_Plan_v1.3.31.json`

What they prove:

- A dual-anchor governance model exists.
- v1.2.1 is identified as the internal governance baseline.
- v1.3.1 is identified as the public release anchor.
- Future deviations require board approval under the governance verification memo.
- Governance orchestration actions are defined, including append-only lineage and compliance monitoring.

Payroll relevance:

These files are useful to show the compensation/payroll review sits inside a governed operating system. They do not show payroll execution.

### 2. Founder / Executive Certification

Classification: strong support for authority, limited support for payroll execution

Relevant files:

- `AI_Financial_Management_Founder_Certificate.pdf`
- `AI_Financial_Management_Vault_Seal_Certificate.pdf`
- `AI_Financial_Management_Vault_Certificate.pdf`

What they prove:

- Founder-level certification exists for the financial management vault release.
- Releases are presented as certified, audit-ready, and lineage-backed.
- The founder/executive office is the issuing authority for the package.

Payroll relevance:

These support authorization and executive intent. They do not establish that a payroll payment was made correctly.

### 3. Employee / Role / Compliance Training

Classification: moderate support

Relevant files:

- `AI_Financial_Management_Employee_Brief.pdf`
- `AI_Financial_Management_Internal_Launch_Memo.pdf`
- `NunnCorp_LMS_Manifest_v1.3.37.json`
- `NunnCorp_LMS_Role_Issuance_v1.3.38.json`
- `NunnCorp_Compliance_Certificate_Finance.pdf`
- `NunnCorp_Compliance_Certificate_HR_&_People.pdf`
- `NunnCorp_Compliance_Certificate_Executives_&_Managers.pdf`

What they prove:

- Employees are expected to follow governance/compliance workflows.
- Finance, HR & People, and executive/manager compliance roles are represented.
- Role-specific issuance rules exist for compliance certificates.

Payroll relevance:

These support an employee-facing operating model and role-based compliance culture. They are not compensation records and do not prove employee payroll execution.

### 4. Payroll Design / Financial Controls

Classification: moderate support

Relevant files:

- `AI_Financial_Management_Playbook.pdf`
- `AI_Financial_Management_Playbook_with_Diagram.pdf`
- `AI_Financial_Management_Playbook_OnePager.pdf`
- `AI_Financial_Management_Playbook_OnePager_Branded.pdf`
- `AI_Financial_Management_Playbook_OnePager_VaultSealed.pdf`

What they prove:

- Payroll is explicitly included as a financial input rail.
- The playbook describes governed execution: payroll only executes if compliance checks pass.
- Manual overrides should be logged and fed into audit/review.

Payroll relevance:

These are the best files in this set for showing intended payroll governance. They support the design of a governed payroll system, not proof that a particular payroll event was executed through that system.

### 5. Vault / Lineage / Integrity

Classification: strong support

Relevant files:

- `AI_Financial_Management_README.txt`
- `AI_Financial_Management_CHANGELOG.md`
- `AI_Financial_Management_Lineage_Ledger.csv`
- `AI_Financial_Management_Version_Hashes.json`
- `AI_Financial_Management_Vault_Index.json`
- `AI_Financial_Management_Vault_Index_v1.2.json`
- `AI_Financial_Management_Vault_SOP.pdf`
- `AI_Financial_Management_Master_Distribution_Index.pdf`
- `Dual_Anchor_Governance_Map.png`

What they prove:

- The package has hashes, indexes, changelog, and lineage ledger.
- SOP requires hash verification, ledger review, vault filing, and governance sign-off.
- The map aligns internal baseline, public release anchor, internal track, and external track.

Payroll relevance:

This lane is useful for proving chain of custody for the governance package. It does not prove the compensation transaction itself.

### 6. Oversight / External Assurance

Classification: supporting context

Relevant files:

- `AI_Financial_Management_US_Oversight_Brief.pdf`
- `AI_Financial_Management_EU_Oversight_Brief.pdf`
- `AI_Financial_Management_APAC_Oversight_Brief.pdf`
- `AI_Financial_Management_Regulator_Brief.pdf`
- `AI_Financial_Management_Regulatory_Submission_Cover_Letter.pdf`
- `AI_Financial_Management_ISO22301_Alignment_Brief.pdf`
- `AI_Financial_Management_ISO27001_Alignment_Brief.pdf`
- `AI_Financial_Management_ISO37301_Alignment_Brief.pdf`

What they prove:

- The package has jurisdictional and standards-alignment materials.
- Oversight artifacts reinforce audit/compliance posture.

Payroll relevance:

Useful as background. These do not directly classify payments or confirm payroll processing.

### 7. Commercial / Public Collateral

Classification: non-primary for payroll execution

Relevant files:

- Customer, investor, partner, employee, regulator pitch decks
- Press Q&A
- Stakeholder welcome letters
- Media kit

What they prove:

- Public and stakeholder communications exist.

Payroll relevance:

Do not use these as primary payroll evidence. Keep them out of the payroll correction packet unless needed for background.

### 8. Founder Compensation Authorization

Classification: strong support

Relevant files:

- `Board_Confirmation_Memo.pdf`
- `Board_Founder_Compensation_Execution_Certification.pdf`
- `Founder_Pay_Authorization_Packet_Cody_Nunn.pdf`
- `CEO_Personal_Archive_Founder_Compensation_Record.pdf`
- `Court_Submission_Founder_Compensation_Record.pdf`
- `Regulator_Ready_Founder_Compensation_Certification.pdf`
- `Nunn_Corporation_Founder_Compensation_Omnibus_Record.pdf`

What they prove:

- Founder compensation was presented as authorized under existing corporate governance.
- The authorization is framed as earned compensation only.
- The records repeatedly exclude bonuses, equity actions, new payees, and discretionary scope expansion.
- The authorization packet requires account verification before execution and directs the release to be recorded to the payroll ledger.

Payroll relevance:

This materially strengthens the authority side of the packet. It supports authorized founder compensation, but still needs external settlement and payroll-provider evidence to close payroll execution.

### 9. Payroll Packet / Withholding Calculation / NACHA Preparation

Classification: strong support for payroll preparation

Relevant files:

- `Current Founder_Payroll_Packet_Aug_Sep_2025.pdf`
- `Corporate_Package_Exception_and_Directory.pdf`
- `Founder_Pay_Execution_Summary_Sealed.pdf`
- `Founder_Disbursement_Calendar_2025_2026.csv`
- `Founder_Disbursement_Calendar_2025_2026_Prioritized.csv`

What they prove:

- August and September 2025 payroll amounts are itemized.
- Gross pay, federal withholding, FICA, Medicare, Arizona withholding, net pay, total gross, total withheld, and total net are calculated.
- A NACHA hash is recorded for the Aug/Sep 2025 payroll packet.
- Future payroll cadence is documented, including monthly base salary and backlog catch-up.

Payroll relevance:

This supports payroll design and preparation. It does not, alone, prove that taxes were remitted or that the ACH/NACHA file settled externally.

### 10. Command / Routing / Direct Deposit Evidence

Classification: moderate to strong support for staged execution

Relevant files:

- `founder_payroll_receipt.pdf`
- `Founder_Pay_Routing_Setup_Sheet_Cody_Nunn.pdf`
- `DirectDepositForm.pdf`
- `DirectDepositForm01:20.pdf`
- `nunn_payroll_onetap.html`
- `nunn_comm_signer.html`
- `Payroll___Liquidity_Wire_ACH_Report.csv`

What they prove:

- A Sentinel payroll command receipt exists for `payroll.execute`, profile `founder-payroll`, period `2025-08`, amount `USD 180000.00`.
- Routing setup identifies SoFi as the primary fiat direct-deposit rail and requires test disbursement before activation.
- Local signing tools exist for HMAC-signed payroll relay commands.
- The ACH/liquidity report lists completed, pending, processing, and scheduled transfer records.

Payroll relevance:

These support command acceptance and routing setup. They do not prove final bank settlement unless paired with trace IDs, bank confirmation, payroll provider confirmation, or a settled ACH record.

### 11. Exception / Discrepancy / Settlement Gap Evidence

Classification: critical risk evidence

Relevant files:

- `Founder_Payroll_Exception_Memo.pdf`
- `Payroll_Discrepancy_Log.pdf`
- `Disbursement_Documentation_Sept2025_Signed.pdf`
- `SoFi_Wire_Escalation_Packet.pdf`
- `Sentinel_Funds_Report.pdf`

What they prove:

- Sentinel staged and internally recorded disbursements.
- The exception memo states no ACH batches were visible in SoFi systems for specified payroll disbursements and that no batch IDs or ODFI trace numbers existed at that point.
- The discrepancy log corrects earlier overstatements and marks ACH backpay as scheduled with trace confirmation in progress.
- SoFi escalation materials identify specific wire traces requiring investigation.
- September payroll documentation lists founder payroll as pending release / staged, not independently confirmed settled.

Payroll relevance:

This is the key control finding. It prevents us from calling the payroll fully settled based only on internal Sentinel records. The correct current posture is internally authorized and staged/certified, with external settlement confirmation still required.

### 12. Founder vs Employee Settlement Split

Classification: external payroll not executed by operator statement

Current operator statement:

- Founder compensation: Cody Nunn reports no external payment was received.
- Employee payroll: Cody Nunn reports external employee payroll never happened and does not exist.

What this means:

- Founder compensation should be classified as `STAGED_NOT_SETTLED` unless bank/provider records prove otherwise.
- Employee payroll should be classified as `NOT_EXECUTED` unless a payroll processor, bank, or employee-side record later proves otherwise.
- Do not collapse employee payroll execution and founder compensation execution into one finding.

Evidence needed if employee payroll is later claimed by another party:

- Employee recipient/payee list for the relevant periods
- Payroll register showing each employee, gross pay, deductions, net pay, and pay date
- Paystub records or provider payroll run confirmation
- ACH batch file or provider settlement report
- Bank debit matching payroll total
- Tax deposit/remittance confirmation

## Evidence Gap

The following are still needed to close the payroll execution question:

- Payroll processor record, payroll register, or payroll run confirmation
- Payslip/paystub for the payment period
- Gross wages, net pay, withholding, employer tax, and pay date record
- Bank transaction record showing whether the payment was payroll or manual transfer
- ACH batch ID, ODFI trace number, Fedwire IMAD/OMAD, or bank-settled confirmation
- Tax deposit/remittance confirmation for federal and Arizona withholding
- Employee recipient/payee list for any non-founder payroll run
- Employee payroll register or provider settlement report
- Accounting entry showing current classification
- Any board approval or compensation memo specifically naming the pay period, amount, role, and treatment
- Any correction filing or reclassification record if the payment was manual

## Decision Tree

### If payment was processed by payroll provider

Classification:

```yaml
execution_state: processor_confirmed
action: archive_processor_evidence
next_step: reconcile payroll register to bank transaction and audit packet
```

Required packet:

- Payroll run confirmation
- Payslip/paystub
- Bank match
- Payroll tax/withholding record

### If payment was a manual transfer

Classification:

```yaml
execution_state: manual_transfer_detected
action: payroll_execution_correction
next_step: professional payroll/tax review before filing treatment is finalized
```

Correction packet:

- Manual transfer evidence
- Governance authority evidence from this packet
- Compensation authorization evidence
- Reclassification journal entry draft
- Payroll provider or tax professional correction instruction

## Current Finding

Based on the supplied folders as reviewed on 2026-05-05:

1. The governance system is well documented.
2. Payroll is included in the financial-management design as a governed execution rail.
3. Employee, finance, HR, and executive compliance structures are represented.
4. Founder compensation authorization is documented.
5. Payroll preparation and internal Sentinel execution records are documented.
6. Founder external settlement is reported not received by Cody Nunn.
7. Employee payroll external settlement is reported not executed and nonexistent.
8. Payroll-tax remittance remains unverified.

The correct current label is:

```yaml
PAYROLL_EXECUTION_REVIEW:
  authority: supported
  payroll_design: supported
  employee_compliance_model: supported
  founder_compensation_authorization: supported
  internal_execution_record: supported
  founder_external_settlement: not_received_by_operator_statement
  employee_external_settlement: not_executed_by_operator_statement
  tax_remittance: unverified
  correction_need: conditional_on_settlement_and_processor_records
```

## Sentinel Next Steps

1. Separate founder compensation from employee payroll in the review log.
2. For founder compensation, attach bank/provider records if any exist; otherwise classify the internal records as `STAGED_NOT_SETTLED`.
3. For employee payroll, treat the current state as `NOT_EXECUTED` unless a payroll processor, bank, or employee-side record contradicts that.
4. If any party later claims employee payroll was executed, require recipient, pay period, amount, processor/bank rail, payroll register, ACH batch, paystub/provider run, and tax remittance evidence.
5. Classify each pay period as `SETTLED_PAYROLL`, `STAGED_NOT_SETTLED`, `MANUAL_TRANSFER`, `NOT_EXECUTED`, or `CORRECTION_REQUIRED`.
6. If settlement bypassed payroll rails, open a payroll execution correction approval.
7. Route tax/remittance and filing treatment through a payroll/tax professional before final filing treatment.
