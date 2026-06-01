import React from "react";
import type {TimeWindow} from "../../api/types.ts";
import {LoadingSpinner} from "../atoms/LoadingSpinner.tsx";
import {SummaryComponent} from "../molecules/SummaryComponent.tsx";

interface MetricsSummaryProps {
    metrics: {
        uptimeSeconds: number,
        uptimePercent: number,
        downtimeSeconds: number,
        downtimePercent: number,
        cycleCount: number,
        meanCycleSeconds: number,
        faultsPerHour: number,
        rawFaultRate: number,
        idleTimePercent: number,
        offlineTimePercent: number,
        unaccountedTimePercent: number,
    },
    window: TimeWindow,
    isLoading: boolean
}

export function MetricsSummary({metrics, window, isLoading}: MetricsSummaryProps) {
    const {
        uptimePercent,
        downtimePercent,
        cycleCount,
        meanCycleSeconds,
        faultsPerHour,
        unaccountedTimePercent,
    } = metrics;

    if (isLoading) {
        return <LoadingSpinner/>
    }

    const tiles: { label: string; value: number | null | undefined; format: (v: number) => string }[] = [
        {label: 'Uptime', value: uptimePercent, format: (v) => `${v.toFixed(2)}%`},
        {label: 'Downtime', value: downtimePercent, format: (v) => `${v.toFixed(2)}%`},
        {label: 'Cycle count', value: cycleCount, format: (v) => `${v}`},
        {label: 'Mean cycle', value: meanCycleSeconds, format: (v) => `${v.toFixed(2)}s`},
        {label: 'Fault rate', value: faultsPerHour, format: (v) => `${v.toFixed(2)}/hr`},
        {label: 'Unaccounted time', value: unaccountedTimePercent, format: (v) => `${v.toFixed(2)}%`},
    ];

    return (
        <SummaryComponent title="Metrics Panel"
                          sideComponent={
                              <span className="text-xs font-mono text-slate-100">Selected time window: {window}</span>
                          }
        >
            <div className="grid grid-cols-3 md:grid-cols-3 gap-4 h-full items-center">
                {tiles.map(({label, value, format}) => (
                    <div key={label}
                         className="bg-slate-900 border border-slate-800/60 p-3 rounded-lg text-slate-200 text-xs font-mono">
                        {label}: {value ? format(value) : 'No data'}
                    </div>
                ))}
            </div>
        </SummaryComponent>
    )
}
