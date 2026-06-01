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
        <div onClick={handleClick}
             className="max-w-sm bg-slate-900 rounded-xl overflow-hidden shadow-lg p-12 hover:cursor-pointer">
            <div className="flex flex-col justify-between">
                <h4 className="text-slate-300"><code>{cellId}</code></h4>
                <div className="text-slate-300"><Badge state={state}/> since {formatAbsoluteDate(since)}
                </div>
            </div>
        </div>
    )
}