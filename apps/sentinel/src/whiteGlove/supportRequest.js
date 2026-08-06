const DEFAULT_HOLDS = [
  'external_claims',
  'customer_contact',
  'runtime_mutation',
  'Azure_mutation',
  'deployment',
  'staging_commit_push',
  'production_data_access',
  'live_financial_operation'
];

const INTENT_PATTERNS = [
  {
    intent: 'restore_live_proof',
    score: 3,
    match: /\b(proof|health|route|runtime|container app|azure|serving|restore)\b/i,
    solutionStep: 'Prepare a restore-readiness packet, verify current route evidence, and keep live claims held until proof health passes.',
    nextGate: 'RESOLVE_AZURE_SUBSCRIPTION_AND_CONTAINER_APP_SERVING_STATE_FOR_OWNERFI_PROOF',
    evidenceNeeded: ['current route probe', 'Azure serving-state evidence', 'post-restore proof-health receipt']
  },
  {
    intent: 'support_item_triage',
    score: 3,
    match: /\b(support|ticket|issue|blocker|help|white glove|white-glove)\b/i,
    solutionStep: 'Classify the support item, identify evidence already available, list missing inputs, and route to the correct next gate.',
    nextGate: 'WHITE_GLOVE_INTERNAL_SUPPORT_ROUTING',
    evidenceNeeded: ['support item text', 'current evidence reference', 'desired outcome']
  },
  {
    intent: 'mission_control_reclassification',
    score: 2,
    match: /\b(mission control|billing controls|checkout|commercial trigger|sintenex|sintinex)\b/i,
    solutionStep: 'Reframe active billing language into SINTENEX commercial-trigger review and preserve payment/execution holds.',
    nextGate: 'DEFINE_MISSION_CONTROL_SINTENEX_UI_RECLASSIFICATION_SCOPE',
    evidenceNeeded: ['current UI text', 'checker expectations', 'approved replacement language']
  },
  {
    intent: 'governance_packet',
    score: 2,
    match: /\b(governance|packet|board|template|cadence|next steps|gate)\b/i,
    solutionStep: 'Update the governing artifact with current evidence, holds, recommended next gate, and non-authorization boundaries.',
    nextGate: 'UPDATE_GOVERNING_SUPPORT_PACKET',
    evidenceNeeded: ['active governing document', 'current gate', 'latest verification result']
  },
  {
    intent: 'execution_requested',
    score: 5,
    match: /\b(deploy|push|commit|stage|mutate|execute|contact customer|activate|payment|production)\b/i,
    solutionStep: 'Separate the requested execution from support triage, produce an approval packet, and keep execution held until the exact gate opens.',
    nextGate: 'PREPARE_EXECUTION_AUTHORITY_PACKET',
    evidenceNeeded: ['requested execution scope', 'approval authority', 'rollback or hold plan']
  }
];

function normalizeInput(input) {
  if (typeof input === 'string') {
    return input.trim();
  }

  if (input && typeof input === 'object') {
    return String(input.text || input.request || input.prompt || '').trim();
  }

  return '';
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function detectIntents(text) {
  return INTENT_PATTERNS
    .filter((pattern) => pattern.match.test(text))
    .map((pattern) => ({
      intent: pattern.intent,
      score: pattern.score,
      solutionStep: pattern.solutionStep,
      nextGate: pattern.nextGate,
      evidenceNeeded: pattern.evidenceNeeded
    }))
    .sort((left, right) => right.score - left.score);
}

function inferOutcome(text, intents) {
  if (!text) {
    return 'Clarify the requested support outcome before preparing a solution step.';
  }

  if (intents.length) {
    return intents[0].solutionStep;
  }

  return 'Treat the input as a support-intake item, summarize the apparent objective, and ask only for missing evidence that blocks the next step.';
}

function classifyRisk(text, intents) {
  const executionIntent = intents.some((item) => item.intent === 'execution_requested');
  const runtimeIntent = intents.some((item) => item.intent === 'restore_live_proof');

  if (executionIntent) {
    return 'high_execution_or_external_claim_risk';
  }

  if (runtimeIntent) {
    return 'medium_runtime_dependency_risk';
  }

  return 'low_to_medium_support_triage_risk';
}

function buildWhiteGloveSupportRequest(input = {}) {
  const text = normalizeInput(input);
  const intents = detectIntents(text);
  const primaryIntent = intents[0] ? intents[0].intent : 'general_support_intake';
  const nextGate = intents[0] ? intents[0].nextGate : 'WHITE_GLOVE_INTERNAL_SUPPORT_ROUTING';
  const evidenceNeeded = unique(intents.flatMap((item) => item.evidenceNeeded));
  const executionRequested = intents.some((item) => item.intent === 'execution_requested');
  const riskClassification = classifyRisk(text, intents);
  const confidence = text.length < 12 ? 0.45 : intents.length ? Math.min(0.95, 0.62 + intents.length * 0.08) : 0.58;

  return {
    mode: 'white_glove_support_request',
    status: 'solution_step_prepared',
    input: text,
    inferredIntent: primaryIntent,
    detectedIntents: intents.map((item) => item.intent),
    userOutcomeOrientation: inferOutcome(text, intents),
    nextSolutionStep: inferOutcome(text, intents),
    nextGate,
    evidenceNeeded,
    riskClassification,
    qualityScore: Number((confidence * 10).toFixed(1)),
    whiteGloveStatus: 'ON_WITH_GOVERNANCE_GUARDRAILS',
    executionAuthority: executionRequested ? 'held_pending_explicit_gate' : 'not_requested',
    holds: DEFAULT_HOLDS,
    responseRule: 'Provide the next governed solution step from the user input without requiring a long instruction list.',
    nonAuthorization: 'This support result does not authorize external activation, customer contact, runtime mutation, Azure mutation, deployment, live financial operation, staging, commit, or push.'
  };
}

module.exports = {
  buildWhiteGloveSupportRequest,
  detectIntents
};
