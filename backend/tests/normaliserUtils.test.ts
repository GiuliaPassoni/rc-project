import { describe, expect, test } from 'vitest';
import {
  isNormalisedEvent,
  isRawEvent,
  normaliseEventType,
} from '../src/utils/normaliserUtils';

describe('normaliseEventType', () => {
  test('normalise event correctly screens values', () => {
    const mockTypo = 'cycle_strat';
    expect(normaliseEventType(mockTypo)).toEqual(null);

    const mockPunctuation = 'cycle.start';
    expect(normaliseEventType(mockPunctuation)).toEqual('cycle_start');

    const mockCamelCase = 'cycleStart';
    expect(normaliseEventType(mockCamelCase)).toEqual('cycle_start');

    const mockUnrecognised = 'online';
    expect(normaliseEventType(mockUnrecognised)).toBe(null);
  });
});

describe('isRawEvent', () => {
  test('check raw shape is cast correctly with valid raw data', () => {
    const validRaw = {
      cellId: '1234567890',
      timestamp: '2023-01-01T00:00:00.000Z',
      eventType: 'cycle_start',
      payload: {
        cycleId: '1234567890',
        cycleDuration: 1234567890,
      },
    };

    expect(isRawEvent(validRaw)).toBe(true);
  });

  test('check raw shape is cast correctly with invalid raw data', () => {
    const invalidRaw = 'just a string';

    expect(isRawEvent(invalidRaw)).toBe(false);
  });
});

describe('isNormalisedEvent', () => {
  test('check fn returns true for normalised event', () => {
    const mockNormalisedEvent = {
      id: '1234567890-2023-01-01T00:00:00.000Z-cycle_start',
      cellId: '1234567890',
      timestamp: new Date('2023-01-01T00:00:00.000Z'),
      eventType: 'cycle_start',
      payload: {
        cycle: 1,
        cycleDuration: 10,
      },
      raw: {
        cellId: '1234567890',
        timestamp: '2023-01-01T00:00:00.000Z',
        eventType: 'cycle_start',
        payload: {
          cycle: 1,
          cycleDuration: 10,
        },
      },
    };

    const result = isNormalisedEvent(mockNormalisedEvent);

    expect(result).toBe(true);
  });

  test('check fn returns false for data quality issue', () => {
    const mockDataQualityIssue = {
      cellId: '123',
      reason: 'event is not an object',
      raw: 'not-an-object',
    };

    const result = isNormalisedEvent(mockDataQualityIssue);

    expect(result).toBe(false);
  });
});
