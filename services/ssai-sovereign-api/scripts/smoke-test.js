const base = process.env.BASE_URL || "http://127.0.0.1:3100";
const token = process.env.CANARY_SCOPED_TOKEN || "dev-canary-token";
const scope = process.env.CANARY_REQUIRED_SCOPE || "ssai.canary.execute";

async function j(path, opts){ const r=await fetch(base+path,opts); return {r,b:await r.json()}; }
(async () => {
  for (const p of ["/health","/version","/sovereignty","/runtime","/evidence/latest"]) {
    const {r,b}=await j(p); if(!r.ok || !b.result) throw new Error(`${p} failed`);
  }
  const denied = await j("/canary/run",{method:"POST"});
  if (denied.r.status !== 403) throw new Error("canary deny check failed");
  const allowed = await j("/canary/run",{method:"POST",headers:{authorization:`Bearer ${token}`,"x-scopes":scope}});
  if (!allowed.r.ok) throw new Error("canary allow check failed");
  console.log("smoke: pass");
})().catch(e=>{ console.error("smoke: fail", e.message); process.exit(1); });
