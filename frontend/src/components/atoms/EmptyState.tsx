import React from "react";

interface EmptyStateProps {
    message: string
}

export function EmptyState({message}: EmptyStateProps = {message: "No data"}) {
    return (
        <div
            className="w-full h-[360px] bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center p-6 text-center">
            <h4 className="text-sm font-semibold text-slate-200">No Telemetry Recorded</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
                {message}
            </p>
        </div>
    )
}