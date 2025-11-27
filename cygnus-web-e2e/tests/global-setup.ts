import { execSync } from 'node:child_process';
import { repoPath } from './utils/paths';

async function globalSetup() {
  // Allow local runs to skip DB initialization when wrangler D1 is unavailable
  if (process.env.SKIP_DB_SETUP === '1') {
    console.warn('[global-setup] SKIP_DB_SETUP=1 detected, skipping D1 init');
    return;
  }

  try {
    // Initialize local D1 database schema
    execSync('bun run db:setup', {
      cwd: repoPath(),
      stdio: 'inherit',
    });
  } catch (e) {
    console.error('Failed to set up database for tests:', e);
    throw e;
  }
}

export default globalSetup;
