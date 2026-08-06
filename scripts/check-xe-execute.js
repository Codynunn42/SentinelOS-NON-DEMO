#!/usr/bin/env node

const assert = require('assert');

const TEST_KEY = 'xe-execute-secret';

process.env.SENTINEL_API_KEY = TEST_KEY;
process.env.SENTINEL_HMAC_SECRET = process.env.SENTINEL_HMAC_SECRET || 'xe-execute-passport-secret';
process.env.SENTINEL_API_KEY_TENANT = 'ownerfi';
process.env.SENTINEL_API_KEY_ACTOR = 'xe-execute@nunncloud.local';
process.env.SENTINEL_API_KEY_ROLE = 'approver';
process.env.SENTINEL_API_KEY_SCOPES = 'task:orchestrate,task:read,task:execute';

const { server } = require('../apps/api/server');

function listen() {
    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => resolve(server.address().port));
    });
}

async function main() {
    const port = await listen();
    const base = `http://127.0.0.1:${port}`;

    try {
        const initResponse = await fetch(`${base}/v1/workflow/init`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': TEST_KEY,
            },
            body: JSON.stringify({
                tenant: 'ownerfi',
                createApprovals: false,
                tasks: [
                    {
                        id: 'task_xe_execute',
                        title: 'Execute xe governed change for api control',
                        category: 'xe_assistance',
                        source: 'apps/api/server.js',
                        xeRequired: true,
                        target: 'apps/api/server.js',
                        nextStep: 'Execute governed XE stage after intent is recorded.'
                    }
                ]
            })
        });
        const initBody = await initResponse.json();

        assert.strictEqual(initResponse.status, 200);
        const runId = initBody.runId || initBody.executionSession;
        assert.ok(runId);

        const packetResponse = await fetch(`${base}/task-templates/runs/${encodeURIComponent(runId)}/steps/task_xe_execute/xe-packet`, {
            headers: {
                'x-api-key': TEST_KEY,
            }
        });
        const packetBody = await packetResponse.json();

        assert.strictEqual(packetResponse.status, 200);
        assert.strictEqual(packetBody.status, 'ok');
        assert.strictEqual(packetBody.taskId, 'task_xe_execute');

        const intentResponse = await fetch(`${base}/task-templates/runs/${encodeURIComponent(runId)}/steps/task_xe_execute/xe-intent`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': TEST_KEY,
            },
            body: JSON.stringify({
                operation: 'change',
                xeChangePacket: packetBody.xeChangePacket,
            })
        });
        const intentBody = await intentResponse.json();

        assert.strictEqual(intentResponse.status, 202);
        assert.strictEqual(intentBody.xeIntent.status, 'INTENT_RECORDED');
        assert.ok(intentBody.xeIntent.auditReference);

        const executeResponse = await fetch(`${base}/task-templates/runs/${encodeURIComponent(runId)}/steps/task_xe_execute/xe-execute`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': TEST_KEY,
            },
            body: JSON.stringify({
                packetId: packetBody.xeChangePacket.packetId,
                operation: 'change',
                intentAuditReference: intentBody.xeIntent.auditReference,
            })
        });
        const executeBody = await executeResponse.json();

        assert.strictEqual(executeResponse.status, 200);
        assert.strictEqual(executeBody.status, 'executed');
        assert.strictEqual(executeBody.taskId, 'task_xe_execute');
        assert.strictEqual(executeBody.packetId, packetBody.xeChangePacket.packetId);
        assert.strictEqual(executeBody.xeExecution.status, 'EXECUTED');
        assert.strictEqual(executeBody.xeExecutionEnvelope.executionStatus, 'EXECUTED');
        assert.strictEqual(executeBody.xeExecutionEnvelope.packetId, packetBody.xeChangePacket.packetId);
        assert.deepStrictEqual(
            executeBody.xeExecutionEnvelope.stageResults.map((stage) => stage.stage),
            ['scan', 'fix', 'set']
        );
        assert.deepStrictEqual(
            executeBody.xeExecutionEnvelope.stageResults.map((stage) => stage.status),
            ['executed', 'executed', 'executed']
        );
        assert.ok(executeBody.xeExecution.auditReference);
        assert.ok(executeBody.xeExecution.auditHash);

        console.log(JSON.stringify({
            status: 'xe-execute-check-passed',
            runId,
            taskId: executeBody.taskId,
            packetId: executeBody.packetId,
            intentAuditReference: intentBody.xeIntent.auditReference,
            executionId: executeBody.xeExecutionEnvelope.executionId,
            executionAuditReference: executeBody.xeExecution.auditReference,
        }, null, 2));
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
