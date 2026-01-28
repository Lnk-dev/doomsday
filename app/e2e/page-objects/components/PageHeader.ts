import { Page, Locator } from '@playwright/test';

export class PageHeader {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get container(): Locator {
    return this.page.locator('header').first();
  }

  get title(): Locator {
    return this.container.locator('h1, h2').first();
  }

  get backButton(): Locator {
    return this.container.locator('button').filter({ has: this.page.locator('svg') }).first();
  }

  get settingsButton(): Locator {
    return this.container.locator('button').filter({ has: this.page.locator('svg') }).last();
  }

  async goBack(): Promise<void> {
    await this.backButton.click();
  }

  async getTitle(): Promise<string> {
    return await this.title.textContent() || '';
  }
}
