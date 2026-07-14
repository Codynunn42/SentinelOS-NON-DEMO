import {
    CadenceMode,
    getCloseoutStateService,
    UpdateCloseoutStateInput,
    Weekday,
} from '../services/closeout-state';

const VALID_MODES = new Set(['daily', 'weekly', 'monthly']);
const VALID_WEEKDAYS = new Set([
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
]);

function parseMonthlyDay(value: unknown): string | undefined {
    if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 31) {
        return String(value);
    }
    if (typeof value !== 'string') return undefined;
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n < 1 || n > 31) return undefined;
    return String(n);
}

export function validateCloseoutUpdate(body: unknown): UpdateCloseoutStateInput {
    if (!body || typeof body !== 'object') {
        throw new Error('Request body must be an object');
    }

    const payload = body as Record<string, unknown>;
    const updates: UpdateCloseoutStateInput = {};

    if (payload.cadence !== undefined) {
        if (!payload.cadence || typeof payload.cadence !== 'object') {
            throw new Error('cadence must be an object');
        }

        const cadence = payload.cadence as Record<string, unknown>;
        updates.cadence = {};

        if (cadence.mode !== undefined) {
            const mode = String(cadence.mode).toLowerCase();
            if (!VALID_MODES.has(mode)) {
                throw new Error('cadence.mode must be daily, weekly, or monthly');
            }
            updates.cadence.mode = mode as CadenceMode;
        }

        if (cadence.weeklyDay !== undefined) {
            const weeklyDay = String(cadence.weeklyDay).toLowerCase();
            if (!VALID_WEEKDAYS.has(weeklyDay)) {
                throw new Error('cadence.weeklyDay must be a valid weekday');
            }
            updates.cadence.weeklyDay = weeklyDay as Weekday;
        }

        if (cadence.monthlyDay !== undefined) {
            const day = parseMonthlyDay(cadence.monthlyDay);
            if (!day) {
                throw new Error('cadence.monthlyDay must be a day between 1 and 31');
            }
            updates.cadence.monthlyDay = day;
        }
    }

    if (payload.gbpAttached !== undefined) {
        if (typeof payload.gbpAttached !== 'boolean') {
            throw new Error('gbpAttached must be boolean');
        }
        updates.gbpAttached = payload.gbpAttached;
    }

    if (payload.gbpReference !== undefined) {
        if (typeof payload.gbpReference !== 'string') {
            throw new Error('gbpReference must be string');
        }
        updates.gbpReference = payload.gbpReference.slice(0, 256);
    }

    if (payload.mobTemplateRequired !== undefined) {
        if (typeof payload.mobTemplateRequired !== 'boolean') {
            throw new Error('mobTemplateRequired must be boolean');
        }
        updates.mobTemplateRequired = payload.mobTemplateRequired;
    }

    return updates;
}

export async function getCloseoutState(principalId: string) {
    const service = await getCloseoutStateService();
    return service.getState(principalId);
}

export async function saveCloseoutState(
    principalId: string,
    updates: UpdateCloseoutStateInput,
    updatedBy: string,
) {
    const service = await getCloseoutStateService();
    return service.updateState(principalId, updates, updatedBy);
}

export async function getMobRuns(principalId: string, limit: number) {
    const service = await getCloseoutStateService();
    return service.listMobRuns(principalId, limit);
}

export async function recordMobRun(
    principalId: string,
    executor: string,
    status: 'completed' | 'failed',
    notes?: string,
) {
    const service = await getCloseoutStateService();
    return service.recordMobRun({ principalId, executor, status, notes });
}
