import {
    BarChart,
    Bar,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import type {FaultRateBucket} from "../../api/types.ts";
import {formatTooltipLabel, formatXAxis} from "./../../utils/charts.ts";
import {EmptyState} from "../atoms/EmptyState.tsx";
import {CellChartCard} from "../molecules/CellChartCard.tsx";

interface FaultRateChartProps {
    faults: FaultRateBucket[];
    TimeWindow: '24h' | '7d' | '30d';
    isLoading?: boolean;
}

export function FaultRateChart({faults, TimeWindow, isLoading}: FaultRateChartProps) {
    const totalFaults = faults?.reduce((sum, item) => sum + item.count, 0) ?? 0;

    if (!faults || faults.length === 0 || totalFaults === 0) {
        return (
            <EmptyState message={`There is no fault data registered for this robotic cell within the
                selected ${TimeWindow} window.`}/>
        );
    }

    return (
        <CellChartCard chartTitle={"Fault Distribution"} subTitle={`Total recorded incidents: ${totalFaults}`}
                       sideNote="Discrete Events" isLoading={isLoading}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={faults}
                    margin={{top: 10, right: 0, left: -30, bottom: 0}}
                    barCategoryGap="20%"
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false}/>

                    <XAxis
                        dataKey="hour"
                        tickFormatter={(val) => formatXAxis(val, TimeWindow)}
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        dy={10}
                    />

                    <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        label={{
                            value: 'Fault Count',
                            angle: -90,
                            position: 'insideLeft',
                            style: {textAnchor: 'middle', fill: '#475569', fontSize: '10px', fontFamily: 'sans-serif'},
                            dx: -5
                        }}
                    />

                    <Tooltip
                        cursor={{fill: '#1e293b', opacity: 0.4}}
                        contentStyle={{
                            backgroundColor: '#020617',
                            borderColor: '#334155',
                            borderRadius: '0.75rem',
                        }}
                        labelStyle={{color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px'}}
                        itemStyle={{fontSize: '12px', color: '#ef4444', padding: '2px 0'}}
                        labelFormatter={formatTooltipLabel}
                    />

                    <Bar
                        dataKey="count"
                        name="Incidents"
                        radius={[4, 4, 0, 0]}
                        fill="#b91c1c"
                        className="transition-all duration-300 hover:opacity-80"
                    />
                </BarChart>
            </ResponsiveContainer>
        </CellChartCard>
    )
}