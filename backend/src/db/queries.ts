import { CellState, CellStatus, PersistedEvent } from '../types';
import { pool } from './client';

// Returns all cell IDs present in the events table
export async function getCellIds(): Promise<string[]> {
  try {
    const result = await pool.query('SELECT DISTINCT cell_id FROM events');
    return result.rows.map((row) => row.cell_id);
  } catch (error) {
    throw new Error('Failed to fetch cell IDs');
  }
}

// Returns the most recent stateAfter per cell, with timestamp
export async function getCellsStatus(): Promise<CellStatus[]> {
  try {
    const query = `
      SELECT DISTINCT ON (cell_id) cell_id, state_after, timestamp
      FROM events
      ORDER BY cell_id, timestamp DESC
    `;
    const result = await pool.query(query);
    return result.rows.map((row) => ({
      cellId: row.cell_id,
      state: row.state_after as CellState,
      since: new Date(row.timestamp),
    }));
  } catch (error) {
    throw new Error('Failed to fetch cell states');
  }
}

// Returns the most recent event before windowStart for a given cell
export async function getPriorEvent(
  cellId: string,
  windowStart: Date,
): Promise<PersistedEvent | null> {
  try {
    const result = await pool.query(
      'SELECT id, cell_id as "cellId", timestamp, event_type as "eventType", state_after as "stateAfter" FROM events WHERE cell_id = $1 AND timestamp < $2 ORDER BY timestamp DESC LIMIT 1',
      [cellId, windowStart],
    );
    return result.rows[0] || null;
  } catch (error) {
    throw new Error('Failed to fetch prior event for cellId: ' + cellId);
  }
}

// Returns all events for a cell within a window, ordered by timestamp
export async function getEventsByWindow(
  cellId: string,
  windowStart: Date,
  windowEnd: Date,
): Promise<PersistedEvent[]> {
  try {
    const result = await pool.query(
      'SELECT id, cell_id as "cellId", timestamp, event_type as "eventType", state_after as "stateAfter" FROM events WHERE cell_id = $1 AND timestamp BETWEEN $2 AND $3 ORDER BY timestamp ASC',
      [cellId, windowStart, windowEnd],
    );
    return result.rows;
  } catch (error) {
    throw new Error(
      `Failed to fetch events for cellId: ${cellId}, within ${windowStart} and ${windowEnd}`,
    );
  }
}

// Returns recent events for a cell, paginated, for the event log endpoint
export async function getRecentEvents(
  cellId: string,
  limit: number,
  offset: number,
): Promise<{ events: PersistedEvent[]; totalCount: number }> {
  try {
    const [rowsResult, countResult] = await Promise.all([
      pool.query(
        'SELECT * FROM events WHERE cell_id = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3',
        [cellId, limit, offset],
      ),
      pool.query(
        'SELECT COUNT(*) FROM events WHERE cell_id = $1',
        [cellId],
      ),
    ]);

    return {
      events: rowsResult.rows,
      totalCount: parseInt(countResult.rows[0].count, 10),
    };
  } catch (error) {
    throw new Error(`Failed to fetch recent events for cellId: ${cellId}`);
  }
}
