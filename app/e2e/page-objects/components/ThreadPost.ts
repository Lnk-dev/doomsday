import { Page, Locator, expect } from '@playwright/test';

export class ThreadPost {
  private page: Page;
  private container: Locator;

  constructor(page: Page, container: Locator) {
    this.page = page;
    this.container = container;
  }

  get avatar(): Locator {
    return this.container.locator('img').first();
  }

  get username(): Locator {
    return this.container.locator('text=/@/').first();
  }

  get content(): Locator {
    return this.container.locator('p').first();
  }

  get likeButton(): Locator {
    return this.container.locator('button').first();
  }

  get likeCount(): Locator {
    return this.container.locator('text=/\\d+ likes?/');
  }

  get timestamp(): Locator {
    return this.container.locator('text=/\\d+[smhd]/');
  }

  async like(): Promise<void> {
    await this.likeButton.click();
  }

  async clickContent(): Promise<void> {
    await this.content.click();
  }

  async getContentText(): Promise<string> {
    return await this.content.textContent() || '';
  }

  async getLikeCountValue(): Promise<number> {
    const text = await this.likeCount.textContent();
    return parseInt(text?.match(/\d+/)?.[0] || '0', 10);
  }

  async verifyIsLiked(): Promise<void> {
    await expect(this.likeButton.locator('svg')).toHaveCSS('fill', 'rgb(255, 48, 64)');
  }

  async verifyIsNotLiked(): Promise<void> {
    await expect(this.likeButton.locator('svg')).not.toHaveCSS('fill', 'rgb(255, 48, 64)');
  }
}
