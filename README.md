# rc-project

### _This project is a work in progress_

For a fictional robotic cell line, mock telemetry data, elaborate and store the data in a PostgreSQL database with
Express.js back-end, and show results in a React Tailwind UI to view it. Both back and front ends in TypeScript.

## Prerequisites

1. Docker
2. Python 3.8
3. Node.js 22+
4. pnpm

After cloning the repo, run ```pnpm install``` to install dependencies.

## Back End Set Up

1. Start the Docker container -> ```docker compose up -d```
2. Create empty tables and optimise indexes ->```npx ts-node src/db/migrate.ts```
3. Generate mock data using mockDataGenerator.py -> ```python mockDataGenerator.py```
4. Update `ingest.ts` with the name of the newly generated data
5. Ingest the raw telemetry stream -> ```npx ts-node src/ingest.ts```
6. Boot API layer -> ```pnpm run dev```

## Front End Set Up

1. Run ```pnpm run dev```

## Architecture

The pipeline runs as follows:

1. Create raw telemetry data in JSON format, with intentional quality issues (e.g.duplicated cell id, invalid timestamp,
   misspelt event name, a max timeframe of 30 days), using a (Gemini-Flash3.5-generated) Python script. For the JSON
   schema used as reference, see: backend/mock/normalised-event.schema.json.
2. Normaliser function (backend/src/normaliser.ts) cleans up data: creates deduplication id, screens compliant data vs
   data quality issues - each saved in a separate
   array. Returns `events` and `issues` arrays.
3. FSM (backend/src/machine.ts), modelled in xState v5, is fed the normalised data.
4. Ingest function (backend/src/ingest.ts) logs items in either `events` or `data_quality_issues` PostgreSQL tables.
   At first, it normalises the raw telemetry data with the normaliser fn. It sorts by timestamp and groups by cell id.
   Then, it feeds the events to the state machine, and does either of these two:
    5. if there is a change in state between subsequent events, i.e. if the FSM runs without issues, it computes the
       following state and logs the
       event into the `events` table;
    6. if no state change is detected, i.e. the FSM rejected the event, it logs `unknown` events and moves the FSM into
       `UNKNOWN`.
5. Metrics function (backend/src/metrics.ts) computes metrics, such as: uptime, downtime, idle time, fault rate, etc.
   These aren't stored in a table, but are computed on-demand on a full event scan, i.e. on the fly.
6. Express APIs (backend/src/db/queries.ts, backend/src/db/routes/cell.ts, backend/src/api.ts) query the database to
   return valuable
   information, such as: cell ids, cell statuses, cell events, fleet status. For cell events in particular, a composed
   index table (by cell_id and events) is referenced to speed up querying. The metrics are returned with an on-demand
   aggregation query. For relevant queries, a time window of either 24 hours, 7 days, or 30 days can be applied. A
   middleware handles errors and type case
   conversion (snake_case to camelCase).
7. The front end, built in React (TypeScript), calls the exposed APIs and renders the data accordingly. TanStack Query
   is used to handle API calls, incl. loading and error states. Tailwind CSS is used for styling. Fleet information is
   available on
   the Fleet Summary page, whereas cell-specific information, including metrics charts built in Rechart.js, are
   available on the individual cell's page.
8. Real-time updates are mocked using TanStack Query's in-built `refetch_Interval` every 30 seconds.

## Folder Structure

```aiignore
.
└── rc-project/
    ├── backend/
    │   ├── src/
    │   │   ├── db/
    │   │   │   ├── client.ts
    │   │   │   ├── migrate.sql
    │   │   │   ├── migrate.ts
    │   │   │   └── queries.ts
    │   │   ├── mock/
    │   │   │   ├── mockGenerator.py
    │   │   │   ├── normalised-event.schema.sql
    │   │   │   └── //generate mock data
    │   │   ├── routes/
    │   │   │   └── cell.ts
    │   │   ├── utils
    │   │   ├── api.ts
    │   │   ├── ingest.ts
    │   │   ├── machine.ts
    │   │   ├── metrics.ts
    │   │   ├── normliaser.ts
    │   │   └── types.ts
    │   ├── tests
    │   └── //.env, configs, etc.
    ├── frontend/
    │   ├── src/
    │   │   ├── api/
    │   │   │   ├── client.ts
    │   │   │   └── queries.ts
    │   │   ├── components/
    │   │   │   ├── atoms
    │   │   │   ├── molecules
    │   │   │   └── organisms
    │   │   ├── hooks
    │   │   ├── pages
    │   │   └── utils
    │   ├── App.tsx
    │   ├── App.css
    │   ├── index.css
    │   └── main.tsx
    └── // .env, configs, etc
```

## Assumptions and Limitations

- Synthetic `unknown` events (which were rejected by the FSM) are written to the events table to preserve metric
  consistency,
  and separately to `data_quality_log` for auditing.
- `MAINTENANCE` always returns to `IDLE`, never directly to `RUNNING`.
- Silent gaps are attributed to the last known state. `UNKNOWN` is only entered when the FSM
  actively rejects an event. A production system would use per-state thresholds to detect silence and inject `unknown`
  events accordingly.
- Orphaned cycles are excluded from metric computation.
- Two events with identical `cellId + timestamp + eventType` but different payloads — one is silently dropped.
  Production alternative: UUID assigned by the cell firmware, or a per-cell sequence number.
- Metrics computed on request from the full event log. Acceptable at this scale. Production evolution: materialised view
  or scheduled recomputation.
- Gap threshold for silence detection is out of scope for this project.
- If present in raw data, any event not conforming to the type is discarded as unrecognised in `normaliser.ts`.
- Metrics are window-anchored. The gap between `windowStart` and the first event in the window is attributed to the last
  known state prior to the window, defaulting to `UNKNOWN` if no prior event exists. This ensures the consistency
  equation holds against the full window duration.

For more details, see _Detailed Design Notes_ below.

## How would this scale to production?

- Authentication and per-user dashboard and cell access (out of scope for a project like this).
- Near real-time ingestion with message queues, e.g. Rabbit MQ, to handle a continuous stream of data from a cell.
- To optimise querying e.g. metrics or events for larger event volumes, rather than on-demand
  aggregation query that reads from db and computes them on the fly:
    - A materialised view refreshed every minute or after each ingest batch — fast reads, slight staleness acceptable
      for a dashboard; or,
    - A time-series database (TimescaleDB, which is a Postgres extension) with continuous aggregates — designed
      specifically for this workload.
- Structured logs and health monitor endpoint, to check if the system is alive and keep track of everything.
- Web sockets - more efficient than polling the server every 30 seconds with TanStack, as in current set-up - especially
  with larger databases.
- WebRTC integration to allow real-time video streaming of cell telemetry.

## Screenshots (TODO)

Dashboard view:

Fleet Summary view:

Cell Dashboard view:

FSM (xState/stately.ai):

### Detailed Design Notes (TODO)

[//]: # (//TODO add tables and notes from PHase 0 and 1)