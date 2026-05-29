import {useNavigate} from "react-router-dom";
import type {CellStatus} from "../../api/types.ts";
import {formatAbsoluteDate} from "../../utils/time.ts";
import {Badge} from "../atoms/Badge.tsx";

export function CellStatusCard(cellStatus: CellStatus) {
    const {cellId, state, since} = cellStatus;
    const navigate = useNavigate();

    function handleClick() {
        navigate(`/cell/${cellId}`)
    }

    return (
        <div onClick={handleClick} className="max-w-sm bg-gray-50 rounded-xl overflow-hidden shadow-lg p-12">
            <div className="flex flex-col justify-center items-center">
                <h3 className="text-gray-500 font-bold">Cell status</h3>
                <h4 className="text-gray-500">Cell ID: <code>{cellId}</code></h4>
                <div className="text-gray-500">Current State: <Badge state={state}/> since {formatAbsoluteDate(since)}
                </div>
            </div>
        </div>
    )
}