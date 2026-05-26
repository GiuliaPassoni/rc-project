import {useQuery} from "@tanstack/react-query";
import {getCellMetrics, getCells, getCellsStatus} from "../api/queries.ts";

export function useCells(){
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

export function useCellMetrics(cellId: string, window: string) {
    return useQuery({
        queryKey: ["metrics", cellId, window],
        queryFn: () => getCellMetrics(cellId, window),
        refetchInterval: 30_000,
    })
}

