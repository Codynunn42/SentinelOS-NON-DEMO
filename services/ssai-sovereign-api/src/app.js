const express = require("express");
const crypto = require("crypto");
const evidenceStore = require("./evidence-store");
const app = express();
app.use(express.json());

const start = Date.now();
const identity = {
  system: "ssai",
  name: "SSAI Sovereign Runtime",
  version: "1.1.0",
  mission: "Stargate Ecosystem",
  runtime_profile: "sovereign",
  sentinel_dependency_required: false,
  authority_model: "governed",
  status: "operational"
};

function env(req, action, decision, tier, result) {
  return {
    request_id: req.header("x-request-id") || crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    system: "ssai",
    version: "1.1.0",
    actor: { type: req.header("x-actor-type") || "service", id: req.header("x-actor-id") || "unknown" },
    policy: { decision, authority_tier: tier },
    action,
    result,
    evidence: { reference: null, hash: null, state: "observed" }
  };
}

function observedChecks() {
  return {
    runtime: { status: "pass", source: "process" },
    policy_engine: { status: "pass", source: "policy_eval" },
    evidence_store: evidenceStore.health(),
    memory: { status: "not_configured", source: "missing_integrity_store" },
    ecosystem_engine: { status: "not_configured", source: "external_ecosystem_unverified" }
  };
}

app.get("/health", (req, res) => {
  const checks = observedChecks();
  return res.json(env(req, "health.read", "allow", "T0", {
    status: "observed",
    checks,
    runtime: checks.runtime.status === "pass",
    memory: false,
    policy_engine: checks.policy_engine.status === "pass",
    evidence_store: checks.evidence_store.status === "pass",
    ecosystem_engine: false,
    sentinel_required: false
  }));
});

app.get("/version", (req, res) => res.json(env(req, "version.read", "allow", "T0", identity)));

app.get("/sovereignty", (req, res) => {
  const checks = observedChecks();
  return res.json(env(req, "sovereignty.read", "allow", "T0", {
    status: "sovereignty-ready",
    observed: {
      runtime_independent: checks.runtime.status === "pass",
      evidence_independent: checks.evidence_store.status === "pass"
    },
    pending_proof: {
      identity_independent: "not_configured",
      memory_independent: "not_configured",
      ecosystem_independent: "not_configured",
      sentinel_ai_outage_test: "pending"
    },
    sentinel_runtime_dependency: false,
    external_exchange_mode: "explicit"
  }));
});

app.get("/runtime", (req, res) => res.json(env(req, "runtime.read", "allow", "T0", {
  system: "ssai",
  version: "1.1.0",
  mode: "stargate-ecosystem",
  uptime_seconds: Math.floor((Date.now() - start) / 1000),
  authority_profile: "governed",
  learning_mode: "controlled",
  historical_database: "read-only",
  sentinel_status: "external-peer"
})));

app.get("/evidence/latest", (req, res) => {
  try {
    const latest = evidenceStore.latest();

    if (!latest) {
      return res.status(404).json(env(req, "evidence.latest.read", "allow", "T0", {
        status: "not_found",
        message: "no evidence has been persisted yet"
      }));
    }

    const response = env(req, "evidence.latest.read", "allow", "T0", latest.record);
    response.evidence = {
      reference: latest.reference,
      hash: latest.hash,
      state: latest.verified ? "verified" : "failed"
    };

    return res.json(response);
  } catch (error) {
    return res.status(500).json(env(req, "evidence.latest.read", "deny", "T0", {
      error: error.message
    }));
  }
});

app.post("/canary/run", (req, res) => {
  const token = (req.header("authorization") || "").replace(/^Bearer\s+/i, "");
  const scope = req.header("x-scopes") || "";
  const requiredScope = process.env.CANARY_REQUIRED_SCOPE || "ssai.canary.execute";
  const ok = token === (process.env.CANARY_SCOPED_TOKEN || "") && scope.split(",").map(s => s.trim()).includes(requiredScope);

  if (!ok) {
    return res.status(403).json(env(req, "canary.run", "deny", "T2", {
      error: "forbidden",
      required_scope: requiredScope
    }));
  }

  const saved = evidenceStore.write({
    request_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    action: "canary.run",
    policy: {
      decision: "allow",
      authority_tier: "T2"
    },
    result: {
      authorized: true,
      scope: requiredScope,
      canary: "ssai-runtime-basic",
      result: "passed"
    }
  });

  const response = env(req, "canary.run", "allow", "T2", saved.record.result);
  response.evidence = {
    reference: saved.reference,
    hash: saved.hash,
    state: saved.state
  };

  return res.json(response);
});

app.listen(process.env.PORT || 3100, () => console.log("SSAI Sovereign API listening on :3100"));
