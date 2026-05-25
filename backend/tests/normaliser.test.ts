import { describe, expect, test } from 'vitest';
import { normaliseEvent, normaliseBatchTelemetry } from '../src/normaliser';

describe('normaliseEvent (single telemetry event)', () => {
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
    const mockInvalidTimestampRaw = {
      cellId: 'CELL_01',
      timestamp: 'not-a-valid-date-string',
      eventType: 'cycle_start',
      payload: { cycle: 42 },
    };

    const result = normaliseEvent(mockInvalidTimestampRaw);

    expect(result).toEqual({
      cellId: 'CELL_01',
      reason: 'timestamp is not parseable',
      raw: mockInvalidTimestampRaw,
    });
  });
  test('discards valid raw data with invalid eventType correctly', () => {
    const invalidEventTypeRaw = {
      cellId: 'CELL_01',
      timestamp: '2026-05-01T12:00:00.000Z',
      eventType: 'broken_telemetry_ping',
      payload: { cycle: 42 },
    };

    const result = normaliseEvent(invalidEventTypeRaw);

    expect(result).toEqual({
      cellId: 'CELL_01',
      reason: 'unrecognised event type: "broken_telemetry_ping"',
      raw: invalidEventTypeRaw,
    });
  });

  test('correctly parses invalid payload as {}', () => {
    const mockInvalidPayloadRaw = {
      id: '1234567890-2023-01-01T00:00:00.000Z-cycle_start',
      cellId: '1234567890',
      timestamp: '2023-01-01T00:00:00.000Z',
      eventType: 'cycle_start',
      payload: 'hello',
    };

    const result = normaliseEvent(mockInvalidPayloadRaw);

    expect(result).toEqual({
      id: '1234567890-2023-01-01T00:00:00.000Z-cycle_start',
      cellId: '1234567890',
      timestamp: new Date('2023-01-01T00:00:00.000Z'),
      eventType: 'cycle_start',
      payload: {},
      raw: mockInvalidPayloadRaw,
    });
  });
});

describe('normaliseBatchTelemetry', () => {
  test('should sort perfectly valid payloads entirely into the events bucket', () => {
    const perfectlyValidBatch = [
      {
        cellId: 'CELL_01',
        timestamp: '2026-05-01T08:00:00.000Z',
        eventType: 'cycle_start',
        payload: { cycleId: 'cyc_101' },
      },
      {
        cellId: 'CELL_01',
        timestamp: '2026-05-01T08:02:00.000Z',
        eventType: 'cycle_end',
        payload: { cycleId: 'cyc_101' },
      },
    ];

    const result = normaliseBatchTelemetry(perfectlyValidBatch);

    expect(result.events).toHaveLength(2);
    expect(result.issues).toHaveLength(0);

    expect(result.events[0].id).toBe(
      'CELL_01-2026-05-01T08:00:00.000Z-cycle_start',
    );
    expect(result.events[1].id).toBe(
      'CELL_01-2026-05-01T08:02:00.000Z-cycle_end',
    );
  });

  test('should accurately split a chaotic stream into both events and issues collections', () => {
    const dirtyBatch = [
      // Valid event
      {
        cellId: 'CELL_02',
        timestamp: '2026-05-01T09:00:00.000Z',
        eventType: 'fault',
        payload: { code: 'E_STOP' },
      },
      // Data quality issue - bad date format
      {
        cellId: 'CELL_02',
        timestamp: 'unparseable-date-string',
        eventType: 'maintenance_start',
        payload: {},
      },
      // Valid event  (testing casing normalization variant)
      {
        cellId: 'CELL_03',
        timestamp: '2026-05-01T09:15:00.000Z',
        eventType: 'CYCLE_START',
        payload: { cycleId: 'cyc_500' },
      },
      // Data quality issue: Missing required properties
      {
        timestamp: '2026-05-01T09:20:00.000Z',
        eventType: 'cycle_end',
        payload: {},
      },
    ];

    const result = normaliseBatchTelemetry(dirtyBatch);

    expect(result.events).toHaveLength(2);
    expect(result.issues).toHaveLength(2);

    expect(result.events[0]).toMatchObject({
      cellId: 'CELL_02',
      eventType: 'fault',
    });
    expect(result.events[1]).toMatchObject({
      cellId: 'CELL_03',
      eventType: 'cycle_start',
    });

    expect(result.issues[0]).toMatchObject({
      cellId: 'CELL_02',
      reason: 'timestamp is not parseable',
    });
    expect(result.issues[1]).toMatchObject({
      cellId: null, // missing cellId
      reason: 'missing required fields: cellId',
    });
  });
});
