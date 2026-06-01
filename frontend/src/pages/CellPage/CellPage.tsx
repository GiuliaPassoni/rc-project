import React, {useState} from 'react';
import {useParams, Link} from 'react-router-dom';
import type {TimeWindow} from "../../api/types.ts";
import {Error} from "../../components/atoms/Error.tsx";
import {CellChartCard} from "../../components/molecules/CellChartCard.tsx";
import {SummaryComponent} from "../../components/molecules/SummaryComponent.tsx";
import {EventLog} from "../../components/organisms/EventLog.tsx";
import {FaultRateChart} from "../../components/organisms/FaultRateChart.tsx";
import {ThroughputChart} from "../../components/organisms/ThroughputChart.tsx";
import {TimeWindowSelector} from "../../components/organisms/TimeWindowSelector.tsx";
import {useCellEvents, useCellMetrics, useCellsStatus} from "../../hooks/useCell.ts";
import {metricsToTiles} from "../../utils/dataFormatting.ts";

const EVENT_LIMIT = 15;

export const CellPage: React.FC = () => {
    const {cellId} = useParams<{ cellId: string }>();

    const [window, setWindow] = useState<TimeWindow>('24h');
    const timeWindows: TimeWindow[] = ['24h', '7d', '30d'];
    const [eventOffset, setEventOffset] = useState(0);

    const {data: cellsStatus, isLoading: isLoadingCells} = useCellsStatus();

    const {
        data: metricsData,
        isLoading: isLoadingMetrics,
        isError: isMetricsError
    } = useCellMetrics(cellId ?? '', window);
    const {
        data: eventsData = {events: [], totalCount: 0},
        isFetching: isFetchingEvents,
        isError: isEventsError
    } = useCellEvents(cellId ?? '', EVENT_LIMIT, eventOffset);

    if (!isLoadingCells && !cellsStatus?.some((c) => c.cellId === cellId)) {
        return <Error message={`No cell with ID "${cellId}" exists.`}/>;
    }

    if (isMetricsError || isEventsError) {
        return (
            <Error
                message="Failed to sync telemetry node. An unknown API error occurred."
                onRetry={() => location.reload()}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950 p-4 border border-slate-800 rounded-xl">
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
                <TimeWindowSelector timeWindows={timeWindows} window={window} setWindow={setWindow}/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SummaryComponent
                    title="Metrics Panel"
                    tiles={metricsData ? metricsToTiles(metricsData) : []}
                    isLoading={isLoadingMetrics}
                    sideComponent={
                        <span className="text-xs font-mono text-slate-100">
                            Selected time window: {window}
                        </span>
                    }
                />

                <ThroughputChart throughput={metricsData?.throughput} faults={metricsData?.rawFaultRate}
                                 TimeWindow={window} isLoading={isLoadingMetrics}/>

                <FaultRateChart faults={metricsData?.rawFaultRate} TimeWindow={window} isLoading={isLoadingMetrics}/>

                <CellChartCard chartTitle={"Video"} subTitle={"In progress"} className="h-full">
                    <p className="text-[12px] text-slate-500 font-sans">In progress</p>
                </CellChartCard>
            </div>

            <EventLog events={eventsData.events} totalCount={eventsData.totalCount} pageSize={EVENT_LIMIT}
                      offset={eventOffset} onOffsetChange={setEventOffset} isLoading={isFetchingEvents}/>
        </div>
    );
};
