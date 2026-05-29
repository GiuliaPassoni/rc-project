import type {FleetSummaryProps} from "../../api/types.ts";

export function FleetSummary({running, idle, fault, maintenance, offline, unknown}: FleetSummaryProps) {
    const cellClass = 'mx-2 my-1 px-2 py-1 border border-gray-300 rounded'

    // fixme style

    return (
        <table>
            <tbody>
            <tr>
                <td className={cellClass}>Running: {running}</td>
                <td className={cellClass}>Idle: {idle}</td>
                <td className={cellClass}>Fault: {fault}</td>
                <td className={cellClass}>Maintenance: {maintenance}</td>
                <td className={cellClass}>Offline: {offline}</td>
                <td className={cellClass}>Unknown: {unknown}</td>
            </tr>
            </tbody>
        </table>
    )
}