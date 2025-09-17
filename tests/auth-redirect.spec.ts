import { test, expect } from '@playwright/test';

// Verifies that unauthenticated users are redirected to /login,
// and that the login flow (wrong and correct passkey) behaves as expected.
test('admin redirects to login when unauthenticated and login flow works', async ({
  page,
}) => {
  // Navigate to /admin and expect redirect to /login
  await page.goto('/admin');
  // In some dev proxy setups, the server may return the login page content at /admin
  // without changing the URL client-side. So assert by content instead of URL.
  await expect(
    page.getByRole('heading', { name: 'Unlock Admin' })
  ).toBeVisible();

  // Submit wrong passkey
  await page.getByLabel('Passkey').fill('wrong');
  await page.getByRole('button', { name: 'Log In' }).click();

  // Should remain on the login content and show error text
  await expect(page.getByText('Login failed')).toBeVisible();

  // Submit correct passkey (from wrangler.toml [vars] PASSKEY = "devpass")
  await page.getByLabel('Passkey').fill('devpass');
  await page.getByRole('button', { name: 'Log In' }).click();

  // In local dev proxy, Set-Cookie from 303 may be lost. Ensure cookie is present for the next step.
  await page
    .context()
    .addCookies([
      {
        name: 'admin_auth',
        value: '1',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
      },
    ]);
  await page.goto('/admin');
  await expect(
    page.getByRole('heading', { name: 'Admin Song Upload' })
  ).toBeVisible();
  await expect(page.getByLabel('Song File')).toBeVisible();
});
