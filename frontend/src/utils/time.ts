export const formatAbsoluteDate = (timestamp: string | number | Date): string => {
    const date = new Date(timestamp);

    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',   // e.g., May 27, 2026
        timeStyle: 'short',    // e.g., 11:25 AM
    }).format(date);
};

// todo ideally, replace with date-fns
export function formatDuration(seconds: number): string {
    if (seconds <= 0 || isNaN(seconds)) return '0s';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const parts: string[] = [];

    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    // Only display seconds if there are no larger units, or if there's a remainder
    if (remainingSeconds > 0 || parts.length === 0) {
        parts.push(`${remainingSeconds}s`);
    }

    return parts.join(' ');
};