import { pool } from '../db/client';
import { DataQualityIssue, NormalisedEvent, PersistedEvent } from '../types';

/*
 * Database writing utils
 * */
export async function insertEvent(event: PersistedEvent): Promise<void> {
  await pool.query(
    `INSERT INTO events (id, cell_id, timestamp, event_type, state_after, payload, raw)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO NOTHING`, // known limitation: silently ignore duplicates
    [
      event.id,
      event.cellId,
      event.timestamp,
      event.eventType,
      event.stateAfter,
      JSON.stringify(event.payload),
      JSON.stringify(event.raw),
    ],
  );
}

export async function insertIssue(issue: DataQualityIssue): Promise<void> {
  await pool.query(
    `INSERT INTO data_quality_log (cell_id, reason, raw)
     VALUES ($1, $2, $3)`,
    [issue.cellId, issue.reason, JSON.stringify(issue.raw)],
  );
}

/*
 * Grouping util
 * */
export function groupByCellId(
  events: NormalisedEvent[],
): Record<string, NormalisedEvent[]> {
  return events.reduce<Record<string, NormalisedEvent[]>>((acc, event) => {
    if (!acc[event.cellId]) acc[event.cellId] = [];
    acc[event.cellId].push(event);
    return acc;
  }, {});
}
