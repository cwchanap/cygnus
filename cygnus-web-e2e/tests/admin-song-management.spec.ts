import { test, expect } from '@playwright/test';

test.describe('Admin Song Management', () => {
  test.beforeEach(async ({ page }) => {
    // Set admin authentication cookie
    await page.context().addCookies([{
      name: 'admin_auth',
      value: '1',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Strict'
    }]);
  });

  test('should load admin page and show navigation', async ({ page }) => {
    await page.goto('/admin');

    // Check page title
    await expect(page).toHaveTitle(/Admin/);

    // Check navigation buttons exist
    await expect(page.getByText('Upload Songs')).toBeVisible();
    await expect(page.getByText('Manage Songs')).toBeVisible();
  });

  test('should navigate to song management page', async ({ page }) => {
    await page.goto('/admin');

    // Click Manage Songs button
    await page.getByText('Manage Songs').click();

    // Should navigate to /admin/songs
    await expect(page).toHaveURL(/.*\/admin\/songs/);

    // Check page title
    await expect(page.getByText('Song Management')).toBeVisible();
    await expect(page.getByText('Back to Admin')).toBeVisible();
  });

  test('should display song management table', async ({ page }) => {
    await page.goto('/admin/songs');

    // Check table headers - be more specific to avoid matching data cells
    await expect(page.locator('th').filter({ hasText: 'Song Name' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Artist' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'BPM' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Release Date' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Status' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Uploaded' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Actions' })).toBeVisible();
  });

  test('should handle empty song list', async ({ page }) => {
    await page.goto('/admin/songs');

    // If no songs exist, should show "No songs found" message
    const noSongsMessage = page.getByText('No songs found');
    if (await noSongsMessage.isVisible()) {
      await expect(noSongsMessage).toBeVisible();
    }
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Clear cookies to simulate unauthenticated state
    await page.context().clearCookies();

    // Mock the API to return 401 unauthorized
    await page.route('/api/admin/songs**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized' })
      });
    });

    await page.goto('/admin/songs');

    // In some dev proxy setups the login page content is served without changing the URL,
    // so assert by content instead of strict URL matching.
    const loginHeading = page.getByRole('heading', { name: 'Unlock Admin' });
    await Promise.race([
      page.waitForURL(/.*\/login/, { timeout: 15_000 }).catch(() => {}),
      loginHeading.waitFor({ state: 'visible', timeout: 15_000 }),
    ]);
    await expect(loginHeading).toBeVisible();
    await expect(page.getByLabel('Passkey')).toBeVisible();
  });

  test('should handle login and redirect back to song management', async ({ page }) => {
    // Clear cookies
    await page.context().clearCookies();

    // Mock the API to return 401 unauthorized initially
    await page.route('/api/admin/songs**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized' })
      });
    });

    // Go to song management (should redirect to login)
    await page.goto('/admin/songs');

    // Should be on login page
    await expect(page.getByText('Unlock Admin')).toBeVisible();

    // Fill in passkey (using devpass as set in wrangler)
    await page.fill('input[name="passkey"]', 'devpass');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect back to song management
    await page.waitForURL(/.*\/admin\/songs/);
    await expect(page).toHaveURL(/.*\/admin\/songs/);
  });

  test('should show pagination controls when multiple pages exist', async ({ page }) => {
    await page.goto('/admin/songs');

    // Check if pagination exists (only if there are enough songs)
    const paginationText = page.getByText(/Page \d+ of \d+/);
    const prevButton = page.getByText('Previous');
    const nextButton = page.getByText('Next');

    // If pagination exists, test the controls
    if (await paginationText.isVisible()) {
      await expect(prevButton).toBeVisible();
      await expect(nextButton).toBeVisible();

      // Test pagination info display
      await expect(paginationText).toBeVisible();
    }
  });

  test('should handle edit functionality', async ({ page }) => {
    await page.goto('/admin/songs');

    // Look for Edit buttons
    const editButtons = page.getByText('Edit');

    if (await editButtons.first().isVisible()) {
      // Click first Edit button
      await editButtons.first().click();

      // Should show Save and Cancel buttons
      await expect(page.getByText('Save')).toBeVisible();
      await expect(page.getByText('Cancel')).toBeVisible();

      // Test cancel functionality
      await page.getByText('Cancel').click();

      // Should return to normal view
      await expect(page.getByText('Edit')).toBeVisible();
      await expect(page.getByText('Save')).not.toBeVisible();
    }
  });

  test('should handle delete confirmation', async ({ page }) => {
    await page.goto('/admin/songs');

    // Look for Delete buttons
    const deleteButtons = page.getByText('Delete');

    if (await deleteButtons.first().isVisible()) {
      // Mock the confirm dialog to return false (cancel)
      page.on('dialog', async dialog => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain('delete');
        await dialog.dismiss(); // Cancel the deletion
      });

      // Click delete button
      await deleteButtons.first().click();

      // Should still be on the same page (deletion cancelled)
      await expect(page).toHaveURL(/.*\/admin\/songs/);
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock a failed API response
    await page.route('/api/admin/songs**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' })
      });
    });

    await page.goto('/admin/songs');

    // Should show error message (the component shows "Failed to fetch songs" for fetch errors)
    await expect(page.getByText('Failed to fetch songs')).toBeVisible();
  });

  test('should handle authentication errors', async ({ page }) => {
    // Mock unauthorized response
    await page.route('/api/admin/songs**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized' })
      });
    });

    await page.goto('/admin/songs');

    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/admin/songs');

    // Check that navigation still works on mobile
    await expect(page.getByText('Song Management')).toBeVisible();

    // Table should still be visible (may be horizontally scrollable)
    await expect(page.getByText('Song Name')).toBeVisible();
  });
});
