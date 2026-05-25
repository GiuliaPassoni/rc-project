import { test, expect } from 'vitest';
import {
  durationSeconds,
  floorToHour,
  clamp,
} from './../src/utils/metricsUtils';

test('durationSeconds calculates exact delta in seconds', () => {
  const from = new Date('2026-05-25T12:00:00Z');
  const to = new Date('2026-05-25T12:05:30Z'); // 5 minutes and 30 seconds later

  const result = durationSeconds(from, to);

  expect(result).toBe(330);
});

test('floorToHour zeroes out minutes, seconds, and milliseconds', () => {
  const input = new Date('2026-05-25T12:34:56.789Z');
  const expected = new Date('2026-05-25T12:00:00.000Z');

  const result = floorToHour(input);

  expect(result.getTime()).toBe(expected.getTime());
});

test('clamp restricts dates within a strict minimum and maximum boundary', () => {
  const min = new Date('2026-05-25T12:00:00Z');
  const max = new Date('2026-05-25T13:00:00Z');

  const tooEarly = new Date('2026-05-25T11:45:00Z');
  const tooLate = new Date('2026-05-25T13:15:00Z');
  const inRange = new Date('2026-05-25T12:30:00Z');

  expect(clamp(tooEarly, min, max).getTime()).toBe(min.getTime());
  expect(clamp(tooLate, min, max).getTime()).toBe(max.getTime());
  expect(clamp(inRange, min, max).getTime()).toBe(inRange.getTime());
});
