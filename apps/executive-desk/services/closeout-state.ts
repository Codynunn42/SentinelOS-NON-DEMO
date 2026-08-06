import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export type CadenceMode = 'daily' | 'weekly' | 'monthly';
export type Weekday =
    | 'sunday'
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday';

export interface CadenceConfig {
    mode: CadenceMode;
    weeklyDay: Weekday;
    monthlyDay: string;
}

export interface CloseoutState {
    principalId: string;
    cadence: CadenceConfig;
    gbpAttached: boolean;
    gbpReference: string;
    mobTemplateRequired: boolean;
    mobLastRunAt?: string;
    mobLastRunStatus?: 'not_run' | 'completed' | 'failed';
    updatedAt: string;
    updatedBy: string;
}

export interface MobTemplateRun {
    id: string;
    principalId: string;
    status: 'completed' | 'failed';
    notes?: string;
    timestamp: string;
    executor: string;
}

export interface UpdateCloseoutStateInput {
    cadence?: Partial<CadenceConfig>;
    gbpAttached?: boolean;
    gbpReference?: string;
    mobTemplateRequired?: boolean;
}

export interface RecordMobRunInput {
    principalId: string;
    executor: string;
    status: 'completed' | 'failed';
    notes?: string;
}

interface ICloseoutStateStore {
    initialize?(): Promise<void>;
    getState(principalId: string): Promise<CloseoutState>;
    updateState(
        principalId: string,
        updates: UpdateCloseoutStateInput,
        updatedBy: string,
    ): Promise<CloseoutState>;
    listMobRuns(principalId: string, limit?: number): Promise<MobTemplateRun[]>;
    recordMobRun(input: RecordMobRunInput): Promise<MobTemplateRun>;
}

interface FileStatePayload {
    states: Record<string, CloseoutState>;
    mobRuns: Record<string, MobTemplateRun[]>;
}

function defaultState(principalId: string): CloseoutState {
    return {
        principalId,
        cadence: {
            mode: 'daily',
            weeklyDay: 'sunday',
            monthlyDay: '1',
        },
        gbpAttached: false,
        gbpReference: '',
        mobTemplateRequired: true,
        mobLastRunStatus: 'not_run',
        updatedAt: new Date().toISOString(),
        updatedBy: principalId,
    };
}

class InMemoryCloseoutStateStore implements ICloseoutStateStore {
    private states = new Map<string, CloseoutState>();
    private runs = new Map<string, MobTemplateRun[]>();

    async getState(principalId: string): Promise<CloseoutState> {
        if (!this.states.has(principalId)) {
            this.states.set(principalId, defaultState(principalId));
        }
        return this.states.get(principalId)!;
    }

    async updateState(
        principalId: string,
        updates: UpdateCloseoutStateInput,
        updatedBy: string,
    ): Promise<CloseoutState> {
        const current = await this.getState(principalId);
        const next: CloseoutState = {
            ...current,
            cadence: {
                ...current.cadence,
                ...updates.cadence,
            },
            gbpAttached: updates.gbpAttached ?? current.gbpAttached,
            gbpReference:
                typeof updates.gbpReference === 'string'
                    ? updates.gbpReference
                    : current.gbpReference,
            mobTemplateRequired:
                updates.mobTemplateRequired ?? current.mobTemplateRequired,
            updatedAt: new Date().toISOString(),
            updatedBy,
        };
        this.states.set(principalId, next);
        return next;
    }

    async listMobRuns(principalId: string, limit: number = 10): Promise<MobTemplateRun[]> {
        const rows = this.runs.get(principalId) || [];
        return rows.slice(0, Math.max(1, Math.min(limit, 100)));
    }

    async recordMobRun(input: RecordMobRunInput): Promise<MobTemplateRun> {
        const run: MobTemplateRun = {
            id: randomUUID(),
            principalId: input.principalId,
            status: input.status,
            notes: input.notes,
            timestamp: new Date().toISOString(),
            executor: input.executor,
        };

        const existing = this.runs.get(input.principalId) || [];
        existing.unshift(run);
        this.runs.set(input.principalId, existing.slice(0, 100));

        const current = await this.getState(input.principalId);
        this.states.set(input.principalId, {
            ...current,
            mobLastRunAt: run.timestamp,
            mobLastRunStatus: run.status,
            updatedAt: run.timestamp,
            updatedBy: input.executor,
        });

        return run;
    }
}

class FileCloseoutStateStore implements ICloseoutStateStore {
    private filePath: string;

    constructor(dataDir: string = '.data') {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        this.filePath = path.join(dataDir, 'closeout-state.json');
    }

