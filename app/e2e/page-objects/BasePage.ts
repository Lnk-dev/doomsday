import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Common selectors
  get bottomNav(): Locator {
    return this.page.locator('nav').last();
  }

  get homeButton(): Locator {
    return this.bottomNav.getByRole('link', { name: /home/i });
  }

  get searchButton(): Locator {
    return this.bottomNav.getByRole('link', { name: /search/i });
  }

  get composeButton(): Locator {
    return this.bottomNav.getByRole('link', { name: /compose|new/i });
  }

  get activityButton(): Locator {
    return this.bottomNav.getByRole('link', { name: /activity|heart/i });
  }

  get profileButton(): Locator {
    return this.bottomNav.getByRole('link', { name: /profile/i });
  }

  // Common actions
  async navigateToHome(): Promise<void> {
    await this.homeButton.click();
    await this.page.waitForURL('/');
  }

  async navigateToProfile(): Promise<void> {
    await this.profileButton.click();
    await this.page.waitForURL('/profile');
  }

  async navigateToCompose(): Promise<void> {
    await this.composeButton.click();
    await this.page.waitForURL('/compose');
  }

  async navigateToEvents(): Promise<void> {
    await this.searchButton.click();
    await this.page.waitForURL('/events');
  }

  async navigateToActivity(): Promise<void> {
    await this.activityButton.click();
    await this.page.waitForURL('/life');
  }

  // Wait helpers
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }
}
