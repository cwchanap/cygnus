import { execSync } from 'node:child_process';
import { repoPath } from './utils/paths';

const DB_SETUP_MAX_ATTEMPTS = 3;
const DB_SETUP_RETRY_DELAY_MS = 1_500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function runDbSetupOnce() {
  execSync('bun run db:setup', {
    cwd: repoPath(),
    stdio: 'inherit',
    timeout: 60_000,
    killSignal: 'SIGTERM',
  });
}

async function globalSetup() {
  // Allow local runs to skip DB initialization when wrangler D1 is unavailable
  if (process.env.SKIP_DB_SETUP === '1') {
    console.warn('[global-setup] SKIP_DB_SETUP=1 detected, skipping D1 init');
    return;
  }

  try {
    // Initialize local D1 database schema (retry to handle intermittent wrangler/Nx flakiness)
    for (let attempt = 1; attempt <= DB_SETUP_MAX_ATTEMPTS; attempt += 1) {
      try {
        runDbSetupOnce();
        return;
      } catch (error) {
        if (attempt === DB_SETUP_MAX_ATTEMPTS) {
          throw error;
        }

        console.warn(
          `[global-setup] db:setup attempt ${attempt}/${DB_SETUP_MAX_ATTEMPTS} failed; retrying...`,
        );
        await sleep(DB_SETUP_RETRY_DELAY_MS);
      }
    }
  } catch (e) {
    console.error('Failed to set up database for tests:', e);
    throw e;
  }
}

export default globalSetup;