    async initialize(): Promise<void> {
        if (!fs.existsSync(this.filePath)) {
            this.writePayload({ states: {}, mobRuns: {} });
        }
    }

    async getState(principalId: string): Promise<CloseoutState> {
        const payload = this.readPayload();
        if (!payload.states[principalId]) {
            payload.states[principalId] = defaultState(principalId);
            this.writePayload(payload);
        }
        return payload.states[principalId];
    }

    async updateState(
        principalId: string,
        updates: UpdateCloseoutStateInput,
        updatedBy: string,
    ): Promise<CloseoutState> {
        const payload = this.readPayload();
        const current = payload.states[principalId] || defaultState(principalId);
        const next: CloseoutState = {
            ...current,
            cadence: {
                ...current.cadence,
                ...updates.cadence,
            },
            gbpAttached: updates.gbpAttached ?? current.gbpAttached,
            gbpReference:
                typeof updates.gbpReference === 'string'
                    ? updates.gbpReference
                    : current.gbpReference,
            mobTemplateRequired:
                updates.mobTemplateRequired ?? current.mobTemplateRequired,
            updatedAt: new Date().toISOString(),
            updatedBy,
        };

        payload.states[principalId] = next;
        this.writePayload(payload);
        return next;
    }

    async listMobRuns(principalId: string, limit: number = 10): Promise<MobTemplateRun[]> {
        const payload = this.readPayload();
        const rows = payload.mobRuns[principalId] || [];
        return rows.slice(0, Math.max(1, Math.min(limit, 100)));
    }

    async recordMobRun(input: RecordMobRunInput): Promise<MobTemplateRun> {
        const payload = this.readPayload();
        const run: MobTemplateRun = {
            id: randomUUID(),
            principalId: input.principalId,
            status: input.status,
            notes: input.notes,
            timestamp: new Date().toISOString(),
            executor: input.executor,
        };

        const existing = payload.mobRuns[input.principalId] || [];
        payload.mobRuns[input.principalId] = [run, ...existing].slice(0, 100);

        const current = payload.states[input.principalId] || defaultState(input.principalId);
        payload.states[input.principalId] = {
            ...current,
            mobLastRunAt: run.timestamp,
            mobLastRunStatus: run.status,
            updatedAt: run.timestamp,
            updatedBy: input.executor,
        };

        this.writePayload(payload);
        return run;
    }

    private readPayload(): FileStatePayload {
        if (!fs.existsSync(this.filePath)) {
            return { states: {}, mobRuns: {} };
        }

        try {
            const raw = fs.readFileSync(this.filePath, 'utf8').trim();
            if (!raw) return { states: {}, mobRuns: {} };
            const parsed = JSON.parse(raw);
            return {
                states: parsed.states || {},
                mobRuns: parsed.mobRuns || {},
            };
        } catch {
            return { states: {}, mobRuns: {} };
        }
    }

    private writePayload(payload: FileStatePayload): void {
        fs.writeFileSync(this.filePath, JSON.stringify(payload, null, 2));
    }
}

class CloseoutStateService {
    constructor(private readonly store: ICloseoutStateStore) { }

    async getState(principalId: string): Promise<CloseoutState> {
        return this.store.getState(principalId);
    }

    async updateState(
        principalId: string,
        updates: UpdateCloseoutStateInput,
        updatedBy: string,
    ): Promise<CloseoutState> {
        return this.store.updateState(principalId, updates, updatedBy);
    }

    async listMobRuns(principalId: string, limit: number = 10): Promise<MobTemplateRun[]> {
        return this.store.listMobRuns(principalId, limit);
    }

    async recordMobRun(input: RecordMobRunInput): Promise<MobTemplateRun> {
        return this.store.recordMobRun(input);
    }
}

async function createStore(): Promise<ICloseoutStateStore> {
    const backend = process.env.CLOSEOUT_STATE_BACKEND || 'file';
    const dataDir = process.env.CLOSEOUT_STATE_DATA_DIR || '.data';
    const store: ICloseoutStateStore =
        backend === 'memory' ? new InMemoryCloseoutStateStore() : new FileCloseoutStateStore(dataDir);

    if (store.initialize) {
        await store.initialize();
    }
    return store;
}

let closeoutServicePromise: Promise<CloseoutStateService> | null = null;

export async function getCloseoutStateService(): Promise<CloseoutStateService> {
    if (!closeoutServicePromise) {
        closeoutServicePromise = createStore().then((store) => new CloseoutStateService(store));
    }
    return closeoutServicePromise;
}

export function resetCloseoutStateService(): void {
    closeoutServicePromise = null;
}
