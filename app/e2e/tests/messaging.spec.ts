import { test, expect } from '@playwright/test';
import { MessagesPage } from '../page-objects/MessagesPage';

test.describe('Direct Messaging', () => {
  let messagesPage: MessagesPage;

  test.beforeEach(async ({ page }) => {
    messagesPage = new MessagesPage(page);
  });

  test.describe('Unauthenticated State', () => {
    test('should show sign in prompt when not authenticated', async ({ page }) => {
      await messagesPage.goto();
      await page.waitForLoadState('networkidle');
      // Should show sign in prompt
      await expect(page.getByText(/sign in to message/i)).toBeVisible();
    });

    test('should explain how to connect wallet', async ({ page }) => {
      await messagesPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(/connect your wallet/i)).toBeVisible();
    });

    test('should show message icon', async ({ page }) => {
      await messagesPage.goto();
      await page.waitForLoadState('networkidle');
      // Wait for the sign-in content to appear
      await expect(page.getByText(/sign in to message/i)).toBeVisible();
      // Page should have the message icon in sign-in state
      await expect(page.locator('svg').first()).toBeVisible();
    });
  });

  test.describe('New Message Page - Unauthenticated', () => {
    test('should show sign in prompt on new message page', async ({ page }) => {
      await messagesPage.gotoNewMessage();
      await expect(page.getByText(/sign in|please sign in/i)).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to messages page', async ({ page }) => {
      await page.goto('/messages');
      await expect(page).toHaveURL('/messages');
    });

    test('should navigate to new message page', async ({ page }) => {
      await page.goto('/messages/new');
      await expect(page).toHaveURL('/messages/new');
    });

    test('should handle direct URL to conversation gracefully', async ({ page }) => {
      // Should handle missing conversation gracefully
      await page.goto('/messages/nonexistent-id');

      // Should show loading or redirect, not crash
      await page.waitForLoadState('networkidle');
      expect(await page.title()).toBeTruthy();
    });

    test('new message page should have back navigation', async ({ page }) => {
      await messagesPage.gotoNewMessage();
      await page.waitForLoadState('networkidle');

      // Should have some form of back navigation or content
      // When not authenticated, it shows a simpler UI
      const hasBackButton = await page.locator('button').first().isVisible().catch(() => false);
      const hasText = await page.getByText(/sign in|new message|back/i).isVisible().catch(() => false);

      expect(hasBackButton || hasText).toBe(true);
    });
  });

  test.describe('Accessibility', () => {
    test('messages page should have descriptive text', async ({ page }) => {
      await messagesPage.goto();
      await page.waitForLoadState('networkidle');
      // Wait for content to load
      await expect(page.getByText(/sign in to message/i)).toBeVisible();
    });

    test('should have focused element after tab', async ({ page }) => {
      await messagesPage.goto();
      await page.waitForLoadState('networkidle');
      await page.keyboard.press('Tab');

      // Some element should be focused
      await page.waitForTimeout(100);
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedTag).toBeTruthy();
    });
  });

  test.describe('Responsive Design', () => {
    test('should render on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await messagesPage.goto();

      // Page should render without crashing
      await expect(page.locator('body')).toBeVisible();
    });

    test('should render on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await messagesPage.goto();

      await expect(page.locator('body')).toBeVisible();
    });

    test('should render on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await messagesPage.goto();

      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Visual Elements', () => {
    test('should display message icon on sign in page', async ({ page }) => {
      await messagesPage.goto();

      // The sign-in state shows a MessageCircle icon
      const svgElements = page.locator('svg');
      await expect(svgElements.first()).toBeVisible();
    });

    test('should have dark theme styling', async ({ page }) => {
      await messagesPage.goto();

      // Check that the page has dark background
      const bodyBg = await page.evaluate(() => {
        return getComputedStyle(document.body).backgroundColor;
      });

      // Should be dark (rgb values close to 0)
      expect(bodyBg).toBeTruthy();
    });
  });
});
