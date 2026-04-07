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

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

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

test.describe('TFJS Drum Transcription', () => {
  test('in-browser TFJS transcription opens MIDI preview', async ({ page }) => {
    test.setTimeout(150_000);

    await page.goto('/drum-transcription');
    await expect(
      page.getByRole('heading', { name: 'DRUM TRANSCRIBE' })
    ).toBeVisible();

    const chooseFileButton = page.getByRole('button', {
      name: 'Choose File',
      exact: true,
    });
    await expect(chooseFileButton).toBeVisible();

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      chooseFileButton.click(),
    ]);

    await fileChooser.setFiles({
      name: 'test-song.wav',
      mimeType: 'audio/wav',
      buffer: createTestWavBuffer(),
    });

    await expect(page.getByText('File Ready')).toBeVisible();
    await expect(
      page.getByText('test-song.wav', { exact: true })
    ).toBeVisible();

    const tfjsButton = page.getByTestId('tfjs-transcribe-button');
    await expect(tfjsButton).toBeVisible();
    await expect(tfjsButton).toHaveText(/Transcribe in Browser/i);

    await tfjsButton.click();

    await expect(
      page.getByRole('heading', { name: 'MIDI Preview', exact: true })
    ).toBeVisible({
      timeout: 120_000,
    });
    await expect(page.getByLabel('Play MIDI')).toBeVisible();
  });
});
