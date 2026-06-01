import React from "react";
import {LoadingSpinner} from "../atoms/LoadingSpinner.tsx";

interface CellChartCardProps {
    chartTitle: string,
    children: React.ReactNode,
    isLoading?: boolean,
    sideNote?: string
    subTitle?: string,
    className?: string
}

export function CellChartCard({
                                  chartTitle,
                                  children,
                                  isLoading,
                                  sideNote,
                                  subTitle,
                                  className = ""
                              }: CellChartCardProps) {
    return (
        <div
            className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between h-[420px] ${className}`}>
            <div className="border-b border-slate-800 pb-3 mb-4 flex flex-row justify-between items-center">
                <div className="flex flex-col items-center">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        {chartTitle}
                    </h3>
                    {subTitle && <p className="text-[10px] py-0.5 text-slate-400 font-sans">
                        {subTitle}
                    </p>}
                </div>
                {/*CARD POINTER AND WHITE BG*/}
                {sideNote &&
                    <span
                        className="text-[10px] font-mono px-2 py-0.5 text-slate-400"
                    >
                        {sideNote}
                    </span>
                }
            </div>

            <div className="flex-1 w-full min-h-0">
                {isLoading &&
                    <LoadingSpinner/>
                }
                {children}
            </div>
        </div>
    )
}