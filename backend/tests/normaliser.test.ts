import { describe, expect, test } from 'vitest';
import { normaliseEvent } from '../src/normaliser';

describe('Normaliser fn', () => {
  test('normalises valid raw data correctly', () => {
    const mockValidRawData = {
      cellId: '1234567890',
      timestamp: '2023-01-01T00:00:00.000Z',
      eventType: 'cycle_start',
      payload: {
        cycle: 1,
        cycleDuration: 10,
      },
    };

    expect(normaliseEvent(mockValidRawData)).toEqual({
      id: '1234567890-2023-01-01T00:00:00.000Z-cycle_start',
      cellId: '1234567890',
      timestamp: new Date('2023-01-01T00:00:00.000Z'),
      eventType: 'cycle_start',
      payload: {
        cycle: 1,
        cycleDuration: 10,
      },
      raw: mockValidRawData,
    });
  });
  test('discards invalid raw data correctly', () => {
    const mockInvalidRawData = 'not-an-object';

    const result = normaliseEvent(mockInvalidRawData);

    expect(result).toEqual({
      cellId: null,
      reason: 'event is not an object',
      raw: mockInvalidRawData,
    });
  });

  test('discards valid raw data with invalid cellId correctly', () => {
    const mockInvalidCellId = {
      cellId: 1234567890,
      timestamp: '2023-01-01T00:00:00.000Z',
      eventType: 'cycle_start',
      payload: {
        cycle: 1,
        cycleDuration: 10,
      },
    };
    const result = normaliseEvent(mockInvalidCellId);
    expect(result).toEqual({
      cellId: null,
      reason: 'cellId is not a string',
      raw: mockInvalidCellId,
    });
  });

  test('discards valid raw data with invalid timestamp correctly', () => {
    const badTimestampRaw = {
      cellId: 'CELL_01',
      timestamp: 'not-a-valid-date-string',
      eventType: 'cycle_start',
      payload: { cycle: 42 },
    };

    const result = normaliseEvent(badTimestampRaw);

    expect(result).toEqual({
      cellId: 'CELL_01',
      reason: 'timestamp is not parseable',
      raw: badTimestampRaw,
    });
  });
  test('discards valid raw data with invalid eventType correctly', () => {
    const invalidEventTypeRaw = {
      cellId: 'CELL_01',
      timestamp: '2026-05-01T12:00:00.000Z',
      eventType: 'broken_telemetry_ping', // Invalid: does not exist in canonical variants
      payload: { cycle: 42 },
    };

    const result = normaliseEvent(invalidEventTypeRaw);

    expect(result).toEqual({
      cellId: 'CELL_01',
      reason: 'unrecognised event type: "broken_telemetry_ping"',
      raw: invalidEventTypeRaw,
    });
  });
});
