import React, {useState} from 'react';
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer} from 'recharts';
import type {TimeWindow} from "../../api/types.ts";
import {useCellsMetrics} from "../../hooks/useCell.ts";
import {LoadingSpinner} from "../atoms/LoadingSpinner.tsx";
import {TimeWindowSelector} from "./TimeWindowSelector.tsx";

interface MultiCellComparisonProps {
    cellIds: string[];
}

export function MultiCellComparison({cellIds}: MultiCellComparisonProps) {
    const [window, setWindow] = useState<TimeWindow>('24h');
    const timeWindows: TimeWindow[] = ['24h', '7d', '30d'];

    const results = useCellsMetrics(cellIds, window);

    const chartData = cellIds.map((id, i) => {
        const {data, isPending, isError} = results[i];

        if (isPending || isError || !data) {
            return {cellId: id, Uptime: 0, Downtime: 0, Idle: 0, pending: true};
        }

        return {
            cellId: id,
            Uptime: Math.round(data.uptimePercent),
            Downtime: Math.round(data.downtimePercent),
            Idle: Math.round(data.idleTimePercent),
            pending: false,
        };
    });

    const anyPending = results.some((r) => r.isPending);

    const maxY = Math.max(...chartData.map((d) => Math.max(d.Uptime, d.Downtime, d.Idle)));
    const domainMax = maxY > 0 ? Math.ceil(maxY / 5) * 5 : 100;

    return (
        <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl h-[460px] flex flex-col">
            <div className="border-b border-slate-800 pb-3 mb-4 flex justify-between items-center">
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Cross-Node Efficiency Comparison
                    </h3>
                    <p className="text-[10px] text-slate-500 font-sans">
                        Time distribution per cell — {window} window
                        {anyPending && <span className="ml-2 text-orange-400">· loading…</span>}
                    </p>
                </div>
                <TimeWindowSelector timeWindows={timeWindows} window={window} setWindow={setWindow}/>
            </div>

            <div className="flex-1 w-full min-h-0">
                {anyPending ?
                    <div className="w-full h-full flex justify-center items-center"><LoadingSpinner/></div>
                    : (<ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{top: 10, right: 10, left: -25, bottom: 0}}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false}/>
                            <XAxis
                                dataKey="cellId"
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#64748b"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => `${v}%`}
                                domain={[0, domainMax]}
                            />
                            <Tooltip
                                cursor={{fill: '#1e293b', opacity: 0.2}}
                                contentStyle={{
                                    backgroundColor: '#020617',
                                    borderColor: '#334155',
                                    borderRadius: '0.75rem'
                                }}
                                itemStyle={{fontSize: '12px', padding: '2px 0'}}
                                formatter={(value) => `${value}%`}
                            />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{fontSize: '11px'}}
                            />
                            <Bar dataKey="Uptime" fill="#4ade80" radius={[4, 4, 0, 0]} name="Uptime"/>
                            <Bar dataKey="Downtime" fill="#f87171" radius={[4, 4, 0, 0]} name="Downtime"/>
                            <Bar dataKey="Idle" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Idle"/>
                        </BarChart>
                    </ResponsiveContainer>)}
            </div>
        </div>
    );
}
