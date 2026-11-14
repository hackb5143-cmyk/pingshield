import { runMigrations, seedDemoData } from './db';

let initialized = false;

export function ensureDbInitialized() {
  if (initialized) return;
  runMigrations();
  if (process.env.SEED_DEMO_DATA === 'true') seedDemoData();
  initialized = true;
}
