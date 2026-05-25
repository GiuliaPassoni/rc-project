import { describe, test, expect } from 'vitest';
import { createActor } from 'xstate';
import { machine } from '../src/machine';

describe('Robotic Cell State Machine (XState v5)', () => {
  test('should start in the IDLE state', () => {
    const actor = createActor(machine).start();

    expect(actor.getSnapshot().value).toBe('IDLE');
  });

  describe('Happy Path Operations', () => {
    test('should cycle from IDLE to RUNNING and back to IDLE', () => {
      const actor = createActor(machine).start();

      actor.send({ type: 'cycle_start' });
      expect(actor.getSnapshot().value).toBe('RUNNING');

      actor.send({ type: 'cycle_end' });
      expect(actor.getSnapshot().value).toBe('IDLE');
    });
  });

  describe('Fault & Maintenance Flow', () => {
    test('should handle faults from IDLE and move to MAINTENANCE', () => {
      const actor = createActor(machine).start();

      actor.send({ type: 'fault' });
      expect(actor.getSnapshot().value).toBe('FAULT');

      actor.send({ type: 'maintenance_start' });
      expect(actor.getSnapshot().value).toBe('MAINTENANCE');

      actor.send({ type: 'maintenance_end' });
      expect(actor.getSnapshot().value).toBe('IDLE');
    });

    test('should handle faults while RUNNING', () => {
      const actor = createActor(machine).start();

      actor.send({ type: 'cycle_start' });
      actor.send({ type: 'fault' });

      expect(actor.getSnapshot().value).toBe('FAULT');
    });
  });

  describe('Power Management (Offline/Online)', () => {
    const allStates = [
      { start: 'IDLE', setup: () => {} },
      { start: 'RUNNING', setup: (a) => a.send({ type: 'cycle_start' }) },
      { start: 'FAULT', setup: (a) => a.send({ type: 'fault' }) },
      {
        start: 'MAINTENANCE',
        setup: (a) => {
          a.send({ type: 'fault' });
          a.send({ type: 'maintenance_start' });
        },
      },
    ];

    it.each(allStates)(
      'should transition to OFFLINE from %s when power is turned off',
      ({ setup }) => {
        const actor = createActor(machine).start();
        setup(actor);

        actor.send({ type: 'power_off' });
        expect(actor.getSnapshot().value).toBe('OFFLINE');
      },
    );

    test('should wake up into IDLE from OFFLINE when powered on', () => {
      const actor = createActor(machine).start();
      actor.send({ type: 'power_off' });

      actor.send({ type: 'power_on' });
      expect(actor.getSnapshot().value).toBe('IDLE');
    });
  });

  describe('Invalid Transitions (No-ops)', () => {
    test('should ignore cycle_end when already IDLE', () => {
      const actor = createActor(machine).start();

      actor.send({ type: 'cycle_end' });
      // Stays IDLE because cycle_end isn't valid on IDLE
      expect(actor.getSnapshot().value).toBe('IDLE');
    });
  });
});
