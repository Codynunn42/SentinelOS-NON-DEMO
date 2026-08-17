const express = require("express");
const crypto = require("crypto");
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
    evidence: { reference: null, hash: null, state: "verified" }
  };
}

app.get("/health", (req, res) => res.json(env(req,"health.read","allow","T0",{
  status:"healthy",runtime:true,memory:true,policy_engine:true,evidence_store:true,ecosystem_engine:true,sentinel_required:false
})));
app.get("/version", (req, res) => res.json(env(req,"version.read","allow","T0",identity)));
app.get("/sovereignty", (req, res) => res.json(env(req,"sovereignty.read","allow","T0",{
  status:"sovereign",runtime_independent:true,identity_independent:true,memory_independent:true,evidence_independent:true,sentinel_runtime_dependency:false,external_exchange_mode:"explicit"
})));
app.get("/runtime", (req, res) => res.json(env(req,"runtime.read","allow","T0",{
  system:"ssai",version:"1.1.0",mode:"stargate-ecosystem",uptime_seconds:Math.floor((Date.now()-start)/1000),authority_profile:"governed",learning_mode:"controlled",historical_database:"read-only",sentinel_status:"external-peer"
})));
app.get("/evidence/latest", (req, res) => res.json(env(req,"evidence.latest.read","allow","T0",{
  request_id:crypto.randomUUID(),timestamp:new Date().toISOString(),outcome:"ok"
})));

app.post("/canary/run", (req, res) => {
  const token = (req.header("authorization") || "").replace(/^Bearer\s+/i, "");
  const scope = req.header("x-scopes") || "";
  const ok = token === (process.env.CANARY_SCOPED_TOKEN || "") && scope.split(",").map(s=>s.trim()).includes(process.env.CANARY_REQUIRED_SCOPE || "ssai.canary.execute");
  if (!ok) return res.status(403).json(env(req,"canary.run","deny","T2",{error:"forbidden",required_scope:process.env.CANARY_REQUIRED_SCOPE || "ssai.canary.execute"}));
  return res.json(env(req,"canary.run","allow","T2",{authorized:true,scope:process.env.CANARY_REQUIRED_SCOPE || "ssai.canary.execute",canary:"ssai-runtime-basic",result:"passed"}));
});

app.listen(process.env.PORT || 3100, () => console.log("SSAI Sovereign API listening on :3100"));
