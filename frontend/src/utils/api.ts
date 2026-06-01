import type {StatusSummaryApiDTO} from "../api/types.ts";
import type {Tile} from "../components/molecules/SummaryComponent.tsx";

export function summaryToTiles(dto: StatusSummaryApiDTO): Tile[] {
    return [
        {label: 'Running',     value: String(dto.RUNNING)},
        {label: 'Idle',        value: String(dto.IDLE)},
        {label: 'Fault',       value: String(dto.FAULT)},
        {label: 'Maintenance', value: String(dto.MAINTENANCE)},
        {label: 'Offline',     value: String(dto.OFFLINE)},
        {label: 'Unknown',     value: String(dto.UNKNOWN)},
    ];
}
