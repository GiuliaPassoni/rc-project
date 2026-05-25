function subHours(date: Date, hours: number): Date {
  return new Date(date.getTime() - hours * 60 * 60 * 1000);
}

function subDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

export function parseWindow(param: string | undefined): {
  windowStart: Date;
  windowEnd: Date;
} {
  const now = new Date();
  switch (param) {
    case '7d':
      return { windowStart: subDays(now, 7), windowEnd: now };
    case '30d':
      return { windowStart: subDays(now, 30), windowEnd: now };
    case '24h':
    default:
      return { windowStart: subHours(now, 24), windowEnd: now };
  }
}
