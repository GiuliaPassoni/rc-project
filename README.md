# rc-project

### _Work in Progress_

Mock telemetry data for a robotic cell, and a front end to view it.

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