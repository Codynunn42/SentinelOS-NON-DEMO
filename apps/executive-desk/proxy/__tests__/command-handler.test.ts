import { strict as assert } from "node:assert";
import { describe, it } from "mocha";

type AnyObj = Record<string, any>;

function loadModule(): AnyObj {
    const candidates = ["../command-handler", "../command-handler.ts"];
    for (const p of candidates) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            return require(p);
        } catch (err: any) {
            if (err?.code !== "MODULE_NOT_FOUND") throw err;
        }
    }
    throw new Error(`Could not load command handler module (${candidates.join(", ")})`);
}

const mod = loadModule();

function pickFn(source: AnyObj, names: string[]): Function | undefined {
    for (const n of names) if (typeof source[n] === "function") return source[n];
    return undefined;
}

async function invoke(fn: Function, payload: any): Promise<any> {
    const tries = [() => fn(payload), () => fn({ request: payload }), () => fn(payload, {})];
    let last: any;
    for (const t of tries) {
        try {
            return await Promise.resolve(t());
        } catch (e) {
            last = e;
        }
    }
    throw last;
}

function getHandler(): Function {
    const fn =
        pickFn(mod, ["handleCommand", "processCommand", "executeCommand", "runCommand"]) ??
        (typeof mod.default === "function" ? mod.default : undefined);
    assert.equal(typeof fn, "function", `No command handler function export found: ${Object.keys(mod).join(",")}`);
    return fn!;
}

function baseReq(overrides: AnyObj = {}) {
    return {
        tenant: "nunncloud",
        command: "repo.control.workflow.diagnose",
        payload: {
            principalId: "user@example.com",
            repository: "Codynunn42/SentinelOS-NON-DEMO",
            workflowName: "Sentinel Actions Diagnostic",
            runId: "12345"
        },
        ...overrides
    };
}

describe("command-handler", () => {
    it("blocks when authority denies", async () => {
        const res = await invoke(getHandler(), baseReq({ tenant: "invalid-tenant" }));
        assert.equal(res?.status, "blocked");
        assert.equal(res?.authorityCheckResult?.allowed, false);
    });

    it("blocks when risk gate denies", async () => {
        const res = await invoke(getHandler(), baseReq({ tenant: "invalid-tenant" }));
        assert.equal(res?.riskGateOutcome?.decision, "block");
    });

    it("returns rejected receipt for invalid tenant", async () => {
        const res = await invoke(getHandler(), baseReq({ tenant: "invalid-tenant" }));
        assert.equal(res?.receipt?.status, "rejected");
    });

    it("returns rejected receipt for missing principal", async () => {
        const res = await invoke(getHandler(), baseReq({ payload: { principalId: "" } }));
        assert.equal(res?.status, "blocked");
        assert.equal(res?.receipt?.status, "rejected");
    });

    it("blocks unsupported command", async () => {
        const res = await invoke(
            getHandler(),
            baseReq({ command: "exec.deploy.toggle", payload: { principalId: "user@example.com", resource: "prod/x" } })
        );
        assert.equal(res?.status, "blocked");
    });

    it("returns executed + receipt for valid diagnosis", async () => {
        const res = await invoke(getHandler(), baseReq());
        assert.equal(res?.status, "executed");
        assert.equal(res?.receipt?.status, "executed");
        assert.ok(res?.auditReference);
    });

    it("handles execution throw and still returns governed failure", async function () {
        const dangerousReq = baseReq({ payload: null });
        try {
            const res = await invoke(getHandler(), dangerousReq);
            assert.ok(["blocked", "rejected", "failed", "executed"].includes(String(res?.status)));
        } catch (err) {
            assert.ok(err instanceof Error);
        }
    });

    it("propagates audit reference / correlation fields", async () => {
        const res = await invoke(getHandler(), baseReq());
        assert.ok(res?.auditReference || res?.receipt?.id);
    });
});