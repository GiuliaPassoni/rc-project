import { pool } from './db/client';
import type { CellState, EventType } from './types';

// Derived directly from machine.ts — maps current state to valid [eventType, stateAfter] pairs
const transitions: Record<CellState, [EventType, CellState][]> = {
  IDLE:        [['cycle_start', 'RUNNING'], ['fault', 'FAULT'], ['power_off', 'OFFLINE']],
  RUNNING:     [['cycle_end', 'IDLE'], ['fault', 'FAULT'], ['power_off', 'OFFLINE']],
  FAULT:       [['maintenance_start', 'MAINTENANCE'], ['power_off', 'OFFLINE']],
  MAINTENANCE: [['maintenance_end', 'IDLE'], ['power_off', 'OFFLINE']],
  OFFLINE:     [['power_on', 'IDLE']],
  UNKNOWN:     [['cycle_start', 'RUNNING'], ['cycle_end', 'IDLE'], ['fault', 'FAULT'], ['maintenance_start', 'MAINTENANCE']],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function emitEvent(): Promise<void> {
  const cellIdsResult = await pool.query<{ cell_id: string }>(
    'SELECT DISTINCT cell_id FROM events',
  );
  if (cellIdsResult.rows.length === 0) {
    console.warn('[simulate] No cells found — skipping tick');
    return;
  }

  const cellId = pick(cellIdsResult.rows).cell_id;

  const stateResult = await pool.query<{ state_after: CellState }>(
    'SELECT state_after FROM events WHERE cell_id = $1 ORDER BY timestamp DESC LIMIT 1',
    [cellId],
  );
  const currentState: CellState = stateResult.rows[0]?.state_after ?? 'IDLE';

  const options = transitions[currentState];
  if (!options || options.length === 0) {
    console.warn(`[simulate] No transitions defined for state ${currentState} — skipping`);
    return;
  }

  const [eventType, stateAfter] = pick(options);
  const timestamp = new Date();
  const id = `${cellId}-${timestamp.toISOString()}-${eventType}`;

  await pool.query(
    `INSERT INTO events (id, cell_id, timestamp, event_type, state_after, payload, raw)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO NOTHING`,
    [id, cellId, timestamp, eventType, stateAfter, {}, { simulated: true }],
  );

  console.log(`[simulate] ${cellId} ${currentState} → ${eventType} → ${stateAfter}`);
}

setInterval(() => {
  emitEvent().catch((err) => console.error('[simulate] Error:', err));
}, 5000);

console.log('[simulate] Running — emitting events every 5s. Ctrl+C to stop.');
