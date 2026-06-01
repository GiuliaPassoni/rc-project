const pg = require('pg');
const fs = require('fs');

import { pool } from './client';

export async function runMigration() {
  try {
    console.log('Connecting to the database...');
    const migrateSql = fs.readFileSync('./src/db/migrate.sql', 'utf8');
    console.log('Running migration queries...');

    await pool.query(migrateSql);
    console.log('Tables created successfully.');

    console.log('Building composite telemetry index...');
    await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_events_cell_id_timestamp
    ON events (cell_id, timestamp DESC);
  `);

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('Database connection closed.');
  }
}

runMigration();
