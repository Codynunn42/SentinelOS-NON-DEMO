async function escalateGovernanceSignal(signal) {
  if (!signal || signal.severity !== 'high') {
    return {
      attempted: false,
      reason: 'not_high_severity'
    };
  }

  const webhookUrl = process.env.SIGNAL_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      attempted: false,
      reason: 'webhook_not_configured'
    };
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signal)
  });

  return {
    attempted: true,
    ok: response.ok,
    status: response.status
  };
}

async function escalateGovernanceSignals(signals = []) {
  const results = [];

  for (const signal of signals) {
    try {
      results.push(await escalateGovernanceSignal(signal));
    } catch (error) {
      results.push({
        attempted: true,
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown signal escalation failure'
      });
    }
  }

  return results;
}

module.exports = {
  escalateGovernanceSignal,
  escalateGovernanceSignals
};
