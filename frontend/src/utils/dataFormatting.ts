import type {CellMetrics} from "../api/types.ts";

export function transformRawMetricsData(
    raw: CellMetrics,
    TimeWindow: '24h' | '7d' | '30d'
) {
    const {
        uptime_s,
        downtime_s,
        idle_time_s,
        offline_time_s,
        unaccounted_time_s,
        cycle_count,
        mean_cycle_s,
        fault_rate,
        throughput
    } = raw;

    const totalSeconds = uptime_s + downtime_s + idle_time_s + offline_time_s + unaccounted_time_s;

    function getPercentage(value: number): number {
        return totalSeconds > 0 ? ((value / totalSeconds) * 100) : 0;
    }

    // Calculate faults per hour based on window context
    const windowHoursMap = {'24h': 24, '7d': 24 * 7, '30d': 24 * 30};
    const totalHours = windowHoursMap[TimeWindow];
    const faultsPerHour = fault_rate.reduce((sum, item) => sum + item.count, 0) / totalHours;

    return {
        uptimeSeconds: uptime_s,
        uptimePercent: getPercentage(uptime_s),
        downtimeSeconds: downtime_s,
        downtimePercent: getPercentage(downtime_s),
        cycleCount: cycle_count,
        meanCycleSeconds: mean_cycle_s,
        faultsPerHour,
        rawFaultRate: fault_rate,
        idleTimePercent: getPercentage(idle_time_s),
        offlineTimePercent: getPercentage(offline_time_s),
        unaccountedTimePercent: getPercentage(unaccounted_time_s),
        throughput
    };
}
