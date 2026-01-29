import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class EventDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get doomButton(): Locator {
    return this.page.getByRole('button', { name: /doom/i }).filter({ hasText: /^DOOM$/ });
  }

  get lifeButton(): Locator {
    return this.page.getByRole('button', { name: /life/i }).filter({ hasText: /^LIFE$/ });
  }

  get amountInput(): Locator {
    return this.page.getByRole('spinbutton');
  }

  get placeBetButton(): Locator {
    return this.page.getByRole('button', { name: /bet \d+|insufficient balance/i });
  }

  get balanceDisplay(): Locator {
    return this.page.locator('text=/balance.*\\d+.*\\$doom/i');
  }

  get potentialWinDisplay(): Locator {
    return this.page.locator('text=/potential win/i').locator('..');
  }

  getQuickAmountButton(amount: number): Locator {
    return this.page.getByRole('button', { name: String(amount), exact: true });
  }

  get maxButton(): Locator {
    return this.page.getByRole('button', { name: /max/i });
  }

  async selectDoom(): Promise<void> {
    await this.doomButton.click();
  }

  async selectLife(): Promise<void> {
    await this.lifeButton.click();
  }

  async enterAmount(amount: number): Promise<void> {
    await this.amountInput.fill(String(amount));
  }

  async clickQuickAmount(amount: number): Promise<void> {
    await this.getQuickAmountButton(amount).click();
  }

  async clickMax(): Promise<void> {
    await this.maxButton.click();
  }

  async placeBet(): Promise<void> {
    await this.placeBetButton.click();
  }

  async placeDoomBet(amount: number): Promise<void> {
    await this.selectDoom();
    await this.enterAmount(amount);
    await this.placeBet();
  }

  async placeLifeBet(amount: number): Promise<void> {
    await this.selectLife();
    await this.enterAmount(amount);
    await this.placeBet();
  }

  async verifyBetSuccess(): Promise<void> {
    await expect(this.page.locator('text=/bet placed/i')).toBeVisible();
  }
}
