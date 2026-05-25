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

// normaliser produces NormalisedEvent
export type NormalisedEvent = {
  id: string; // deduplication key - cellId + timestamp + eventType
  cellId: string;
  timestamp: Date; // normalised to UTC
  eventType: EventType;
  payload: Record<string, unknown>;
  raw: unknown; // original event, kept for auditing
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

// ingest fn produces PersistedEvent.
export type PersistedEvent = NormalisedEvent & {
  stateAfter: CellState; // stateAfter is only written by ingest, since it's derived from FSM.
};
