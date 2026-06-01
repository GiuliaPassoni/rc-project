import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import type {FaultRateBucket} from "../../api/types.ts";
import {formatTooltipLabel, formatXAxis} from "./../../utils/charts.ts";
import {EmptyState} from "../atoms/EmptyState.tsx";
import {CellChartCard} from "../molecules/CellChartCard.tsx";

interface ThroughputDataPoint {
    hour: string;
    count: number;
}

interface ThroughputChartProps {
    throughput: ThroughputDataPoint[];
    faults: FaultRateBucket[];
    TimeWindow: '24h' | '7d' | '30d';
    isLoading?: boolean;
}

export function ThroughputChart({
                                    throughput,
                                    faults,
                                    TimeWindow,
                                }: ThroughputChartProps) {

    const totalCycles = throughput?.reduce((sum, item) => sum + item.count, 0) ?? 0;

    if (!throughput || throughput.length === 0 || totalCycles === 0) {
        return (
            <EmptyState message={`There is no throughput or operational data registered for this robotic cell within the
                selected ${TimeWindow} window.`}/>
        );
    }

    const chartData = throughput.map((tp) => {
        const matchingFault = faults.find((f) => f.hour === tp.hour);
        return {
            timestamp: tp.hour,
            throughput: tp.count,
            faults: matchingFault ? matchingFault.count : 0,
        };
    });

    return (
        <CellChartCard chartTitle={"Throughput vs Fault Rate"} sideNote={"Dual Axis Timeline"}>


            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={chartData}
                    margin={{top: 10, right: -10, left: -20, bottom: 0}}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false}/>

                    <XAxis
                        dataKey="timestamp"
                        tickFormatter={(val) => formatXAxis(val, TimeWindow)}
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        dy={10}
                    />

                    <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#6366f1"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />

                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#ef4444"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />

                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#020617',
                            borderColor: '#334155',
                            borderRadius: '0.75rem',
                        }}
                        labelStyle={{color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px'}}
                        itemStyle={{fontSize: '12px', padding: '2px 0'}}
                        labelFormatter={formatTooltipLabel}
                    />

                    <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{fontSize: '11px', paddingTop: '4px'}}
                    />

                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="throughput"
                        name="Throughput (cycles)"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={TimeWindow === '24h'}
                        activeDot={{r: 6, stroke: '#0f172a', strokeWidth: 2}}
                    />

                    <Line
                        yAxisId="right"
                        type="stepAfter"
                        dataKey="faults"
                        name="Faults (count)"
                        stroke="#b91c1c"
                        strokeWidth={2}
                        dot={TimeWindow === '24h'}
                        activeDot={{r: 5, stroke: '#0f172a', strokeWidth: 2}}
                    />
                </LineChart>
            </ResponsiveContainer>
        </CellChartCard>
    );
};