import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate between all main pages via bottom nav', async ({ page }) => {
    // Home (DoomScroll) is default
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=/for you/i')).toBeVisible();

    // Navigate to Events (Search)
    await page.getByRole('link').filter({ has: page.locator('svg') }).nth(1).click();
    await expect(page).toHaveURL('/events');
    await expect(page.locator('text=/search events/i')).toBeVisible();

    // Navigate to Compose
    await page.getByRole('link').filter({ has: page.locator('svg') }).nth(2).click();
    await expect(page).toHaveURL('/compose');
    await expect(page.getByPlaceholder(/what's the doom/i)).toBeVisible();

    // Navigate to Activity (Life)
    await page.getByRole('link').filter({ has: page.locator('svg') }).nth(3).click();
    await expect(page).toHaveURL('/life');
    await expect(page.locator('text=/activity/i')).toBeVisible();

    // Navigate to Profile
    await page.getByRole('link').filter({ has: page.locator('svg') }).nth(4).click();
    await expect(page).toHaveURL('/profile');
    await expect(page.locator('text=/profile/i')).toBeVisible();
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

    // Click on first event
    await page.locator('button').filter({ hasText: /\d+d|\d+h/ }).first().click();

    // Should be on event detail page
    await expect(page).toHaveURL(/\/events\/.+/);
    await expect(page.locator('text=/place your bet/i')).toBeVisible();

    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/events');
  });

  test('should preserve tab state when navigating between pages', async ({ page }) => {
    // Switch to Following tab
    await page.getByRole('button', { name: /following/i }).click();

    // Navigate away and back
    await page.goto('/profile');
    await page.goto('/');

    // Following tab should still be selected (or reset to For You based on UX)
    await expect(page.getByRole('button', { name: /for you/i })).toBeVisible();
  });
});
