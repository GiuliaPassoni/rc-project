import {apiFetch} from "./client.ts";
import type {CellMetrics, CellState, CellStatus, PersistedEvent, TimeWindow} from "./types.ts";

export const getCells = () =>
    apiFetch<string[]>("/cells")

export const getCellsStatus = () =>
    apiFetch<CellStatus[]>("/cells/status")

export const getStatusSummary = () =>
    apiFetch<Record<CellState, number>>("/cells/status/summary")

export const getCellMetrics = (cellId: string, window: TimeWindow) =>
    apiFetch<CellMetrics>(`/cells/${cellId}/metrics?window=${window}`)

export const getCellEvents = (cellId: string, limit = 50, offset = 0) =>
    apiFetch<{
        events: PersistedEvent[],
        totalCount: number
    }>(`/cells/${cellId}/events?limit=${limit}&offset=${offset}`)