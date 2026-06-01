import React from "react";
import type {FleetSummaryProps} from "../../api/types.ts";
import {SummaryComponent} from "../molecules/SummaryComponent.tsx";

export function FleetSummary({running, idle, fault, maintenance, offline, unknown}: FleetSummaryProps) {
    const statuses = [
        {label: "Running", value: running},
        {label: "Idle", value: idle},
        {label: "Fault", value: fault},
        {label: "Maintenance", value: maintenance},
        {label: "Offline", value: offline},
        {label: "Unknown", value: unknown},
    ];

    return (
        <SummaryComponent
            title="Fleet Status Overview"
            sideComponent={
                <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full"/>
                    <span className="text-red-500 text-xs">Live</span>
                </span>
            }
        >
            <div className="grid grid-cols-3 md:grid-cols-3 gap-4 h-full items-center">
                {statuses.map(({label, value}) => (
                    <div
                        key={label}
                        className="bg-slate-900 border border-slate-800/60 p-3 rounded-lg text-slate-500 text-xs font-mono"
                    >
                        {label}: {value}
                    </div>
                ))}
            </div>
        </SummaryComponent>
    )
}