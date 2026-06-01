import React, {useState} from 'react';
import {LoadingSpinner} from "../../components/atoms/LoadingSpinner.tsx";
import {CellStatusCard} from "../../components/molecules/CellStatusCard.tsx";
import {FleetSummary} from "../../components/organisms/FleetSummary.tsx";
import {MultiCellComparison} from "../../components/organisms/MultiCellComparison.tsx";
import {useCellsStatus, useStatusSummary} from "../../hooks/useCell.ts";

export function FleetPage() {

    const [searchTerm, setSearchTerm] = useState<string>('');

    const {data: summary, isLoading: isLoadingSummary} = useStatusSummary()
    const {data: cellsStatus, isLoading: isLoadingCellsStatus} = useCellsStatus()

    if (isLoadingSummary || isLoadingCellsStatus) return <LoadingSpinner/>

    const cellIdsForComparison = cellsStatus?.map((c) => c.cellId) ?? [];

    return (
        <div className="space-y-6">
            {summary && <FleetSummary {...summary}/>}
            {cellIdsForComparison.length > 0 && (
                <MultiCellComparison cellIds={cellIdsForComparison} window={window}/>
            )}
            <section>
                <div className="
                lg:col-span-3 bg-slate-950 border border-slate-800 rounded-xl p-6 min-h-[140px] flex flex-col justify-between"
                >
                    <div className="w-full flex space-between items-center gap-2 mb-4">
                        <div>
                            Click on a cell card to open the detailed cell view, or
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="search by cell ID (case sensitive)"
                                className="w-full px-4 py-2 border border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                }}
                            />
                        </div>
                    </div>
                    <div className="
                grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10
                ">
                        {cellsStatus && cellsStatus.length > 0 && (
                            cellsStatus.filter(c => c.cellId.includes(searchTerm)).map((cellStatus, cellId) =>
                                <CellStatusCard key={cellId} {...cellStatus}/>
                            )
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}