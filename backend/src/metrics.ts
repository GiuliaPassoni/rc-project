import {
  CellState,
  CellMetrics,
  CycleMetrics,
  DurationMetrics,
  FaultRateBucket,
  PersistedEvent,
  ThroughputBucket,
} from './types';
import { durationSeconds, floorToHour, clamp } from './utils/metricsUtils';

export function computeDurations(
  events: PersistedEvent[],
  windowStart: Date,
  windowEnd: Date,
  priorState: CellState = 'UNKNOWN',
) {
  const result: DurationMetrics = {
    uptime_s: 0,
    downtime_s: 0,
    idle_time_s: 0,
    offline_time_s: 0,
    unaccounted_time_s: 0,
  };

  if (!Array.isArray(events)) {
    console.error('computeDurations: events is not an array', events);
    return result;
  }

  // build a synthetic timeline that starts at windowStart
  // with the prior state, then each event transition
  type Interval = { from: Date; state: CellState };

  const intervals: Interval[] = [{ from: windowStart, state: priorState }];

  for (const event of events) {
    if (event.timestamp > windowStart) {
      intervals.push({ from: event.timestamp, state: event.stateAfter });
    }
  }

  for (let i = 0; i < intervals.length; i++) {
    const from = intervals[i].from;
    const to = i + 1 < intervals.length ? intervals[i + 1].from : windowEnd;
    const duration = durationSeconds(from, to);
    if (duration <= 0) continue;

    switch (intervals[i].state) {
      case 'RUNNING':
        result.uptime_s += duration;
        break;
      case 'FAULT':
      case 'MAINTENANCE':
        result.downtime_s += duration;
        break;
      case 'IDLE':
        result.idle_time_s += duration;
        break;
      case 'OFFLINE':
        result.offline_time_s += duration;
        break;
      case 'UNKNOWN':
        result.unaccounted_time_s += duration;
        break;
    }
  }

  return result;
}

export function computeFaultRate(
  events: PersistedEvent[],
  windowStart: Date,
  windowEnd: Date,
): FaultRateBucket[] {
  const buckets = new Map<number, number>();

  for (const event of events) {
    if (event.eventType !== 'fault') continue;
    if (event.timestamp < windowStart || event.timestamp > windowEnd) continue;
    const hour = floorToHour(event.timestamp).getTime();
    buckets.set(hour, (buckets.get(hour) ?? 0) + 1);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([hour, count]) => ({ hour: new Date(hour), count }));
}

export function computeCycles(events: PersistedEvent[]): CycleMetrics {
  const cycleDurations: number[] = [];
  let openCycleStart: Date | null = null;

  for (const event of events) {
    if (event.eventType === 'cycle_start') {
      openCycleStart = event.timestamp;
    } else if (event.eventType === 'cycle_end' && openCycleStart !== null) {
      cycleDurations.push(durationSeconds(openCycleStart, event.timestamp));
      openCycleStart = null;
    }
  }
  // open cycle at end of window is intentionally excluded

  const cycle_count = cycleDurations.length;
  const mean_cycle_s =
    cycle_count > 0
      ? cycleDurations.reduce((sum, d) => sum + d, 0) / cycle_count
      : null;

  return { cycle_count, mean_cycle_s };
}

export function computeThroughput(
  events: PersistedEvent[],
  windowStart: Date,
  windowEnd: Date,
): ThroughputBucket[] {
  const buckets = new Map<number, number>();
  let openCycleStart: Date | null = null;

  for (const event of events) {
    if (event.eventType === 'cycle_start') {
      openCycleStart = event.timestamp;
    } else if (event.eventType === 'cycle_end' && openCycleStart !== null) {
      const hour = floorToHour(event.timestamp).getTime();
      buckets.set(hour, (buckets.get(hour) ?? 0) + 1);
      openCycleStart = null;
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([hour, count]) => ({ hour: new Date(hour), count }));
}

export function computeMetrics(
  events: PersistedEvent[],
  windowStart: Date,
  windowEnd: Date,
  priorState: CellState = 'UNKNOWN',
): CellMetrics {
  console.debug('computeMetrics received:', events, typeof events);
  const windowEvents = events.filter(
    (e) => e.timestamp >= windowStart && e.timestamp <= windowEnd,
  );

  return {
    ...computeDurations(windowEvents, windowStart, windowEnd, priorState),
    ...computeCycles(windowEvents),
    throughput: computeThroughput(windowEvents, windowStart, windowEnd),
    fault_rate: computeFaultRate(windowEvents, windowStart, windowEnd),
    window_start: windowStart,
    window_end: windowEnd,
  };
}
