import { Page, Locator } from '@playwright/test';

export class BottomNav {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get container(): Locator {
    return this.page.locator('nav').last();
  }

  get homeLink(): Locator {
    return this.container.getByRole('link').nth(0);
  }

  get eventsLink(): Locator {
    return this.container.getByRole('link').nth(1);
  }

  get composeLink(): Locator {
    return this.container.getByRole('link').nth(2);
  }

  get activityLink(): Locator {
    return this.container.getByRole('link').nth(3);
  }

  get profileLink(): Locator {
    return this.container.getByRole('link').nth(4);
  }

  async goToHome(): Promise<void> {
    await this.homeLink.click();
    await this.page.waitForURL('/');
  }

  async goToEvents(): Promise<void> {
    await this.eventsLink.click();
    await this.page.waitForURL('/events');
  }

  async goToCompose(): Promise<void> {
    await this.composeLink.click();
    await this.page.waitForURL('/compose');
  }

  async goToActivity(): Promise<void> {
    await this.activityLink.click();
    await this.page.waitForURL('/life');
  }

  async goToProfile(): Promise<void> {
    await this.profileLink.click();
    await this.page.waitForURL('/profile');
  }
}
