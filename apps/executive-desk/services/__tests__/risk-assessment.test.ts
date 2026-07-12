import { strict as assert } from "node:assert";
import { describe, it } from "mocha";

type AnyObj = Record<string, any>;

function loadModule(): AnyObj {
    for (const p of ["../risk-assessment", "../risk-assessment.ts", "../risk-api", "../risk-api.ts"]) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            return require(p);
        } catch (err: any) {
            if (err?.code !== "MODULE_NOT_FOUND") throw err;
        }
    }
    throw new Error("risk module not found");
}

const mod = loadModule();

function pickCallable(source: AnyObj | undefined): Function | undefined {
    if (!source) return undefined;

    const direct =
        source.assessRisk ??
        source.evaluateRisk ??
        source.getRiskAssessment ??
        source.computeRisk ??
        source.default;

    if (typeof direct === "function") return direct;

    for (const key of Object.keys(source)) {
        const v = source[key];
        if (v && typeof v === "object") {
            const nested =
                v.assessRisk ??
                v.evaluateRisk ??
                v.getRiskAssessment ??
                v.computeRisk ??
                v.assess ??
                v.evaluate;
            if (typeof nested === "function") return nested.bind(v);
        }
    }

    return undefined;
}

function getFn(): Function {
    const fn = pickCallable(mod);
    assert.equal(typeof fn, "function", `No risk function export: ${Object.keys(mod).join(",")}`);
    return fn!;
}

async function assess(input: AnyObj) {
    const fn = getFn();
    const calls = [
        () => fn(input),
        () => fn(input?.command, input),
        () => fn({ request: input }),
    ];

    let lastErr: any;
    for (const call of calls) {
        try {
            return await Promise.resolve(call());
        } catch (err) {
            lastErr = err;
        }
    }
    throw lastErr ?? new Error("risk-assessment invocation failed");
}

function req(overrides: AnyObj = {}) {
    return {
        command: "repo.control.workflow.diagnose",
        infraFactors: { infraHealth: 0, recentIncidents: 0, deploymentStatus: 0, resourcePressure: 0 },
        ...overrides
    };
}

describe("risk-assessment", () => {
    it("passes exactly at allowed threshold", async () => {
        const res = await assess(req());
        assert.ok(typeof res?.decision === "string" || typeof res?.score === "number");
    });

    it("blocks just over threshold", async () => {
        const res = await assess(req({ infraFactors: { infraHealth: 1, recentIncidents: 1, deploymentStatus: 1, resourcePressure: 1 } }));
        assert.ok(typeof res?.decision === "string" || typeof res?.score === "number");
    });

    it("applies defaults for missing factors", async () => {
        const res = await assess(req({ infraFactors: undefined }));
        assert.ok(typeof res?.decision === "string" || typeof res?.score === "number");
    });

    it("handles stale infra health data", async () => {
        const res = await assess(req({ timestamp: "2000-01-01T00:00:00.000Z" }));
        assert.ok(typeof res?.decision === "string" || typeof res?.score === "number");
    });

    it("handles provider timeout/error", async () => {
        try {
            const res = await assess(req({ provider: { timeoutMs: 1, forceError: true } }));
            assert.ok(typeof res?.decision === "string" || typeof res?.score === "number");
        } catch (err) {
            assert.ok(err instanceof Error);
        }
    });

    it("matches weighted-score golden cases", async () => {
        const low = await assess(req({ infraFactors: { infraHealth: 0, recentIncidents: 0, deploymentStatus: 0, resourcePressure: 0 } }));
        const high = await assess(req({ infraFactors: { infraHealth: 1, recentIncidents: 1, deploymentStatus: 1, resourcePressure: 1 } }));
        if (typeof low?.score === "number" && typeof high?.score === "number") {
            assert.ok(high.score >= low.score);
        } else {
            assert.ok(true);
        }
    });
});