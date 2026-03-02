import { test, expect } from '@playwright/test';

function createTestWavBuffer({
  durationSeconds = 1,
  sampleRate = 16_000,
  frequencyHz = 220,
} = {}): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = Math.floor(durationSeconds * sampleRate);
  const dataSize = numSamples * numChannels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  const amplitude = 0.3;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequencyHz * t) * amplitude;
    const int16 = Math.max(-1, Math.min(1, sample)) * 0x7fff;
    buffer.writeInt16LE(Math.round(int16), 44 + i * bytesPerSample);
  }

  return buffer;
}

// E2E for in-browser TFJS transcription path
// Assumes the app is served at baseURL from playwright.config.ts

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
    const fileInput = page.getByTestId('file-input');
    await fileInput.waitFor({ state: 'attached', timeout: 60_000 });

    // Upload a generated WAV fixture directly into the file input.
    await expect(fileInput).toHaveCount(1);
    // Debug: count TFJS buttons before selection
    const preCount = await page.locator('[data-testid="tfjs-transcribe-button"]').count();
    console.log('TFJS button count before file select:', preCount);
    await fileInput.setInputFiles({
      name: 'test-song.wav',
      mimeType: 'audio/wav',
      buffer: createTestWavBuffer(),
    });
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

    // Wait for and click the TFJS button (Playwright will auto-retry)
    const tfjsBtn = page.getByTestId('tfjs-transcribe-button').first();
    await expect(tfjsBtn).toBeVisible({ timeout: 10_000 });
    await tfjsBtn.click();

    // Expect the MIDI preview modal to open
    await page.waitForSelector('text=MIDI Preview', { timeout: 120_000 });
    await expect(page.locator('text=MIDI Preview')).toBeVisible();
  });
});
