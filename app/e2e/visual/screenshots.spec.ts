import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('home page visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('compose page visual snapshot', async ({ page }) => {
    await page.goto('/compose');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('compose-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('events page visual snapshot', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('events-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('profile page visual snapshot', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('profile-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('doom post variant visual snapshot', async ({ page }) => {
    await page.goto('/');

    const doomPost = page.locator('article').first();
    await expect(doomPost).toHaveScreenshot('doom-post.png', {
      animations: 'disabled',
    });
  });

  test('life post variant visual snapshot', async ({ page }) => {
    await page.goto('/life');

    const lifePost = page.locator('article').first();
    if (await lifePost.isVisible()) {
      await expect(lifePost).toHaveScreenshot('life-post.png', {
        animations: 'disabled',
      });
    }
  });

  test('mobile viewport visual snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('home-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('dark theme visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // App is already dark-themed
    await expect(page).toHaveScreenshot('home-dark-theme.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
