import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const webRoot = join(__dirname, '..', 'cygnus-web');

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: 'http://localhost:8788',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'bun run dev:wrangler',
    cwd: webRoot,
    url: 'http://localhost:8788',
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  globalSetup: './tests/global-setup.ts',
});
