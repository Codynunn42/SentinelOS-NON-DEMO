// Execution Trace
// Purpose: Record and retrieve execution traces by correlationId.
// Each trace reconstructs the full pipeline path for a single request.

const MAX_TRACES = 200;
const traces = new Map();

const PIPELINE_STAGES = ['api', 'security', 'governance', 'learning', 'analysis', 'decision', 'approval', 'execution'];

function createTrace(correlationId, envelope = {}) {
  const trace = {
    correlationId,
    tenant: envelope.tenant || null,
    command: envelope.command || envelope.legacyCommand || null,
    actor: envelope.metadata && envelope.metadata.actor ? envelope.metadata.actor : null,
    startedAt: new Date().toISOString(),
    completedAt: null,
    stages: [],
    outcome: null
  };

  traces.set(correlationId, trace);

  if (traces.size > MAX_TRACES) {
    const oldest = [...traces.keys()][0];
    traces.delete(oldest);
  }

  return trace;
}

function recordStage(correlationId, stage, details = {}) {
  const trace = traces.get(correlationId);
  if (!trace) return null;

  trace.stages.push({
    stage,
    stageIndex: PIPELINE_STAGES.indexOf(stage),
    timestamp: new Date().toISOString(),
    ...details
  });

  return trace;
}

function completeTrace(correlationId, outcome = {}) {
  const trace = traces.get(correlationId);
  if (!trace) return null;

  trace.completedAt = new Date().toISOString();
  trace.outcome = outcome;
  return trace;
}

function getTrace(correlationId) {
  return traces.get(correlationId) || null;
}

function listTraces(options = {}) {
  const all = [...traces.values()].sort((a, b) =>
    new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  if (options.tenant) {
    return all.filter((t) => t.tenant === options.tenant);
  }

  return all.slice(0, options.limit || 50);
}

module.exports = {
  PIPELINE_STAGES,
  completeTrace,
  createTrace,
  getTrace,
  listTraces,
  recordStage
};
