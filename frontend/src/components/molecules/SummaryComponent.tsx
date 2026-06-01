import React from "react";

interface SummaryComponentProps {
    title: string,
    sideComponent?: React.ReactNode,
    children: React.ReactNode
}

export function SummaryComponent({title, sideComponent, children}: SummaryComponentProps) {
    return (
        <section
            className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-xl p-6 min-h-[140px] flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{title}</h3>
                {sideComponent}
            </div>
            {children}
        </section>
    )
}