import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DoomScrollPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get forYouTab(): Locator {
    return this.page.getByRole('button', { name: /for you/i });
  }

  get followingTab(): Locator {
    return this.page.getByRole('button', { name: /following/i });
  }

  get hotSortButton(): Locator {
    return this.page.getByRole('button', { name: /hot/i });
  }

  get newSortButton(): Locator {
    return this.page.getByRole('button', { name: /new/i });
  }

  get topSortButton(): Locator {
    return this.page.getByRole('button', { name: /top/i });
  }

  get posts(): Locator {
    return this.page.locator('article');
  }

  getPostByContent(content: string): Locator {
    return this.page.locator('article').filter({ hasText: content });
  }

  getLikeButton(post: Locator): Locator {
    return post.locator('button').filter({ has: this.page.locator('svg') }).first();
  }

  getLikeCount(post: Locator): Locator {
    return post.locator('text=/\\d+ likes?/');
  }

  async switchToForYou(): Promise<void> {
    await this.forYouTab.click();
  }

  async switchToFollowing(): Promise<void> {
    await this.followingTab.click();
  }

  async sortByHot(): Promise<void> {
    await this.hotSortButton.click();
  }

  async sortByNew(): Promise<void> {
    await this.newSortButton.click();
  }

  async sortByTop(): Promise<void> {
    await this.topSortButton.click();
  }

  async likePost(post: Locator): Promise<void> {
    await this.getLikeButton(post).click();
  }

  async clickPost(post: Locator): Promise<void> {
    await post.locator('p').first().click();
  }

  async verifyPostExists(content: string): Promise<void> {
    await expect(this.getPostByContent(content)).toBeVisible();
  }
}
