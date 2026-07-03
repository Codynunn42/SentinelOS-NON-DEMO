# Executive Desk — GPT Integration

This document describes how to connect Custom GPT to Executive Desk v1 via a governed proxy endpoint, following the Sentinel command governance pattern.

## Architecture

A Custom GPT can invoke a subset of Executive Desk commands by calling a proxy endpoint at `POST /proxy/command`. The proxy:

1. Validates the request schema (tenant, command, payload)
2. Runs the command through the Authority Check → Risk Gate → Receipt flow
3. Returns a governed response with receipt, auditReference, and trustScore

The GPT can use Daily Briefing and Authority Status to inform its decision-making, then propose a command that the Executive Desk loop validates and executes.

## OpenAPI Schema

```yaml
openapi: 3.1.0
info:
  title: Sentinel Executive Desk v1
  version: 1.0.0
  description: >
    Governed command interface for Executive Desk v1.
    Commands flow through: Authority Check → Risk Gate → Receipt.
    All responses include governance metadata (receipt, auditReference, trustScore).

servers:
  - url: https://YOUR_PROXY_URL

paths:
  /proxy/command:
    post:
      operationId: executeGovernedCommand
      summary: Execute a governed command via Executive Desk
      description: >
        Accepts a command object and runs it through the Authority Check → Risk Gate
        → Receipt flow. Returns a signed receipt and audit reference.
        Supported commands:
        - exec.deploy.toggle (toggle a deployment flag)
        - exec.policy.apply (apply a governance policy)
        - exec.escalate (escalate to approver queue)

      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - tenant
                - command
                - payload
              properties:
                tenant:
                  type: string
                  enum:
                    - nunncloud
                  description: Tenant identifier

                command:
                  type: string
                  enum:
                    - exec.deploy.toggle
                    - exec.policy.apply
                    - exec.escalate
                  description: Governed command name

                payload:
                  type: object
                  description: Command-specific payload
                  required:
                    - principalId
                    - action
                    - resource
                  properties:
                    principalId:
                      type: string
                      example: user@example.com
                      description: Executing principal ID

                    action:
                      type: string
                      example: approve
                      description: Action to perform

                    resource:
                      type: string
                      example: prod/deployment/feature-x
                      description: Target resource path

                    context:
                      type: object
                      description: Optional decision context (e.g., briefing item ID, risk notes)
                      properties:
                        briefingItemId:
                          type: string
                        riskNotes:
                          type: string

      responses:
        "200":
          description: Command executed and received
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    enum:
                      - executed
                      - blocked
                      - pending_approval
                    description: Execution status

                  command:
                    type: string
                    description: Echoed command name

                  executionMode:
                    type: string
                    enum:
                      - governed_direct
                      - governed_escalated
                    description: How the command was processed

                  bypassPrevented:
                    type: boolean
                    description: Whether bypass was prevented by risk gate

                  authorityCheckResult:
                    type: object
                    properties:
                      allowed:
                        type: boolean
                      requiredApprovers:
                        type: array
                        items:
                          type: string

                  riskGateOutcome:
                    type: object
                    properties:
                      decision:
                        type: string
                        enum:
                          - pass
                          - warn
                          - block
                      score:
                        type: number
                      mitigations:
                        type: array
                        items:
                          type: string

                  trustScore:
                    type: number
                    minimum: 0
                    maximum: 1
                    description: Governance trust score for the decision

                  receipt:
                    type: object
                    properties:
                      id:
                        type: string
                      command:
                        type: string
                      executor:
                        type: string
                      timestamp:
                        type: string
                        format: date-time
                      signature:
                        type: string
                        description: HMAC or asymmetric signature for audit verification

                  auditReference:
                    type: string
                    description: Log entry ID for compliance and tracing

                  reasons:
                    type: array
                    items:
                      type: string
                    description: Explanation of decision

        "400":
          description: Invalid request schema

        "403":
          description: Authority check failed or risk gate blocked

components: {}
```

## Setup

1. **Deploy proxy endpoint** at your Cloudflare URL (e.g., `https://frontdesk.nunncorporation.com/proxy/command`)
2. **Add authentication** (Bearer token, API key, or OIDC) in `securitySchemes` section
3. **Update server URL** to your production domain
4. **Import schema** into Custom GPT → Actions → Create new action → Paste this schema

## Minimal proxy implementation (Node.js reference)

```javascript
app.post('/proxy/command', async (req, res) => {
  const { tenant, command, payload } = req.body;

  // 1. Validate schema
  if (!['nunncloud'].includes(tenant)) {
    return res.status(400).json({ error: 'Invalid tenant' });
  }

  // 2. Authority Check
  const authCheck = await authorityService.check({
    principalId: payload.principalId,
    action: payload.action,
    resource: payload.resource,
  });

  if (!authCheck.allowed) {
    return res.status(403).json({
      status: 'blocked',
      command,
      authorityCheckResult: authCheck,
      receipt: { status: 'rejected', reason: 'authority_check_failed' },
    });
  }

  // 3. Risk Gate
  const riskOutcome = await riskGateService.evaluate({
    command,
    payload,
    authorityCheckResult: authCheck,
  });

  if (riskOutcome.decision === 'block') {
    return res.status(403).json({
      status: 'blocked',
      command,
      riskGateOutcome: riskOutcome,
      receipt: { status: 'rejected', reason: 'risk_gate_blocked' },
    });
  }

  // 4. Issue Receipt & Execute
  const receipt = {
    id: uuid(),
    command,
    executor: payload.principalId,
    timestamp: new Date().toISOString(),
    authorityChecks: [authCheck],
    riskOutcome,
    signature: sign(JSON.stringify({ command, payload, timestamp: Date.now() })),
  };

  const auditReference = await auditLog.record(receipt);

  // (In v1, actual command execution may be async/deferred)
  const result = await executeCommand(command, payload);

  return res.json({
    status: 'executed',
    command,
    executionMode: authCheck.requiredApprovers.length > 0 ? 'governed_escalated' : 'governed_direct',
    bypassPrevented: riskOutcome.decision !== 'pass',
    authorityCheckResult: authCheck,
    riskGateOutcome: riskOutcome,
    trustScore: (authCheck.allowed && riskOutcome.decision === 'pass') ? 0.95 : 0.6,
    receipt,
    auditReference,
    reasons: riskOutcome.mitigations || [],
  });
});
```

## Integration workflow (GPT perspective)

1. **Briefing context**: GPT reads `/api/executive/briefing` to understand pending decisions
2. **Authority check**: GPT queries `/api/executive/authority?scope=...` to see if action is allowed
3. **Propose command**: GPT calls `POST /proxy/command` with the decision
4. **Receipt & report**: GPT reads the response, including receipt and auditReference, and summarizes for the executive

## Security & governance notes

- All `/proxy/command` calls MUST include an attestation token (Bearer or OIDC)
- Risk Gate must explicitly return `pass/warn/block`; commands with `warn` should prompt for approval
- Receipts are signed and immutable; maintain an audit log for compliance export
- Trust score reflects the governance posture: high (0.9+) for properly authorized, low-risk actions; lower for escalations or risk warnings

## Next steps

1. Implement the proxy endpoint with authority check and risk gate services
2. Wire GPT action schema to your production domain
3. Test end-to-end flow: GPT → Authority Check → Risk Gate → Receipt → Report
4. Add Custom GPT instructions that reference the briefing and authority endpoints to inform decision-making
