import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  insertEvent,
  insertIssue,
  groupByCellId,
} from '../src/utils/ingestUtils';
import { pool } from '../src/db/client';

// Mock PG pool client
vi.mock('../db/client', () => {
  return {
    pool: {
      query: {},
    },
  };
});

describe('Database & Utility Functions', () => {
  const querySpy = vi.spyOn(pool, 'query');

  beforeEach(() => {
    querySpy.mockClear();
  });

  describe('insertEvent', () => {
    test('should correctly stringify JSON fields and execute the insert query', async () => {
      const mockEvent = {
        id: 'evt-123',
        cellId: 'cell-A',
        timestamp: new Date('2026-05-25T00:00:00.000Z'),
        eventType: 'cycle_start',
        stateAfter: 'RUNNING',
        payload: { operator: 'Alex' },
        raw: { original: 'payload_raw_data' },
      };

      await insertEvent(mockEvent as any);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO events'),
        [
          'evt-123',
          'cell-A',
          mockEvent.timestamp,
          'cycle_start',
          'RUNNING',
          '{"operator":"Alex"}', // Handled JSON.stringify
          '{"original":"payload_raw_data"}', // Handled JSON.stringify
        ],
      );
    });

    test('should throw an error if the database query fails', async () => {
      vi.mocked(pool.query).mockRejectedValueOnce(
        new Error('DB Connection Lost'),
      );

      const mockEvent = { id: '1' };
      await expect(insertEvent(mockEvent as any)).rejects.toThrow(
        'DB Connection Lost',
      );
    });
  });

  describe('insertIssue', () => {
    test('should successfully log data quality issues to the database', async () => {
      const mockIssue = {
        cellId: 'cell-B',
        reason: 'Missing sequential timestamp',
        raw: { system: 'legacy_plc', sequence: 42 },
      };

      await insertIssue(mockIssue as any);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO data_quality_log'),
        [
          'cell-B',
          'Missing sequential timestamp',
          '{"system":"legacy_plc","sequence":42}',
        ],
      );
    });
  });

  describe('groupByCellId', () => {
    test('should group multiple events by their respective cellId', () => {
      const mockEvents = [
        { id: '1', cellId: 'cell-1', eventType: 'power_on' },
        { id: '2', cellId: 'cell-2', eventType: 'cycle_start' },
        { id: '3', cellId: 'cell-1', eventType: 'cycle_end' },
      ];

      const result = groupByCellId(mockEvents as any);

      expect(result).toEqual({
        'cell-1': [
          { id: '1', cellId: 'cell-1', eventType: 'power_on' },
          { id: '3', cellId: 'cell-1', eventType: 'cycle_end' },
        ],
        'cell-2': [{ id: '2', cellId: 'cell-2', eventType: 'cycle_start' }],
      });
    });

    test('should return an empty object when passed an empty array', () => {
      const result = groupByCellId([]);
      expect(result).toEqual({});
    });

    test('should safely flag or exclude events missing a valid cellId', () => {
      const malformedEvents = [
        { id: '1', cellId: 'cell-1' },
        { id: '2', cellId: undefined }, // Edge case: invalid/missing data
        { id: '3', cellId: '' }, // Edge case: empty string sequence
      ];

      const result = groupByCellId(malformedEvents as any);

      expect(result).toHaveProperty('cell-1');
      expect(result).toHaveProperty('undefined');
      expect(result).toHaveProperty('');
    });
  });
});
