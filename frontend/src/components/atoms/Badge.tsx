import type {CellState} from "../../api/types.ts";

interface BadgeProps {
    state: CellState
}

const STATE_COLOURS: Record<CellState, string> = {
    RUNNING:     "bg-green-100 text-green-800",
    IDLE:        "bg-gray-100 text-gray-700",
    FAULT:       "bg-red-100 text-red-800",
    MAINTENANCE: "bg-yellow-100 text-yellow-800",
    OFFLINE:     "bg-slate-100 text-slate-500",
    UNKNOWN:     "bg-purple-100 text-purple-700",
}

export function Badge({state}: BadgeProps) {
    const colorClass = STATE_COLOURS[state] || STATE_COLOURS.UNKNOWN;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
          {state}
        </span>
    );
}