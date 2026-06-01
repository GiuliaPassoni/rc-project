import React from "react";

interface TimeWindowSelectorProps {
    timeWindows: string[],
    window: string,
    setWindow: (window: string) => void
}

export function TimeWindowSelector({timeWindows, window, setWindow}: TimeWindowSelectorProps) {
    return (
        <div className="flex items-center bg-slate-900 p-1 border border-slate-800 rounded-lg shadow-inner">
            {timeWindows.map((w) => (
                <button
                    key={w}
                    onClick={() => setWindow(w)}
                    className={`min-w-[60px] px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        window === w
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-200 hover:text-slate-100 hover:bg-slate-600/50'
                    }`}
                >
                    {w}
                </button>
            ))}
        </div>
    )
}