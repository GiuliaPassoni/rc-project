import {format, parseISO} from "date-fns";

export function formatXAxis(isoString: string, timeWindow: '24h' | '7d' | '30d') {
    try {
        const date = parseISO(isoString);
        return timeWindow === '24h'
            ? format(date, 'HH:mm')
            : format(date, 'MMM dd');
    } catch {
        return isoString;
    }
}

export function formatTooltipLabel(isoString: string): string {
    try {
        return `Time: ${format(parseISO(isoString), 'yyyy-MM-dd HH:mm')} UTC`;
    } catch {
        return isoString;
    }
}