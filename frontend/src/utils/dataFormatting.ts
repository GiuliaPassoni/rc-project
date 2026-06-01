import type {CellMetrics} from "../api/types.ts";
import type {Tile} from "../components/molecules/SummaryComponent.tsx";

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

type TransformedMetrics = ReturnType<typeof transformRawMetricsData>;

const fmt = (v: number | null | undefined, f: (n: number) => string) => v ? f(v) : 'No data';

export function metricsToTiles(m: TransformedMetrics): Tile[] {
    return [
        {label: 'Uptime',           value: fmt(m.uptimePercent,         (v) => `${v.toFixed(2)}%`)},
        {label: 'Downtime',         value: fmt(m.downtimePercent,        (v) => `${v.toFixed(2)}%`)},
        {label: 'Cycle count',      value: fmt(m.cycleCount,             (v) => `${v}`)},
        {label: 'Mean cycle',       value: fmt(m.meanCycleSeconds,       (v) => `${v.toFixed(2)}s`)},
        {label: 'Fault rate',       value: fmt(m.faultsPerHour,          (v) => `${v.toFixed(2)}/hr`)},
        {label: 'Unaccounted time', value: fmt(m.unaccountedTimePercent, (v) => `${v.toFixed(2)}%`)},
    ];
}
