import { execSync } from 'node:child_process';
import { repoPath } from './utils/paths';

async function globalSetup() {
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
