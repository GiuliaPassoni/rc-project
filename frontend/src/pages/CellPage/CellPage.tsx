import React, {useState} from 'react';
import {useParams, Link} from 'react-router-dom';
import type {TimeWindow} from "../../api/types.ts";
import {LoadingSpinner} from "../../components/atoms/LoadingSpinner.tsx";
import {EventLog} from "../../components/organisms/EventLog.tsx";
import {FaultRateChart} from "../../components/organisms/FaultRateChart.tsx";
import {MetricsSummary} from "../../components/organisms/MetricsSummary.tsx";
import {ThroughputChart} from "../../components/organisms/ThroughputChart.tsx";
import {useCellEvents, useCellMetrics} from "../../hooks/useCell.ts";

const EVENT_LIMIT = 15, EVENT_OFFSET = 0;

export const CellPage: React.FC = () => {
    const {cellId} = useParams<{ cellId: string }>();

    const [window, setWindow] = useState<TimeWindow>('24h');
    const timeWindows: TimeWindow[] = ['24h', '7d', '30d'];


    const {data: metricsData = {}, isLoading: isLoadingMetrics} = useCellMetrics(cellId ?? '', window);
    const {data: eventsData = {events: [], totalCount: 0}, isLoading: isLoadingEvents} = useCellEvents(cellId ?? '', EVENT_LIMIT, EVENT_OFFSET);

    const isLoading = isLoadingMetrics || isLoadingEvents;

    if (isLoading) return (
        <div className="flex items-center justify-center h-screen">
            <LoadingSpinner/>
        </div>
    )

    return (
        <div className="space-y-6">

            {/* 1. Context Navigation & Control Header */}
            <div
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950 p-4 border border-slate-800 rounded-xl">
                <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
                        <Link to="/" className="hover:text-slate-300 transition-colors">Cell Overview</Link>
                        <span>/</span>
                        <span className="text-indigo-400 font-mono">{cellId}</span>
                    </div>
                    <h2 className="text-xl font-bold font-mono tracking-tight text-slate-100">
                        Telemetry Node: {cellId}
                    </h2>
                </div>

                {/* Local Window Selector Control */}
                <div className="flex items-center bg-slate-900 p-1 border border-slate-800 rounded-lg shadow-inner">
                    {timeWindows.map((w) => (
                        <button
                            key={w}
                            onClick={() => setWindow(w)}
                            className={`min-w-[60px] px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                window === w
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                        >
                            {w}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Fixed Telemetry Grid System */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* [MetricsPanel] — Full Width */}
                <MetricsSummary metrics={metricsData} window={window}/>

                {/* [ThroughputChart] — 2/3 Width */}
                <ThroughputChart throughput={metricsData.throughput} faults={metricsData.rawFaultRate}
                                 TimeWindow={window} isLoading={isLoadingMetrics}/>

                {/* [FaultRateChart] — 1/3 Width */}
                <FaultRateChart faults={metricsData.rawFaultRate} TimeWindow={window} isLoading={isLoadingMetrics}/>

                {/* [EventLog] — Full Width */}
                <EventLog events={eventsData.events} totalCount={eventsData.totalCount} pageSize={EVENT_LIMIT}
                          isLoading={isLoadingEvents}/>

            </div>
        </div>
    );
};