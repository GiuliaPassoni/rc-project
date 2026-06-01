import {describe, test, expect} from 'vitest';
import {formatDuration} from '../src/utils/time';
import {transformRawMetricsData} from '../src/utils/dataFormatting';

describe('formatDuration', () => {
    test('returns 0s for zero', () => {
        expect(formatDuration(0)).toBe('0s');
    });

    test('returns 0s for negative values', () => {
        expect(formatDuration(-100)).toBe('0s');
    });

    test('formats seconds only', () => {
        expect(formatDuration(45)).toBe('45s');
    });

    test('formats minutes and seconds', () => {
        expect(formatDuration(90)).toBe('1m 30s');
    });

    test('formats hours, minutes and seconds', () => {
        expect(formatDuration(3661)).toBe('1h 1m 1s');
    });

    test('omits seconds when there is no remainder', () => {
        expect(formatDuration(3600)).toBe('1h');
    });

    test('formats days', () => {
        expect(formatDuration(90061)).toBe('1d 1h 1m 1s');
    });
});

describe('transformRawMetricsData', () => {
    const base = {
        uptime_s: 3600,
        downtime_s: 3600,
        idle_time_s: 3600,
        offline_time_s: 0,
        unaccounted_time_s: 3600,
        cycle_count: 4,
        mean_cycle_s: 900,
        fault_rate: [
            {hour: new Date('2026-05-25T10:00:00Z'), count: 2},
            {hour: new Date('2026-05-25T11:00:00Z'), count: 0},
        ],
        throughput: [],
        window_start: new Date('2026-05-25T10:00:00Z'),
        window_end: new Date('2026-05-25T14:00:00Z'),
    };

    test('percentages sum to 100', () => {
        const result = transformRawMetricsData(base, '24h');
        const total = result.uptimePercent + result.downtimePercent + result.idleTimePercent
            + result.offlineTimePercent + result.unaccountedTimePercent;
        expect(total).toBeCloseTo(100, 5);
    });

    test('each percentage reflects its share of total time', () => {
        const result = transformRawMetricsData(base, '24h');
        expect(result.uptimePercent).toBeCloseTo(25, 5);
        expect(result.downtimePercent).toBeCloseTo(25, 5);
        expect(result.idleTimePercent).toBeCloseTo(25, 5);
        expect(result.unaccountedTimePercent).toBeCloseTo(25, 5);
        expect(result.offlineTimePercent).toBe(0);
    });

    test('faultsPerHour aggregates fault counts divided by window hours', () => {
        const result = transformRawMetricsData(base, '24h');
        // 2 total faults / 24 hours
        expect(result.faultsPerHour).toBeCloseTo(2 / 24, 5);
    });

    test('returns zero percentages when all durations are zero', () => {
        const empty = {...base, uptime_s: 0, downtime_s: 0, idle_time_s: 0, offline_time_s: 0, unaccounted_time_s: 0};
        const result = transformRawMetricsData(empty, '24h');
        expect(result.uptimePercent).toBe(0);
        expect(result.downtimePercent).toBe(0);
    });

    test('passes through cycleCount and meanCycleSeconds unchanged', () => {
        const result = transformRawMetricsData(base, '24h');
        expect(result.cycleCount).toBe(4);
        expect(result.meanCycleSeconds).toBe(900);
    });
});
