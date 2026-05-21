import { isRawEvent, normaliseEventType } from './utils/normaliserUtils';
import {
  DataQualityIssue,
  EventType,
  NormalisedEvent,
  NormaliseResult,
} from './types';

export function normaliseEvent(
  raw: unknown,
): NormalisedEvent | DataQualityIssue {
  if (!isRawEvent(raw)) {
    return { cellId: null, reason: 'event is not an object', raw };
  }

  const { cellId, timestamp, eventType, payload } = raw;

  const missingFields = (['cellId', 'timestamp', 'eventType'] as const).filter(
    (field) => !raw[field],
  );
  if (missingFields.length > 0) {
    return {
      cellId: typeof cellId === 'string' ? cellId : null,
      reason: `missing required fields: ${missingFields.join(', ')}`,
      raw,
    };
  }

  if (typeof cellId !== 'string') {
    return { cellId: null, reason: 'cellId is not a string', raw };
  }
  if (typeof timestamp !== 'string') {
    return { cellId, reason: 'timestamp is not a string', raw };
  }
  if (typeof eventType !== 'string') {
    return { cellId, reason: 'eventType is not a string', raw };
  }

  const normalisedEventType = normaliseEventType(eventType);
  if (!normalisedEventType) {
    return {
      cellId,
      reason: `unrecognised event type: "${eventType}"`,
      raw,
    };
  }

  const parsedTimestamp = new Date(timestamp);
  if (isNaN(parsedTimestamp.getTime())) {
    return { cellId, reason: 'timestamp is not parseable', raw };
  }

  const normalisedPayload =
    typeof payload === 'object' && payload !== null && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};

  const id = `${cellId}-${parsedTimestamp.toISOString()}-${normalisedEventType}`;

  return {
    id,
    cellId,
    timestamp: parsedTimestamp,
    eventType: normalisedEventType,
    payload: normalisedPayload,
    raw,
  };
}

console.log(normaliseEvent);

// export function normalise(Raws: unknown[]): NormaliseResult {
//
// }
