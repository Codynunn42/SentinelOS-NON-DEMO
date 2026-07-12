#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const { mkdirSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const mode = process.argv.includes("--fast") ? "fast" : "full";

const suites = {
    fast: [
        "check:executive-desk:types",
        "check:executive-desk:api",
        "check:executive-desk:proxy",
        "check:executive-desk:frontend",
        "test"
    ],
    full: [
        "check:executive-desk:types",
        "check:executive-desk:api",
        "check:executive-desk:proxy",
        "check:executive-desk:frontend",
        "check:executive-desk:e2e",
        "test",
        "test:coverage",
        "test:coverage:check"
    ]
};

const selected = suites[mode];
const startedAt = new Date().toISOString();
const results = [];

for (const script of selected) {
    const t0 = Date.now();
    const res = spawnSync("pnpm", ["run", script], { stdio: "inherit", shell: true });
    results.push({ script, ok: res.status === 0, durationMs: Date.now() - t0 });
    if (res.status !== 0) break;
}

const passed = results.every(r => r.ok) && results.length === selected.length;
const finishedAt = new Date().toISOString();

mkdirSync(join(process.cwd(), "artifacts"), { recursive: true });
writeFileSync(
    join(process.cwd(), "artifacts", `sentinel-ai-package-${mode}.json`),
    JSON.stringify({ mode, startedAt, finishedAt, passed, results }, null, 2)
);

process.exit(passed ? 0 : 1);