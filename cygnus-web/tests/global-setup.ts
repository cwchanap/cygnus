import { execSync } from 'node:child_process';

async function globalSetup() {
  try {
    // Initialize local D1 database schema
    execSync('npm run db:setup', { stdio: 'inherit' });
  } catch (e) {
    console.error('Failed to set up database for tests:', e);
    throw e;
  }
}

export default globalSetup;
