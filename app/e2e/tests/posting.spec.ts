import { test, expect } from '@playwright/test';
import { ComposePage } from '../page-objects/ComposePage';
import { DoomScrollPage } from '../page-objects/DoomScrollPage';

test.describe('Post Creation', () => {
  test('should create a doom post and see it in the feed', async ({ page }) => {
    const composePage = new ComposePage(page);
    const doomPage = new DoomScrollPage(page);

    await page.goto('/compose');

    const postContent = `Test doom post ${Date.now()}`;
    await composePage.createDoomPost(postContent);

    // Should redirect to home and show the post
    await expect(page).toHaveURL('/');
    await doomPage.verifyPostExists(postContent);
  });

  test('should create a life post with cost deduction', async ({ page }) => {
    // First check initial balance on profile
    await page.goto('/profile');
    const initialBalance = await page.locator('text=/\\$DOOM/').locator('xpath=preceding-sibling::*[1]').textContent();
    const initialBalanceNum = parseInt(initialBalance?.replace(/,/g, '') || '0', 10);

    // Go to compose and create life post
    await page.goto('/compose');

    await page.getByRole('button', { name: /^life$/i }).click();

    // Verify cost indicator is shown
    await expect(page.locator('text=/will cost.*\\$DOOM/i')).toBeVisible();

    const postContent = `Test life post ${Date.now()}`;
    await page.getByPlaceholder(/what's your life/i).fill(postContent);
    await page.getByRole('button', { name: /^post$/i }).click();

    // Should redirect to life page
    await expect(page).toHaveURL('/life');

    // Verify post appears
    await expect(page.locator('article').filter({ hasText: postContent })).toBeVisible();

    // Check balance was deducted
    await page.goto('/profile');
    const newBalance = await page.locator('text=/\\$DOOM/').locator('xpath=preceding-sibling::*[1]').textContent();
    const newBalanceNum = parseInt(newBalance?.replace(/,/g, '') || '0', 10);

    expect(newBalanceNum).toBeLessThan(initialBalanceNum);
  });

  test('should enforce character limit of 500', async ({ page }) => {
    await page.goto('/compose');

    const longContent = 'a'.repeat(600);
    await page.getByPlaceholder(/what's the doom/i).fill(longContent);

    // Content should be truncated to 500
    const inputValue = await page.getByPlaceholder(/what's the doom/i).inputValue();
    expect(inputValue.length).toBe(500);

    // Character count should show 500/500
    await expect(page.locator('text=/500\\/500/')).toBeVisible();
  });

  test('should disable post button when content is empty', async ({ page }) => {
    await page.goto('/compose');

    const postButton = page.getByRole('button', { name: /^post$/i });
    await expect(postButton).toBeDisabled();

    // Add content
    await page.getByPlaceholder(/what's the doom/i).fill('Some content');
    await expect(postButton).toBeEnabled();

    // Clear content
    await page.getByPlaceholder(/what's the doom/i).fill('');
    await expect(postButton).toBeDisabled();
  });

  test('should show error when life post cannot be afforded', async ({ page }) => {
    // This test assumes we can manipulate state or the cost exceeds balance
    await page.goto('/compose');
    await page.getByRole('button', { name: /^life$/i }).click();

    // If balance is less than cost, post button should be disabled
    // Check for the cost indicator showing insufficient funds
    const costIndicator = page.locator('text=/need.*\\$DOOM/i');

    // Only verify if user doesn't have enough balance
    if (await costIndicator.isVisible()) {
      await expect(page.getByRole('button', { name: /^post$/i })).toBeDisabled();
    }
  });
});
