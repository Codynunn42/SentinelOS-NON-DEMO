/**
 * Command Handler Test & Example
 * 
 * Usage:
 * npm run test:handler
 * 
 * or directly:
 * npx ts-node apps/executive-desk/proxy/test-handler.ts
 */

import { handleCommand, ProxyCommandRequest, ProxyCommandResponse } from './command-handler';

async function testHandler() {
    console.log('=== Executive Desk v1 Command Handler Test ===\n');

    // Test 1: Valid read-only diagnosis command
    console.log('Test 1: Valid read-only diagnosis command');
    console.log('-------------------------------------------\n');

    const validRequest: ProxyCommandRequest = {
        tenant: 'nunncloud',
        command: 'repo.control.workflow.diagnose',
        payload: {
            principalId: 'user@example.com',
            repository: 'Codynunn42/SentinelOS-NON-DEMO',
            workflowName: 'Sentinel Actions Diagnostic',
            runId: '12345',
        },
    };

    console.log('Request:');
    console.log(JSON.stringify(validRequest, null, 2));
    console.log();

    const validResponse = await handleCommand(validRequest);
    console.log('Response:');
    console.log(JSON.stringify(validResponse, null, 2));
    console.log();

    // Test 2: Invalid tenant
    console.log('\nTest 2: Invalid tenant');
    console.log('-------------------------------------------\n');

    const invalidTenantRequest: ProxyCommandRequest = {
        tenant: 'invalid-tenant',
        command: 'repo.control.workflow.diagnose',
        payload: {
            principalId: 'user@example.com',
            repository: 'Codynunn42/SentinelOS-NON-DEMO',
            workflowName: 'Sentinel Actions Diagnostic',
        },
    };

    console.log('Request:');
    console.log(JSON.stringify(invalidTenantRequest, null, 2));
    console.log();

    const invalidTenantResponse = await handleCommand(invalidTenantRequest);
    console.log('Response:');
    console.log(JSON.stringify(invalidTenantResponse, null, 2));
    console.log();

    // Test 3: Missing principalId
    console.log('\nTest 3: Missing principalId');
    console.log('-------------------------------------------\n');

    const missingPrincipalRequest: ProxyCommandRequest = {
        tenant: 'nunncloud',
        command: 'repo.control.workflow.diagnose',
        payload: {
            principalId: '',
            repository: 'Codynunn42/SentinelOS-NON-DEMO',
            workflowName: 'Sentinel Actions Diagnostic',
        },
    };

    console.log('Request:');
    console.log(JSON.stringify(missingPrincipalRequest, null, 2));
    console.log();

    const missingPrincipalResponse = await handleCommand(missingPrincipalRequest);
    console.log('Response:');
    console.log(JSON.stringify(missingPrincipalResponse, null, 2));
    console.log();

    // Test 4: Unsupported command
    console.log('\nTest 4: Unsupported command');
    console.log('-------------------------------------------\n');

    const unsupportedRequest: ProxyCommandRequest = {
        tenant: 'nunncloud',
        command: 'exec.deploy.toggle' as any, // Not yet supported
        payload: {
            principalId: 'user@example.com',
            resource: 'prod/deployment/feature-x',
        },
    };

    console.log('Request:');
    console.log(JSON.stringify(unsupportedRequest, null, 2));
    console.log();

    const unsupportedResponse = await handleCommand(unsupportedRequest);
    console.log('Response:');
    console.log(JSON.stringify(unsupportedResponse, null, 2));
    console.log();

    // Summary
    console.log('\n=== Test Summary ===\n');
    console.log('Test 1 (Valid):', validResponse.status === 'executed' ? '✓ PASS' : '✗ FAIL');
    console.log('Test 2 (Invalid tenant):', invalidTenantResponse.status === 'blocked' ? '✓ PASS' : '✗ FAIL');
    console.log('Test 3 (Missing principal):', missingPrincipalResponse.status === 'blocked' ? '✓ PASS' : '✗ FAIL');
    console.log('Test 4 (Unsupported command):', unsupportedResponse.status === 'blocked' ? '✓ PASS' : '✗ FAIL');
    console.log();
}

testHandler().catch(console.error);
