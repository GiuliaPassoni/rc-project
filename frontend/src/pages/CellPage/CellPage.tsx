import React, {useState} from 'react';
import {useParams, Link} from 'react-router-dom';
import type {TimeWindow} from "../../api/types.ts";
import {Error} from "../../components/atoms/Error.tsx";
import {LoadingSpinner} from "../../components/atoms/LoadingSpinner.tsx";
import {CellChartCard} from "../../components/molecules/CellChartCard.tsx";
import {EventLog} from "../../components/organisms/EventLog.tsx";
import {FaultRateChart} from "../../components/organisms/FaultRateChart.tsx";
import {MetricsSummary} from "../../components/organisms/MetricsSummary.tsx";
import {ThroughputChart} from "../../components/organisms/ThroughputChart.tsx";
import {TimeWindowSelector} from "../../components/organisms/TimeWindowSelector.tsx";
import {ErrorPage} from "../ErrorPage/ErrorPage.tsx";
import {useCellEvents, useCellMetrics} from "../../hooks/useCell.ts";

const EVENT_LIMIT = 15;

export const CellPage: React.FC = () => {
    const {cellId} = useParams<{ cellId: string }>();

    const [window, setWindow] = useState<TimeWindow>('24h');
    const timeWindows: TimeWindow[] = ['24h', '7d', '30d'];
    const [eventOffset, setEventOffset] = useState(0);

    const {
        data: metricsData = {},
        isLoading: isLoadingMetrics,
        isError: isMetricsError
    } = useCellMetrics(cellId ?? '', window);
    const {
        data: eventsData = {events: [], totalCount: 0},
        isLoading: isLoadingEvents,
        isFetching: isFetchingEvents,
        isError: isEventsError
    } = useCellEvents(cellId ?? '', EVENT_LIMIT, eventOffset);

    const isError = isMetricsError || isEventsError;

    if (isError) {
        return (
            <Error
                message={error instanceof Error ? error.message : 'Failed to Sync Telemetry Node. An unknown API error occurred.'}
                onRetry={() => window.location.reload()}
            />
        );
    }

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
                <TimeWindowSelector timeWindows={timeWindows} window={window} setWindow={setWindow}/>
            </div>

            {/* 2. Fixed Telemetry Grid System */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* [MetricsPanel] — Full Width */}
                <MetricsSummary metrics={metricsData} window={window} isLoading={isLoadingMetrics}/>

                {/* [ThroughputChart] — 2/3 Width */}
                <ThroughputChart throughput={metricsData.throughput} faults={metricsData.rawFaultRate}
                                 TimeWindow={window} isLoading={isLoadingMetrics}/>

                {/* [FaultRateChart] — 1/3 Width */}
                <FaultRateChart faults={metricsData.rawFaultRate} TimeWindow={window} isLoading={isLoadingMetrics}/>

                {/*placeholder*/}
                <CellChartCard chartTitle={"Video"} subTitle={"In progress"} className="h-full">
                    <p className="text-[12px] text-slate-500 font-sans">In progress</p>
                </CellChartCard>

            </div>
            {/* [EventLog] — Full Width */}
            <EventLog events={eventsData.events} totalCount={eventsData.totalCount} pageSize={EVENT_LIMIT}
                      offset={eventOffset} onOffsetChange={setEventOffset} isLoading={isFetchingEvents}/>

        </div>
    );
};