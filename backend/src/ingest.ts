import { createActor } from 'xstate';
import { machine } from './machine';
import { pool } from './db/client';
import { normaliseBatchTelemetry } from './normaliser';
import { CellState, NormaliseResult, PersistedEvent } from './types';
import { groupByCellId, insertEvent, insertIssue } from './utils/ingestUtils';

export async function ingest(rawTelemetry: unknown[]) {
  const { events, issues } = normaliseBatchTelemetry(rawTelemetry);

  for (const issue of issues) {
    await insertIssue(issue);
  }

  const sorted = [...events].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );

  const grouped = groupByCellId(sorted);

  let totalInserted = 0;
  let totalRejected = 0;

  for (const [cellId, cellEvents] of Object.entries(grouped)) {
    const actor = createActor(machine);
    actor.start();

    for (const event of cellEvents) {
      const stateBefore = actor.getSnapshot().value;

      actor.send({ type: event.eventType });

      const stateAfter = actor.getSnapshot().value;

      if (stateBefore === stateAfter) {
        // state didn't change, i.e. fsm rejected the event
        await insertIssue({
          cellId: event.cellId,
          reason: `fsm_rejected: ${event.eventType} from ${String(stateBefore)}`,
          raw: event.raw,
        });

        actor.send({ type: 'unknown' }); // inject 'unknown' event and send FSM to UNKNOWN state

        const syntheticEvent: PersistedEvent = {
          ...event,
          id: `${event.id}-unknown`,
          eventType: 'unknown',
          stateAfter: 'UNKNOWN',
        };
        await insertEvent(syntheticEvent);

        totalRejected++;
        continue;
      }

      // accepted event
      const persisted: PersistedEvent = {
        ...event,
        stateAfter: String(stateAfter) as CellState,
      };

      await insertEvent(persisted);
      totalInserted++;
    }

    actor.stop();
  }

  console.log(
    `Ingest complete: inserted: ${totalInserted}, rejected: ${totalRejected}, issues: ${issues.length}`,
  );
}

async function main(): Promise<void> {
  const raw = require('./mock/raw_chaotic_telemetry.json');
  await ingest(raw);
  await pool.end();
}

main().catch((err) => {
  console.error('Ingest failed:', err);
  process.exit(1);
});
