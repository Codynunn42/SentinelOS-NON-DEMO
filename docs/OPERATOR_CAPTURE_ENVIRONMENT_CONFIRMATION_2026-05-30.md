# Operator Capture: Environment Confirmation (2026-05-30)

Purpose: capture the operator's selection for the environment confirmation decision surface and any supplied environment values. This form is intended to be filled by the human operator and checked into the command envelope.

Operator instructions:

- Review the decision surface below.
- Choose exactly one option: option_a (manual) or option_b (read-only discovery).
- If you choose option_a, provide the requested environment values.
- Sign and timestamp the form when complete.

Decision surface (pick one):

- option_a: PROVIDE_WORKSPACE_INFORMATION_MANUALLY
  - Description: Operator provides workspace metadata and identifiers manually. No discovery is performed.
  - Required fields to provide:
    - subscription_id:
    - resource_group_name:
    - workspace_name:
    - workspace_resource_id:
    - microsoft_sentinel_enabled: (true|false|unknown)
  - Authority: mutation_authority=false, discovery_authority=false

- option_b: APPROVE_READ_ONLY_AZURE_DISCOVERY
  - Description: Operator grants read-only discovery authority so SentinelOS may inspect workspace identity, diagnostic settings, and Sentinel enablement state. No mutation allowed.
  - Required confirmation: grant_read_only_discovery_authority: (yes|no)
  - Authority: mutation_authority=false, implementation_authority=false

Operator response (fill in):

selected_option:
operator_id:
timestamp_utc:
provided_values:
  subscription_id:
  resource_group_name:
  workspace_name:
  workspace_resource_id:
  microsoft_sentinel_enabled:
notes:

Signature:

Operator (print name):
Operator (digital id / contact):

---

When completed, copy the filled fields into `docs/COMMAND_ENVELOPE_ENVIRONMENT_CONFIRMATION_2026-05-30.md` under the `operator_response` block, and update `docs/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_MICROSOFT_SENTINEL_2026-05-29.md` `executive_template.operator_selection` with the selected option and timestamp.
