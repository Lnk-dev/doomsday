import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ComposePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get doomToggle(): Locator {
    return this.page.getByRole('button', { name: /doom scroll/i });
  }

  get lifeToggle(): Locator {
    return this.page.getByRole('button', { name: /^life$/i });
  }

  get postTextarea(): Locator {
    return this.page.getByPlaceholder(/what's the doom|what's your life/i);
  }

  get postButton(): Locator {
    return this.page.getByRole('button', { name: /^post$/i });
  }

  get characterCount(): Locator {
    return this.page.locator('text=/\\d+\\/500/');
  }

  get costIndicator(): Locator {
    return this.page.locator('text=/\\d+ \\$DOOM/');
  }

  get closeButton(): Locator {
    return this.page.locator('button').filter({ has: this.page.locator('svg') }).first();
  }

  async selectDoomPost(): Promise<void> {
    await this.doomToggle.click();
  }

  async selectLifePost(): Promise<void> {
    await this.lifeToggle.click();
  }

  async writeContent(content: string): Promise<void> {
    await this.postTextarea.fill(content);
  }

  async submitPost(): Promise<void> {
    await this.postButton.click();
  }

  async createDoomPost(content: string): Promise<void> {
    await this.selectDoomPost();
    await this.writeContent(content);
    await this.submitPost();
    // Should redirect to home
    await this.page.waitForURL('/');
  }

  async createLifePost(content: string): Promise<void> {
    await this.selectLifePost();
    await this.writeContent(content);
    await this.submitPost();
    // Should redirect to life page
    await this.page.waitForURL('/life');
  }

  async verifyPostButtonDisabled(): Promise<void> {
    await expect(this.postButton).toBeDisabled();
  }

  async verifyPostButtonEnabled(): Promise<void> {
    await expect(this.postButton).toBeEnabled();
  }
}
