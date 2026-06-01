import React from "react";
import {LoadingSpinner} from "../atoms/LoadingSpinner.tsx";
import {StatTile} from "../atoms/StatTile.tsx";

export interface Tile {
    label: string;
    value: string;
}

interface SummaryComponentProps {
    title: string;
    sideComponent?: React.ReactNode;
    tiles: Tile[];
    isLoading?: boolean;
}

export function SummaryComponent({title, sideComponent, tiles, isLoading}: SummaryComponentProps) {
    return (
        <section
            className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-xl p-6 min-h-[140px] flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{title}</h3>
                {sideComponent}
            </div>
            {isLoading ? <LoadingSpinner/> : (
                <div className="grid grid-cols-3 gap-4 h-full items-center">
                    {tiles.map(({label, value}) => (
                        <StatTile key={label} label={label} value={value}/>
                    ))}
                </div>
            )}
        </section>
    );
}
