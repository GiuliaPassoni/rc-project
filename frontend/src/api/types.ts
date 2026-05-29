// Telemetry-related types

export type EventType =
    | 'cycle_start'
    | 'cycle_end'
    | 'fault'
    | 'maintenance_start'
    | 'maintenance_end'
    | 'power_off'
    | 'power_on'
    | 'unknown'; // real unrecognised event, FSM rejects it, written to data_quality_log

export type CellState =
    | 'OFFLINE'
    | 'IDLE'
    | 'RUNNING'
    | 'FAULT'
    | 'MAINTENANCE'
    | 'UNKNOWN';

// Normaliser types
// normaliser produces NormalisedEvent
export type NormalisedEvent = {
    id: string;
    cellId: string;
    timestamp: Date;
    eventType: EventType;
    payload: Record<string, unknown>;
    raw: unknown;
};

// for logs
export type DataQualityIssue = {
    cellId: string | null;
    reason: string;
    raw: unknown;
};

export type NormaliseResult = {
    events: NormalisedEvent[];
    issues: DataQualityIssue[];
};

// Ingest types
// ingest fn produces PersistedEvent.
export type PersistedEvent = NormalisedEvent & {
    stateAfter: CellState; // stateAfter is only written by ingest, since it's derived from FSM.
};

// Metrics types

export type DurationMetrics = {
    uptime_s: number;
    downtime_s: number;
    idle_time_s: number;
    offline_time_s: number;
    unaccounted_time_s: number;
};

export type CycleMetrics = {
    cycle_count: number;
    mean_cycle_s: number | null; // null if no complete cycles in window
};

export type ThroughputBucket = {
    hour: Date;
    count: number;
};

export type FaultRateBucket = {
    hour: Date;
    count: number;
};

export type CellMetrics = DurationMetrics &
    CycleMetrics & {
    throughput: ThroughputBucket[];
    fault_rate: FaultRateBucket[];
    window_start: Date;
    window_end: Date;
};

export type TimeWindow = '24h' | '7d' | '30d';

// Summary of cells statuses (for api query)
export type CellStatus = {
    cellId: string;
    state: CellState;
    since: Date;
};

// DTOs and APIs
export interface StatusSummaryApiDTO {
    RUNNING: number;
    IDLE: number;
    FAULT: number;
    MAINTENANCE: number;
    OFFLINE: number;
    UNKNOWN: number;
}

export interface FleetSummaryProps {
    running: number,
    idle: number,
    fault: number,
    maintenance: number,
    offline: number,
    unknown: number,
}

export interface CellEventDTO {
    id: string;
    cell_id: string;
    timestamp: string; // ISO format string
    event_type: string;
    state_after: string;
    raw?: string;
    payload: Record<string, any> | string | null;
}

export interface CellEventApiDTO extends CellEventDTO {
    events: CellEventDTO[];
    totalCount: number;
}