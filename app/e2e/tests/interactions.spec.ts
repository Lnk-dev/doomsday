import { test, expect } from '@playwright/test';

test.describe('Social Interactions', () => {
  test('should like and unlike a post', async ({ page }) => {
    await page.goto('/');

    const firstPost = page.locator('article').first();
    const likeButton = firstPost.locator('button').first();

    // Get initial like count
    const likesText = await firstPost.locator('text=/\\d+ likes?/').textContent() || '0 likes';
    const initialLikes = parseInt(likesText.match(/\d+/)?.[0] || '0', 10);

    // Like the post
    await likeButton.click();

    // Heart should be filled (red)
    await expect(likeButton.locator('svg')).toHaveCSS('fill', 'rgb(255, 48, 64)');

    // Like count should increase
    const newLikesText = await firstPost.locator('text=/\\d+ likes?/').textContent() || '1 like';
    const newLikes = parseInt(newLikesText.match(/\d+/)?.[0] || '0', 10);
    expect(newLikes).toBe(initialLikes + 1);

    // Unlike the post
    await likeButton.click();

    // Heart should be unfilled
    await expect(likeButton.locator('svg')).not.toHaveCSS('fill', 'rgb(255, 48, 64)');
  });

  test('should follow and unfollow a user from post detail', async ({ page }) => {
    await page.goto('/');

    // Click on first post to go to detail
    await page.locator('article p').first().click();
    await page.waitForURL(/\/post\/.+/);

    // Find follow button (should be visible for posts not by current user)
    const followButton = page.getByRole('button', { name: /follow/i }).first();

    if (await followButton.isVisible()) {
      // Follow the user
      await followButton.click();
      await expect(page.getByRole('button', { name: /following/i })).toBeVisible();

      // Unfollow the user
      await page.getByRole('button', { name: /following/i }).click();
      await expect(page.getByRole('button', { name: /^follow$/i })).toBeVisible();
    }
  });

  test('should add a comment to a post', async ({ page }) => {
    await page.goto('/');

    // Go to post detail
    await page.locator('article p').first().click();
    await page.waitForURL(/\/post\/.+/);

    const commentContent = `Test comment ${Date.now()}`;

    // Add comment
    await page.getByPlaceholder(/add a comment/i).fill(commentContent);
    await page.locator('button').filter({ has: page.locator('svg[class*="send"]') }).click();

    // Comment should appear
    await expect(page.locator('text=' + commentContent)).toBeVisible();
  });

  test('should filter posts by Following tab', async ({ page }) => {
    await page.goto('/');

    // Switch to Following tab
    await page.getByRole('button', { name: /following/i }).click();

    // Should show empty state or posts from followed users
    // Verify the tab is active
    await expect(page.getByRole('button', { name: /following/i })).toHaveClass(/border-b-2/);
  });

  test('should sort posts by different criteria', async ({ page }) => {
    await page.goto('/');

    // Sort by New
    await page.getByRole('button', { name: /new/i }).click();
    await expect(page.getByRole('button', { name: /new/i })).toHaveClass(/bg-\[#ff3040\]/);

    // Sort by Top
    await page.getByRole('button', { name: /top/i }).click();
    await expect(page.getByRole('button', { name: /top/i })).toHaveClass(/bg-\[#ff3040\]/);

    // Sort by Hot
    await page.getByRole('button', { name: /hot/i }).click();
    await expect(page.getByRole('button', { name: /hot/i })).toHaveClass(/bg-\[#ff3040\]/);
  });
});
