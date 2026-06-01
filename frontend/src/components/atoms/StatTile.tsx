import React from 'react';

interface StatTileProps {
    label: string;
    value: string;
}

export function StatTile({label, value}: StatTileProps) {
    return (
        <div className="bg-slate-900 border border-slate-800/60 p-3 rounded-lg text-slate-300 text-xs font-mono">
            {label}: {value}
        </div>
    );
}
