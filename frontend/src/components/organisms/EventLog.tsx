import React from 'react';
import type {PersistedEvent} from "../../api/types.ts";
import {LoadingSpinner} from "../atoms/LoadingSpinner.tsx";
import {CellChartCard} from "../molecules/CellChartCard.tsx";
import {formatAbsoluteDate} from "../../utils/time.ts";

interface EventLogProps {
    events: PersistedEvent[];
    totalCount: number;
    pageSize: number;
    offset: number;
    onOffsetChange: (offset: number) => void;
    isLoading?: boolean;
}

export function EventLog({
                             events,
                             totalCount,
                             pageSize,
                             offset,
                             onOffsetChange,
                             isLoading = false,
                         }: EventLogProps) {
    const handleNext = () => {
        if (offset + pageSize < totalCount) onOffsetChange(offset + pageSize);
    };

    const handlePrev = () => {
        if (offset > 0) onOffsetChange(Math.max(0, offset - pageSize));
    };

    const currentPage = Math.floor(offset / pageSize) + 1;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    const formatPayloadSummary = (payload: Record<string, any>): string => {
        try {
            const serialized = JSON.stringify(payload);
            if (serialized === '{}') return '-';
            return serialized.length > 60 ? `${serialized.slice(0, 60)}...` : serialized;
        } catch {
            return '[Complex Objects Mapping Error]';
        }
    };

    return (
        <CellChartCard chartTitle={"System Event Sequence Registry"} sideNote={`Offset Pointer: ${offset}`}
                       className="h-full" isLoading={isLoading}>
            {/*Scrollable Viewport Frame */}
            <div className="flex-1 min-h-0 border border-slate-900 rounded-lg bg-slate-950">
                <table className="w-full h-full text-left border-collapse table-fixed">
                    <thead
                        className="bg-slate-900 sticky top-0 z-10 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <tr>
                        <th className="p-3 w-[22%]">Timestamp</th>
                        <th className="p-3 w-[18%]">Event Type</th>
                        <th className="p-3 w-[15%]">State Target</th>
                        <th className="p-3 w-[45%]">Payload Summary</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-xs font-mono">
                    {events.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-600 italic">
                                No execution logs registered within this window block.
                            </td>
                        </tr>
                    ) : (
                        events.map((event) => {
                            const isIngestInjected = event.eventType.toLowerCase() === 'unknown';
                            return (
                                <tr
                                    key={event.id}
                                    className={`transition-colors hover:bg-slate-900/40 ${
                                        isIngestInjected
                                            ? 'bg-purple-950/20 text-purple-300 hover:bg-purple-950/30'
                                            : 'text-slate-300'
                                    }`}
                                >
                                    <td className="p-3 truncate text-slate-400">
                                        {formatAbsoluteDate(event.timestamp)}
                                    </td>
                                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                          isIngestInjected
                              ? 'bg-purple-900/50 border border-purple-700/40'
                              : 'bg-slate-800 text-slate-400'
                      }`}>
                        {event.eventType}
                      </span>
                                    </td>
                                    <td className="p-3 font-semibold">{event.stateAfter}</td>
                                    <td className="p-3 truncate text-slate-400 font-sans"
                                        title={JSON.stringify(event.payload)}>
                                        {formatPayloadSummary(event.payload)}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Interface Actions Menu */}
            <div
                className="border-t border-slate-800 pt-4 mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>
          Page <strong className="text-slate-400">{currentPage}</strong> of <strong
            className="text-slate-400">{totalPages}</strong>
        </span>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handlePrev}
                        disabled={offset === 0 || isLoading}
                        className="px-3 py-1.5 font-semibold rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                    >
                        Previous
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={offset + pageSize >= totalCount || isLoading}
                        className="px-3 py-1.5 font-semibold rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        </CellChartCard>
    );
};