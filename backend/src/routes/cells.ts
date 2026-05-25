import express from 'express';
import {
  getCellIds,
  getCellsState,
  getPriorEvent,
  getEventsByWindow,
  getRecentEvents,
} from '../db/queries';
import { parseWindow } from '../utils/windowParser';
import { computeMetrics } from './../metrics';
import { CellState } from '../types';

export const cellsRouter = express.Router();

cellsRouter.get('/', async (req, res, next) => {
  try {
    const ids = await getCellIds();
    res.json(ids);
  } catch (error) {
    next(error);
  }
});

// GET /cells/state -> Returns current state and since timestamp per cell
cellsRouter.get('/state', async (req, res, next) => {
  try {
    const states = await getCellsState();
    res.json(states);
  } catch (error) {
    next(error);
  }
});

// GET /cells/state/summary -> Returns count of cells per state derived from the same query
cellsRouter.get('/state/summary', async (req, res, next) => {
  try {
    const states = await getCellsState();

    const summary: Record<CellState, number> = {
      RUNNING: 0,
      IDLE: 0,
      FAULT: 0,
      MAINTENANCE: 0,
      OFFLINE: 0,
      UNKNOWN: 0,
    };

    for (const item of states) {
      const stateKey = item.state;

      if (stateKey in summary) {
        summary[stateKey as CellState]++;
      }
    }

    res.json(summary);
  } catch (error) {
    next(error);
  }
});

// GET /cells/:id/metrics?window=24h
cellsRouter.get('/:id/metrics', async (req, res, next) => {
  try {
    const cellId = req.params.id;
    const windowParam = req.query.window as string | undefined;

    const { windowStart, windowEnd } = parseWindow(windowParam);

    // 1. Check if the cell exists by verifying data
    const priorEvent = await getPriorEvent(cellId, windowStart);
    const windowEvents = await getEventsByWindow(
      cellId,
      windowStart,
      windowEnd,
    );

    // If there are no window events and no prior historical events, cell doesn't exist
    if (!priorEvent && windowEvents.length === 0) {
      res.status(404).json({ error: 'Cell not found' });
      return;
    }

    // 2. Prep the event list for computeMetrics.
    // To ensure computeDurations doesn't lose the time gap between windowStart and the first window event,
    // we inject the prior event clipped to windowStart if it exists.
    const historicalTimeline = [...windowEvents];
    if (priorEvent) {
      historicalTimeline.unshift({
        ...priorEvent,
        timestamp: windowStart, // Artificially align baseline status to window start
      });
    }

    // 3. Compute metrics
    const metrics = computeMetrics(historicalTimeline, windowStart, windowEnd);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

// GET /cells/:id/events?limit=50&offset=0
cellsRouter.get('/:id/events', async (req, res, next) => {
  try {
    const cellId = req.params.id;

    // Parse pagination parameters with fallbacks
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const events = await getRecentEvents(cellId, limit, offset);
    res.json(events);
  } catch (error) {
    next(error);
  }
});
