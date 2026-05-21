import { describe, expect, test } from 'vitest';
import { isRawEvent, normaliseEventType } from '../src/utils/normaliserUtils';

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
