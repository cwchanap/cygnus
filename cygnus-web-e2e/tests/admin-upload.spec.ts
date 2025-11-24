import { test, expect } from '@playwright/test';
import { e2ePath, webPath } from './utils/paths';

test('admin can upload a song with optional preview image', async ({
  page,
}) => {
  // Go to admin page with E2E bypass enabled so SSR renders the upload form
  await page.goto('/admin?e2e=1');

  // Ensure upload form is present
  const uploadInput = page.getByLabel('Song File');
  try {
    // One of these should appear depending on SSR branch
    await Promise.race([
      page
        .getByRole('heading', { name: 'Admin Song Upload' })
        .waitFor({ state: 'visible', timeout: 5000 }),
      page
        .getByRole('heading', { name: 'Unlock Admin' })
        .waitFor({ state: 'visible', timeout: 5000 }),
    ]);
    await expect(uploadInput).toBeVisible({ timeout: 15000 });
  } catch (err) {
    // Dump page diagnostics to help debug
    const url = page.url();
    const html = await page.content();
    console.log('DEBUG current URL:', url);
    console.log('DEBUG page content start ->');
    console.log(html);
    console.log('<- DEBUG page content end');
    throw err;
  }

  // Attach files
  await uploadInput.setInputFiles(webPath('public', 'test-song.mp3'));
  await page
    .getByLabel('Preview Image (optional)')
    .setInputFiles(e2ePath('tests', 'fixtures', 'preview.svg'));

  // Fill metadata
  await page.fill('input#song_name', 'Test Track');
  await page.fill('input#artist', 'Test Artist');
  await page.fill('input#bpm', '120');
  await page.fill('input#release_date', '2024-01-01');
  await page.fill('input#origin', 'playwright');
  await page.locator('input#is_released').check();

  // Submit
  await page.getByRole('button', { name: 'Upload Song' }).click();

  // Assert success message
  await expect(page.getByText('Song uploaded successfully')).toBeVisible({
    timeout: 15000,
  });
});
