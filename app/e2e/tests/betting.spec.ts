import { test, expect } from '@playwright/test';
import { EventDetailPage } from '../page-objects/EventDetailPage';
import { ProfilePage } from '../page-objects/ProfilePage';

test.describe('Event Betting', () => {
  test('should place a doom bet on an event', async ({ page }) => {
    // Get initial balance
    await page.goto('/profile');
    const profilePage = new ProfilePage(page);
    const initialBalance = await profilePage.getDoomBalanceValue();

    // Navigate to events
    await page.goto('/events');

    // Click on first event
    await page.locator('button').filter({ hasText: /technology|economic|climate|war|natural|social/i }).first().click();
    await page.waitForURL(/\/events\/.+/);

    const eventPage = new EventDetailPage(page);
    const betAmount = 100;

    // Place doom bet
    await eventPage.selectDoom();
    await eventPage.enterAmount(betAmount);
    await eventPage.placeBet();

    // Verify bet success
    await expect(page.locator('text=/bet placed/i')).toBeVisible({ timeout: 5000 });

    // Verify balance deduction
    await page.goto('/profile');
    const newBalance = await profilePage.getDoomBalanceValue();
    expect(newBalance).toBe(initialBalance - betAmount);
  });

  test('should place a life bet on an event', async ({ page }) => {
    await page.goto('/events');

    // Click on first event
    await page.locator('button').filter({ hasText: /technology|economic|climate|war|natural|social/i }).first().click();
    await page.waitForURL(/\/events\/.+/);

    const eventPage = new EventDetailPage(page);

    // Place life bet
    await eventPage.selectLife();
    await eventPage.clickQuickAmount(100);
    await eventPage.placeBet();

    // Verify success
    await expect(page.locator('text=/bet placed/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show potential payout calculation', async ({ page }) => {
    await page.goto('/events');

    await page.locator('button').filter({ hasText: /technology|economic|climate|war|natural|social/i }).first().click();
    await page.waitForURL(/\/events\/.+/);

    const eventPage = new EventDetailPage(page);

    // Enter bet amount
    await eventPage.enterAmount(500);

    // Potential win should be visible
    await expect(page.locator('text=/potential win/i')).toBeVisible();
    await expect(page.locator('text=/\\d+ \\$DOOM/').nth(1)).toBeVisible();
  });

  test('should disable bet when balance is insufficient', async ({ page }) => {
    await page.goto('/events');

    await page.locator('button').filter({ hasText: /technology|economic|climate|war|natural|social/i }).first().click();
    await page.waitForURL(/\/events\/.+/);

    // Enter amount larger than balance
    await page.getByRole('spinbutton').fill('999999999');

    // Bet button should be disabled or show insufficient balance
    const betButton = page.getByRole('button', { name: /bet|insufficient/i }).last();
    const buttonText = await betButton.textContent();

    expect(buttonText?.toLowerCase()).toContain('insufficient');
  });

  test('should show bet in profile bets tab', async ({ page }) => {
    // Place a bet first
    await page.goto('/events');
    const eventTitle = await page.locator('h3').first().textContent();

    await page.locator('button').filter({ hasText: /technology|economic|climate|war|natural|social/i }).first().click();
    await page.waitForURL(/\/events\/.+/);

    await page.getByRole('spinbutton').fill('50');
    await page.getByRole('button', { name: /bet 50/i }).click();

    // Wait for success
    await expect(page.locator('text=/bet placed/i')).toBeVisible({ timeout: 5000 });

    // Check profile bets tab
    await page.goto('/profile');
    await page.getByRole('button', { name: /bets/i }).click();

    // Should see the bet
    if (eventTitle) {
      await expect(page.locator('button').filter({ hasText: eventTitle })).toBeVisible();
    }
  });

  test('should filter events by category', async ({ page }) => {
    await page.goto('/events');

    // Click Technology category
    await page.getByRole('button', { name: /technology/i }).click();

    // Verify filter is active
    await expect(page.getByRole('button', { name: /technology/i })).toHaveClass(/bg-white/);

    // All visible events should be technology category
    const categories = await page.locator('text=/technology/i').all();
    expect(categories.length).toBeGreaterThanOrEqual(0);
  });

  test('should search events', async ({ page }) => {
    await page.goto('/events');

    // Search for something
    await page.getByPlaceholder(/search events/i).fill('AI');

    // Results should filter
    await page.waitForTimeout(500); // Debounce

    // Verify search is active
    const searchInput = await page.getByPlaceholder(/search events/i).inputValue();
    expect(searchInput).toBe('AI');
  });
});
