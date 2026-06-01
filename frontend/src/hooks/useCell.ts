import {keepPreviousData, useQuery, useQueries} from "@tanstack/react-query";
import {getCellEvents, getCellMetrics, getCells, getCellsStatus, getStatusSummary} from "../api/queries.ts";
import type {CellMetrics, TimeWindow} from "../api/types.ts";
import {mapSummaryToDomain} from "../utils/api.ts";
import {transformRawMetricsData} from "../utils/dataFormatting.ts";

export function useCells() {
    return useQuery({
        queryKey: ["cells"],
        queryFn: () => getCells(),
        refetchInterval: 30_000,
    })
}

export function useCellsStatus() {
    return useQuery({
        queryKey: ["cells", "status"],
        queryFn: () => getCellsStatus(),
        refetchInterval: 30_000,
    });
}

export function useStatusSummary() {
    return useQuery({
        queryKey: ["status", "summary"],
        queryFn: () => getStatusSummary(),
        refetchInterval: 30_000,
        select: (data) => mapSummaryToDomain(data),
    })
}

export function useCellMetrics(cellId: string, window: TimeWindow) {
    return useQuery({
        queryKey: ["metrics", cellId, window],
        queryFn: () => getCellMetrics(cellId, window),
        refetchInterval: 30_000,
        select: (data: CellMetrics) => transformRawMetricsData(data, window),
    })
}

export function useCellsMetrics(cellIds: string[], window: TimeWindow) {
    return useQueries({
        queries: cellIds.map((id) => ({
            queryKey: ["metrics", id, window],
            queryFn: () => getCellMetrics(id, window),
            refetchInterval: 30_000,
            select: (data: CellMetrics) => transformRawMetricsData(data, window),
        })),
    });
}

export function useCellEvents(cellId: string, limit: number, offset: number) {
    return useQuery({
        queryKey: ["cell", cellId, "events", limit, offset],
        queryFn: () => getCellEvents(cellId, limit, offset),
        refetchInterval: 30_000,
        placeholderData: keepPreviousData,
    })
}

