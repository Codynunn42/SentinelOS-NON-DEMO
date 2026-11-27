// Governed command: faceplane.pr.audit
// Report-only PR governance evaluation over a caller-supplied PR snapshot.
// Never runs git, never calls GitHub, and grants no merge, approval, deployment, or thread-resolution authority.

const {
  AUTHORITY,
  evaluatePrGovernance
} = require('../../faceplanes/prGovernance/prGovernanceEvaluator');
const { renderMarkdownReport } = require('../../faceplanes/prGovernance/prGovernanceReport');

const ALLOWED_PAYLOAD_FIELDS = new Set(['snapshot', 'policy', 'format']);
const ALLOWED_FORMATS = new Set(['json', 'markdown']);

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function handleFaceplanePrAudit(payload = {}) {
  if (!isRecord(payload) || !isRecord(payload.snapshot)) {
    return {
      success: false,
      statusCode: 400,
      error: 'INVALID_PAYLOAD',
      message: 'faceplane.pr.audit requires payload.snapshot (PR snapshot object)'
    };
  }

  const unsupported = Object.keys(payload).filter((key) => !ALLOWED_PAYLOAD_FIELDS.has(key));
  if (unsupported.length > 0) {
    return {
      success: false,
      statusCode: 400,
      error: 'UNSUPPORTED_PAYLOAD_FIELDS',
      details: { fields: unsupported }
    };
  }

  if (payload.policy !== undefined && !isRecord(payload.policy)) {
    return { success: false, statusCode: 400, error: 'INVALID_POLICY' };
  }

  const format = payload.format === undefined ? 'json' : payload.format;
  if (!ALLOWED_FORMATS.has(format)) {
    return { success: false, statusCode: 400, error: 'UNSUPPORTED_FORMAT' };
  }

  const report = evaluatePrGovernance(payload.snapshot, { policy: payload.policy });

  return {
    success: true,
    statusCode: 200,
    data: {
      command: 'faceplane.pr.audit',
      executionMode: 'report_only',
      authority: { ...AUTHORITY },
      readiness: report.readiness,
      score: report.score,
      report,
      ...(format === 'markdown' ? { markdown: renderMarkdownReport(report) } : {})
    }
  };
}

module.exports = {
  handleFaceplanePrAudit
};
