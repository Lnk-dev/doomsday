import { test, expect } from '@playwright/test';

test.describe('Token Economy', () => {
  test('should show correct balance in compose page', async ({ page }) => {
    // Get balance from profile
    await page.goto('/profile');
    const profileBalance = await page.locator('text=/\\$DOOM/').locator('xpath=preceding-sibling::*[1]').textContent();

    // Go to compose
    await page.goto('/compose');

    // Balance should match
    await expect(page.locator('text=Balance:')).toContainText(profileBalance || '');
  });

  test('should calculate life post cost correctly', async ({ page }) => {
    await page.goto('/compose');
    await page.getByRole('button', { name: /^life$/i }).click();

    // Cost indicator should be visible
    const costIndicator = page.locator('text=/\\d+ \\$DOOM/').first();
    await expect(costIndicator).toBeVisible();

    // Cost should be at least 1
    const costText = await costIndicator.textContent();
    const cost = parseInt(costText?.match(/\d+/)?.[0] || '0', 10);
    expect(cost).toBeGreaterThanOrEqual(1);
  });

  test('should deduct balance after life post', async ({ page }) => {
    // Get initial balance
    await page.goto('/profile');
    const initialBalanceText = await page.locator('text=/\\$DOOM/').locator('xpath=preceding-sibling::*[1]').textContent();
    const initialBalance = parseInt(initialBalanceText?.replace(/,/g, '') || '0', 10);

    // Go to compose and get cost
    await page.goto('/compose');
    await page.getByRole('button', { name: /^life$/i }).click();

    const costText = await page.locator('text=/\\d+ \\$DOOM/').first().textContent();
    const cost = parseInt(costText?.match(/\d+/)?.[0] || '0', 10);

    // Create life post
    await page.getByPlaceholder(/what's your life/i).fill(`Economy test ${Date.now()}`);
    await page.getByRole('button', { name: /^post$/i }).click();

    // Wait for navigation
    await page.waitForURL('/life');

    // Check new balance
    await page.goto('/profile');
    const newBalanceText = await page.locator('text=/\\$DOOM/').locator('xpath=preceding-sibling::*[1]').textContent();
    const newBalance = parseInt(newBalanceText?.replace(/,/g, '') || '0', 10);

    expect(newBalance).toBe(initialBalance - cost);
  });

  test('should show stats grid on profile', async ({ page }) => {
    await page.goto('/profile');

    // Verify all stat labels are visible using exact matching
    await expect(page.getByText('$DOOM', { exact: true })).toBeVisible();
    await expect(page.getByText('$LIFE', { exact: true })).toBeVisible();
    await expect(page.getByText('Days', { exact: true })).toBeVisible();
    await expect(page.getByText('Life Posts', { exact: true })).toBeVisible();
  });
});
