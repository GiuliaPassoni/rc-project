import {CellStatusCard} from "../../components/molecules/CellStatusCard.tsx";
import {FleetSummary} from "../../components/organisms/FleetSummary.tsx";
import {useCellsStatus, useStatusSummary} from "../../hooks/useCell.ts";

export function FleetPage() {
    const {data: summary, isLoading: isLoadingSummary} = useStatusSummary()
    const {data: cellsStatus, isLoading: isLoadingCellsStatus} = useCellsStatus()

    if (isLoadingSummary || isLoadingCellsStatus) return (
        <div>Loading...</div>
    )

    return (
        <>
            <FleetSummary {...summary}/>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">

                {
                    cellsStatus && cellsStatus.length > 0 && (
                        cellsStatus.map(cellStatus =>
                            <CellStatusCard {...cellStatus}/>
                        )
                    )
                }
            </div>
        </>
    )
}