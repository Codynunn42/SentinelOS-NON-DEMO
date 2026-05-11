import { customerOpsPlane } from '../planes/customerops';

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

export async function handleCustomerOps(envelope: Envelope, context: Context = {}) {
    const handler = customerOpsPlane.handlers[envelope.command];

    if (!handler) {
        return {
            success: false,
            statusCode: 400,
            error: `Unknown customer operations command: ${envelope.command}`
        };
    }

    return handler(envelope.payload, context, envelope);
}