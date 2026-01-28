import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class EventsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder(/search events/i);
  }

  get categoryButtons(): Locator {
    return this.page.locator('button').filter({ hasText: /technology|economic|climate|war|natural|social/i });
  }

  get eventCards(): Locator {
    return this.page.locator('button').filter({ hasText: /\d+d|\d+h/ });
  }

  getCategoryButton(category: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(category, 'i') });
  }

  getEventByTitle(title: string): Locator {
    return this.page.locator('button').filter({ hasText: title });
  }

  async searchEvents(query: string): Promise<void> {
    await this.searchInput.fill(query);
    // Wait for debounce
    await this.page.waitForTimeout(500);
  }

  async filterByCategory(category: string): Promise<void> {
    await this.getCategoryButton(category).click();
  }

  async clickFirstEvent(): Promise<void> {
    await this.eventCards.first().click();
    await this.page.waitForURL(/\/events\/.+/);
  }

  async clickEvent(title: string): Promise<void> {
    await this.getEventByTitle(title).click();
    await this.page.waitForURL(/\/events\/.+/);
  }

  async verifySearchResults(query: string): Promise<void> {
    const searchValue = await this.searchInput.inputValue();
    expect(searchValue).toBe(query);
  }

  async verifyCategoryFilterActive(category: string): Promise<void> {
    await expect(this.getCategoryButton(category)).toHaveClass(/bg-white/);
  }
}
