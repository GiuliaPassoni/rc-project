export function durationSeconds(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / 1000;
}

export function floorToHour(date: Date): Date {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d;
}

export function clamp(date: Date, min: Date, max: Date): Date {
  if (date < min) return min;
  if (date > max) return max;
  return date;
}
