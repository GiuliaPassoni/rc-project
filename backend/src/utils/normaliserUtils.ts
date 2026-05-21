import { DataQualityIssue, NormalisedEvent } from '../types';

const EVENT_TYPE_MAP: Record<string, EventType> = {
  cyclestart: 'cycle_start',
  cycleend: 'cycle_end',
  fault: 'fault',
  faultcleared: 'fault_cleared',
  maintenancestart: 'maintenance_start',
  maintenanceend: 'maintenance_end',
  poweroff: 'power_off',
  poweron: 'power_on',
};

export function normaliseEventType(rawEventType: unknown): EventType | null {
  if (!rawEventType || typeof rawEventType !== 'string') {
    return null;
  }
  const sanitized = rawEventType.replace(/[\s\W+_]/g, '').toLowerCase();
  return EVENT_TYPE_MAP[sanitized] ?? null;
}

export function isRawEvent(raw: unknown): raw is Record<string, unknown> {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw);
}

export function isNormalisedEvent(
  parsedRawData: NormalisedEvent | DataQualityIssue,
): parsedRawData is NormalisedEvent {
  return 'id' in parsedRawData && 'eventType' in parsedRawData;
}
