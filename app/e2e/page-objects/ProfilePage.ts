import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get doomBalance(): Locator {
    return this.page.locator('text=/\\$DOOM/').locator('xpath=preceding-sibling::*[1]');
  }

  get lifeBalance(): Locator {
    return this.page.locator('text=/\\$LIFE/').locator('xpath=preceding-sibling::*[1]');
  }

  get threadsTab(): Locator {
    return this.page.getByRole('button', { name: /threads/i });
  }

  get betsTab(): Locator {
    return this.page.getByRole('button', { name: /bets/i });
  }

  get repliesTab(): Locator {
    return this.page.getByRole('button', { name: /replies/i });
  }

  get settingsButton(): Locator {
    return this.page.locator('button').filter({ has: this.page.locator('[class*="settings"]') });
  }

  get editProfileButton(): Locator {
    return this.page.getByRole('button', { name: /edit profile/i });
  }

  get shareProfileButton(): Locator {
    return this.page.getByRole('button', { name: /share profile/i });
  }

  get lifeTimelineButton(): Locator {
    return this.page.getByRole('button', { name: /life timeline/i });
  }

  async switchToThreads(): Promise<void> {
    await this.threadsTab.click();
  }

  async switchToBets(): Promise<void> {
    await this.betsTab.click();
  }

  async switchToReplies(): Promise<void> {
    await this.repliesTab.click();
  }

  async getDoomBalanceValue(): Promise<number> {
    const text = await this.doomBalance.textContent();
    return parseInt(text?.replace(/,/g, '') || '0', 10);
  }

  async getLifeBalanceValue(): Promise<number> {
    const text = await this.lifeBalance.textContent();
    return parseInt(text?.replace(/,/g, '') || '0', 10);
  }

  async verifyPostInThreads(content: string): Promise<void> {
    await this.switchToThreads();
    await expect(this.page.locator('article').filter({ hasText: content })).toBeVisible();
  }

  async verifyBetExists(eventTitle: string): Promise<void> {
    await this.switchToBets();
    await expect(this.page.locator('button').filter({ hasText: eventTitle })).toBeVisible();
  }
}
