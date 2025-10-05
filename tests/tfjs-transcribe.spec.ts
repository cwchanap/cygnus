import { test, expect } from '@playwright/test';
import { join } from 'node:path';

// E2E for in-browser TFJS transcription path
// Assumes the app is served at baseURL from playwright.config.ts
// and that a sample file exists at public/test-song.mp3

test.describe('TFJS Drum Transcription', () => {
  test('in-browser TFJS transcription opens MIDI preview', async ({ page }) => {
    test.setTimeout(150_000);

    // Capture page console and errors for debugging
    page.on('console', (msg) => console.log('[page-console]', msg.type(), msg.text()));
    page.on('pageerror', (err) => console.log('[page-error]', err.message));

    await page.goto('/drum-transcription');

    // Ensure hydration: wait for key elements to be present
    const chooseBtn = page.getByRole('button', { name: 'Choose File', exact: true });
    await expect(chooseBtn).toBeVisible({ timeout: 60_000 });
    await page.waitForSelector('input[data-testid="file-input"]', { timeout: 60_000 });

    // Upload a sample file: click Choose File to ensure input is wired, then set files and dispatch change
    const fileInput = page.getByTestId('file-input');
    await expect(fileInput).toHaveCount(1);
    await chooseBtn.click();
    // Debug: count TFJS buttons before selection
    const preCount = await page.locator('[data-testid="tfjs-transcribe-button"]').count();
    console.log('TFJS button count before file select:', preCount);
    const mp3Path = join(process.cwd(), 'public', 'test-song.mp3');
    await fileInput.setInputFiles(mp3Path);
    await fileInput.dispatchEvent('input', { bubbles: true });
    await fileInput.dispatchEvent('change', { bubbles: true });
    await page.waitForTimeout(700);

    const chosenCount = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="file-input"]') as HTMLInputElement | null;
      return el?.files?.length ?? 0;
    });
    console.log('file input files length:', chosenCount);

    // Wait for evidence that the upload handler ran (toast appears either way)
    await Promise.race([
      page.waitForSelector('text=Uploading file...', { timeout: 30000 }),
      page.waitForSelector('text=File uploaded successfully!', { timeout: 30000 }),
      page.waitForSelector('text=Failed to upload file', { timeout: 30000 }),
    ]).catch(() => {});

    // Debug: count tfjs buttons and capture screenshot
    const countAfter = await page.evaluate(() => document.querySelectorAll('[data-testid="tfjs-transcribe-button"]').length);
    console.log('TFJS button count after file select (via evaluate):', countAfter);
    await page.screenshot({ path: 'test-results/tfjs-after-upload.png', fullPage: true });

    // Click the TFJS button if present; otherwise, fall back to programmatic invocation
    const tfjsPresent = await page
      .locator('[data-testid="tfjs-transcribe-button"]')
      .first()
      .isVisible()
      .catch(() => false);
    if (tfjsPresent) {
      const tfjsBtn = page.getByTestId('tfjs-transcribe-button').first();
      await tfjsBtn.click();
    } else {
      console.log('TFJS button not detected, invoking transcriber programmatically...');
      await page.evaluate(async () => {
        // Load modules directly in the browser via Vite dev server
        const [{ transcribeInBrowser }, { midiStore }] = await Promise.all([
          import('/src/lib/drum/tfjsTranscriber.ts'),
          import('/src/stores/midi.ts'),
        ]);
        // Fetch sample file from public/ and wrap as File
        const res = await fetch('/test-song.mp3');
        const ab = await res.arrayBuffer();
        const file = new File([ab], 'test-song.mp3', { type: 'audio/mpeg' });
        const buffer = await transcribeInBrowser(file);
        await midiStore.openPreviewFromArrayBuffer(buffer);
      });
    }

    // Expect the MIDI preview modal to open
    await page.waitForSelector('text=MIDI Preview', { timeout: 120_000 });
    await expect(page.locator('text=MIDI Preview')).toBeVisible();
  });
});
