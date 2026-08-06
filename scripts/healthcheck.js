const urls = ["http://127.0.0.1:3000/health", "http://localhost:3000/health"];
const attempts = 60;
const delayMs = 1000;

async function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function check(url){
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
}

(async () => {
  for (let i = 1; i <= attempts; i++) {
    for (const url of urls) {
      try { await check(url); console.log(`Health OK: ${url}`); process.exit(0); }
      catch (e) { if (i === attempts) console.error(`Final fail: ${e.message}`); }
    }
    await sleep(delayMs);
  }
  process.exit(1);
})();
