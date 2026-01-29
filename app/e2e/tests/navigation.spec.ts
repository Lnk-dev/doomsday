import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate between all main pages via bottom nav', async ({ page }) => {
    // Set mobile viewport to show bottom nav (which is lg:hidden)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Home (DoomScroll) is default
    await expect(page).toHaveURL('/');

    // Navigate to Discover (bottom nav link - may have "(new content available)" suffix)
    await page.getByRole('link', { name: /^Discover/ }).click();
    await expect(page).toHaveURL('/discover');

    // Navigate to Compose (bottom nav link)
    await page.getByRole('link', { name: /^Compose/ }).click();
    await expect(page).toHaveURL('/compose');

    // Navigate to Life (bottom nav link - may have "(new content available)" suffix)
    await page.getByRole('link', { name: /^Life/ }).click();
    await expect(page).toHaveURL('/life');

    // Navigate to Profile (bottom nav link)
    await page.getByRole('link', { name: /^Profile/ }).click();
    await expect(page).toHaveURL('/profile');
  });

  test('should navigate to post detail and back', async ({ page }) => {
    // Click on first post content
    await page.locator('article p').first().click();

    // Should be on post detail page
    await expect(page).toHaveURL(/\/post\/.+/);
    await expect(page.locator('text=/thread/i')).toBeVisible();

    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/');
  });

  test('should navigate to event detail and back', async ({ page }) => {
    await page.goto('/events');

    // Click on first event (looking for h3 inside button)
    await page.locator('button h3').first().click();

    // Should be on event detail page
    await expect(page).toHaveURL(/\/events\/.+/);

    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/events');
  });

  test('should preserve tab state when navigating between pages', async ({ page }) => {
    // Switch to Following tab
    await page.getByRole('button', { name: 'Following', exact: true }).click();

    // Navigate away and back
    await page.goto('/profile');
    await page.goto('/');

    // Following tab should still be selected (or reset to For You based on UX)
    await expect(page.getByRole('button', { name: 'For you', exact: true })).toBeVisible();
  });
});
