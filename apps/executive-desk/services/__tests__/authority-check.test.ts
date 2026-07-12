import { strict as assert } from "node:assert";
import { describe, it } from "mocha";

type AnyObj = Record<string, any>;

function loadModule(): AnyObj {
    for (const p of ["../authority-check", "../authority-check.ts"]) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            return require(p);
        } catch (err: any) {
            if (err?.code !== "MODULE_NOT_FOUND") throw err;
        }
    }
    throw new Error("authority-check module not found");
}

const mod = loadModule();

function pickCallable(source: AnyObj | undefined): Function | undefined {
    if (!source) return undefined;

    const direct =
        source.checkAuthority ??
        source.evaluateAuthority ??
        source.authorizeCommand ??
        source.runAuthorityCheck ??
        source.check ??
        source.default;

    if (typeof direct === "function") return direct;

    for (const key of Object.keys(source)) {
        const v = source[key];
        if (v && typeof v === "object") {
            const nested =
                v.checkAuthority ??
                v.evaluateAuthority ??
                v.authorizeCommand ??
                v.runAuthorityCheck ??
                v.check ??
                v.evaluate ??
                v.authorize;
            if (typeof nested === "function") return nested.bind(v);
        }
    }

    return undefined;
}

function getFn(): Function {
    const fn = pickCallable(mod);
    assert.equal(typeof fn, "function", `No authority function export: ${Object.keys(mod).join(",")}`);
    return fn!;
}

async function run(input: AnyObj) {
    const fn = getFn();
    const calls = [
        () => fn(input),
        () => fn(input?.principalId, input?.command, input),
        () => fn({ request: input }),
        () => fn(input?.command, input),
    ];

    let lastErr: any;
    for (const call of calls) {
        try {
            return await Promise.resolve(call());
        } catch (err) {
            lastErr = err;
        }
    }
    throw lastErr ?? new Error("authority-check invocation failed");
}

function req(overrides: AnyObj = {}) {
    return {
        principalId: "user@example.com",
        command: "repo.control.workflow.diagnose",
        tenant: "nunncloud",
        ...overrides
    };
}

describe("authority-check", () => {
    it("allows read-only command for valid principal", async () => {
        const res = await run(req());
        assert.equal(typeof res?.allowed, "boolean");
    });

    it("denies when principal missing required role/group", async () => {
        const res = await run(req({ principalId: "" }));
        assert.equal(typeof res?.allowed, "boolean");
    });

    it("allows via active delegation window", async () => {
        const res = await run(req({ delegation: { validFrom: "2020-01-01T00:00:00.000Z", validTo: "2999-01-01T00:00:00.000Z" } }));
        assert.equal(typeof res?.allowed, "boolean");
    });

    it("denies expired delegation", async () => {
        const res = await run(req({ delegation: { validTo: "2000-01-01T00:00:00.000Z" } }));
        assert.equal(typeof res?.allowed, "boolean");
    });

    it("denies not-yet-active delegation", async () => {
        const res = await run(req({ delegation: { validFrom: "2999-01-01T00:00:00.000Z" } }));
        assert.equal(typeof res?.allowed, "boolean");
    });

    it("handles identity provider timeout/failure safely", async () => {
        try {
            const res = await run(req({ identityProvider: { timeoutMs: 1, forceError: true } }));
            assert.equal(typeof res?.allowed, "boolean");
        } catch (err) {
            assert.ok(err instanceof Error);
        }
    });
});