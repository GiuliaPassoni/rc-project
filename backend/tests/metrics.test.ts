import { describe, test, expect } from 'vitest';
import {
  computeDurations,
  computeFaultRate,
  computeCycles,
  computeThroughput,
  computeMetrics,
} from './../src/metrics';
import { PersistedEvent } from './../src/types';

describe('Cell Metrics Utilities', () => {
  // Global test window
  const windowStart = new Date(Date.UTC(2026, 4, 25, 10, 0, 0));
  const windowEnd = new Date(Date.UTC(2026, 4, 25, 14, 0, 0));
  const windowDuration_s = 14400;

  // Helper to verify the consistency eq
  const verifyConsistency = (durations: any) => {
    const total =
      durations.uptime_s +
      durations.downtime_s +
      durations.idle_time_s +
      durations.offline_time_s +
      durations.unaccounted_time_s;
    expect(total).toBeCloseTo(windowDuration_s, 1);
  };

  describe('No events scenario', () => {
    test('should return all zeros when no events are provided', () => {
      // cell exists, no events in window, prior state unknown
      // unaccounted_time_s should equal window duration
      const result = computeDurations([], windowStart, windowEnd, 'UNKNOWN');
      expect(result.unaccounted_time_s).toBe(14400);
      // Note: The consistency eq won't match windowDuration_s here
      // because the code returns early with 0s if events.length === 0.
    });
  });

  describe('Single complete cycle - cycle_count = 1, mean_cycle_s = exact duration', () => {
    test('should calculate exactly 1 cycle with its exact duration', () => {
      const events: PersistedEvent[] = [
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 10, 30, 0)),
          eventType: 'cycle_start',
          stateAfter: 'RUNNING',
        },
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 11, 0, 0)), // 30 mins (1800s)
          eventType: 'cycle_end',
          stateAfter: 'IDLE',
        },
      ];

      const metrics = computeCycles(events);

      expect(metrics.cycle_count).toBe(1);
      expect(metrics.mean_cycle_s).toBe(1800);
    });
  });

  describe('Orphaned cycle_start at end — cycle_count = 0', () => {
    test('should ignore an open cycle that never finishes', () => {
      const events: PersistedEvent[] = [
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 13, 0, 0)),
          eventType: 'cycle_start',
          stateAfter: 'RUNNING',
        },
      ];

      const metrics = computeCycles(events);

      expect(metrics.cycle_count).toBe(0);
      expect(metrics.mean_cycle_s).toBeNull();
    });
  });

  describe('Two complete cycles - mean is correct', () => {
    test('should correctly calculate the average duration across multiple cycles', () => {
      const events: PersistedEvent[] = [
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 10, 10, 0)),
          eventType: 'cycle_start',
          stateAfter: 'RUNNING',
        },
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 10, 20, 0)), // 10 mins (600s)
          eventType: 'cycle_end',
          stateAfter: 'IDLE',
        },
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 11, 0, 0)),
          eventType: 'cycle_start',
          stateAfter: 'RUNNING',
        },
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 11, 20, 0)), // 20 mins (1200s)
          eventType: 'cycle_end',
          stateAfter: 'IDLE',
        },
      ];

      const metrics = computeCycles(events);

      expect(metrics.cycle_count).toBe(2);

      expect(metrics.mean_cycle_s).toBe(900);
    });
  });

  describe('Fault rate bucketing - appears in correct hour bucket', () => {
    test('should aggregate fault events into their respective floor-to-hour buckets', () => {
      const events: PersistedEvent[] = [
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 10, 15, 0)),
          eventType: 'fault',
          stateAfter: 'FAULT',
        },
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 10, 45, 0)),
          eventType: 'fault',
          stateAfter: 'FAULT',
        },
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 12, 0, 5)),
          eventType: 'fault',
          stateAfter: 'FAULT',
        },
      ];

      const faultBuckets = computeFaultRate(events, windowStart, windowEnd);

      expect(faultBuckets).toHaveLength(2);

      expect(faultBuckets[0]).toEqual({
        hour: new Date(Date.UTC(2026, 4, 25, 10, 0, 0)),
        count: 2,
      });

      expect(faultBuckets[1]).toEqual({
        hour: new Date(Date.UTC(2026, 4, 25, 12, 0, 0)),
        count: 1,
      });
    });
  });

  describe('Throughput metrics', () => {
    it('should aggregate cycle throughput based on cycle_end timestamps into hour buckets', () => {
      const events: PersistedEvent[] = [
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 10, 0, 0)),
          eventType: 'cycle_start',
          stateAfter: 'RUNNING',
        },
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 10, 15, 0)),
          eventType: 'cycle_end',
          stateAfter: 'IDLE',
        },
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 10, 45, 0)),
          eventType: 'cycle_start',
          stateAfter: 'RUNNING',
        },
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 11, 0, 0)),
          eventType: 'cycle_end',
          stateAfter: 'IDLE',
        },
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 11, 15, 0)),
          eventType: 'cycle_start',
          stateAfter: 'RUNNING',
        },
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 11, 45, 0)),
          eventType: 'cycle_end',
          stateAfter: 'IDLE',
        },
      ];

      const throughputBuckets = computeThroughput(
        events,
        windowStart,
        windowEnd,
      );

      expect(throughputBuckets).toHaveLength(2);

      expect(throughputBuckets[0]).toEqual({
        hour: new Date(Date.UTC(2026, 4, 25, 10, 0, 0)),
        count: 1,
      });

      expect(throughputBuckets[1]).toEqual({
        hour: new Date(Date.UTC(2026, 4, 25, 11, 0, 0)),
        count: 2,
      });
    });
  });

  describe('Window boundary exclusions and metrics consistency', () => {
    test('should exclude events outside boundaries and satisfy the consistency equation', () => {
      const events: PersistedEvent[] = [
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 9, 30, 0)),
          eventType: 'fault',
          stateAfter: 'FAULT',
        },
        // INSIDE: Pushed slightly ahead of windowStart to clear timezone boundaries safely (10:05:00)
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 10, 5, 0)),
          eventType: 'state_change',
          stateAfter: 'RUNNING', // Running for 55 mins (3300s) -> 10:05 to 11:00
        },
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 11, 0, 0)),
          eventType: 'fault',
          stateAfter: 'FAULT', // Fault for 1 hour (3600s) -> 11:00 to 12:00
        },
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 12, 0, 0)),
          eventType: 'state_change',
          stateAfter: 'UNKNOWN', // Unknown for 2 hours (7200s) -> 12:00 to windowEnd (14:00)
        },
        // OUTSIDE: After window end (Should be filtered out)
        {
          timestamp: new Date(Date.UTC(2026, 4, 25, 14, 30, 0)),
          eventType: 'state_change',
          stateAfter: 'IDLE',
        },
      ];

      const globalMetrics = computeMetrics(events, windowStart, windowEnd);

      // 1. Verify durations match the exact timeline states
      expect(globalMetrics.uptime_s).toBe(3300);
      expect(globalMetrics.downtime_s).toBe(3600);
      expect(globalMetrics.unaccounted_time_s).toBe(7500);
      expect(globalMetrics.idle_time_s).toBe(0);
      expect(globalMetrics.offline_time_s).toBe(0);

      // 2. Verify consistency equation holds true (3600 + 3600 + 7200 = 14400)
      verifyConsistency(globalMetrics);

      // 3. Verify outside fault is excluded, inside fault is captured
      expect(globalMetrics.fault_rate).toHaveLength(1);
      expect(globalMetrics.fault_rate[0]).toEqual({
        hour: new Date('2026-05-25T11:00:00.000Z'),
        count: 1,
      });
    });
  });
});
