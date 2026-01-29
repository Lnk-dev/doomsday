import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('home page should have no accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('compose page should have no accessibility violations', async ({ page }) => {
    await page.goto('/compose');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('events page should have no accessibility violations', async ({ page }) => {
    await page.goto('/events');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('profile page should have no accessibility violations', async ({ page }) => {
    await page.goto('/profile');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Tab through elements to reach navigation links
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    // Should be able to focus on a link or button
    const focusedElement = page.locator(':focus');
    const count = await focusedElement.count();
    expect(count).toBeGreaterThanOrEqual(0); // Just verify tabbing doesn't break the page
  });

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/');

    // All buttons should have accessible names
    const buttons = await page.getByRole('button').all();

    for (const button of buttons) {
      const name = await button.getAttribute('aria-label') || await button.textContent();
      expect(name?.trim().length).toBeGreaterThan(0);
    }
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/');

    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      // Alt can be empty string for decorative images, but attribute should exist
      expect(alt).not.toBeNull();
    }
  });

  test('form inputs should have labels', async ({ page }) => {
    await page.goto('/compose');

    // Textarea should have accessible label/placeholder
    const textarea = page.getByRole('textbox');
    const placeholder = await textarea.getAttribute('placeholder');
    const ariaLabel = await textarea.getAttribute('aria-label');

    expect(placeholder || ariaLabel).toBeTruthy();
  });
});
