import { handleCustomerOps } from './customerops';

interface Envelope {
    command: string;
    payload: any;
    metadata?: { actor: string };
    tenant?: string;
}

interface Context {
    tenant?: string;
    principal?: { actor: string };
    buildReceipt: (event: string, entity: any, data: any, tenant: string) => any;
    emitSecurityEvent: (event: string, data: any) => void;
}

export async function routeCommand(envelope: Envelope, context: Context = {}) {
    if (envelope.command.startsWith('support.')) {
        return handleCustomerOps(envelope, context);
    }

    // Add other routing logic here

    return {
        success: false,
        statusCode: 400,
        error: `Unknown command: ${envelope.command}`
    };
}