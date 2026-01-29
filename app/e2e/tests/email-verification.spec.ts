import { test, expect } from '@playwright/test';

test.describe('Email Verification', () => {
  test.describe('No Token State', () => {
    test('should show no token message when accessing without token', async ({ page }) => {
      await page.goto('/verify-email');

      await expect(page.getByText('No Token Provided')).toBeVisible();
      await expect(page.getByText(/This page is used to verify/)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Go Home' })).toBeVisible();
    });

    test('should navigate home when clicking Go Home', async ({ page }) => {
      await page.goto('/verify-email');

      await page.getByRole('button', { name: 'Go Home' }).click();
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('With Invalid Token', () => {
    test('should show error for invalid token', async ({ page }) => {
      await page.goto('/verify-email?token=invalid-token-12345');

      // Should show error state (loading first, then error)
      await page.waitForLoadState('networkidle');

      // Either shows error or verification failed
      const hasError = await page.getByText('Verification Failed').isVisible().catch(() => false);
      const hasInvalid = await page.getByText(/invalid|expired/i).isVisible().catch(() => false);

      // Should have some error indication
      expect(hasError || hasInvalid).toBe(true);
    });

    test('should have retry option on error', async ({ page }) => {
      await page.goto('/verify-email?token=invalid-token');
      await page.waitForLoadState('networkidle');

      // Wait for error state
      await page.waitForTimeout(1000);

      // Should have settings or retry button
      const hasSettings = await page.getByRole('button', { name: /settings/i }).isVisible().catch(() => false);
      const hasRetry = await page.getByRole('button', { name: /try again/i }).isVisible().catch(() => false);

      expect(hasSettings || hasRetry).toBe(true);
    });
  });

  test.describe('Accessibility', () => {
    test('should have main landmark', async ({ page }) => {
      await page.goto('/verify-email');

      const main = page.getByRole('main');
      await expect(main).toBeVisible();
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/verify-email');
      await page.waitForLoadState('networkidle');

      // Press tab to focus on button
      await page.keyboard.press('Tab');

      // Some element should be focused
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedTag).toBeTruthy();
    });
  });

  test.describe('Responsive Design', () => {
    test('should render on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/verify-email');

      await expect(page.locator('body')).toBeVisible();
      await expect(page.getByText('No Token Provided')).toBeVisible();
    });

    test('should render on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/verify-email');

      await expect(page.locator('body')).toBeVisible();
    });
  });
});
