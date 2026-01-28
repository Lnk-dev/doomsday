import { test as base, Page } from '@playwright/test';
import { ComposePage } from '../page-objects/ComposePage';
import { DoomScrollPage } from '../page-objects/DoomScrollPage';
import { ProfilePage } from '../page-objects/ProfilePage';
import { EventsPage } from '../page-objects/EventsPage';
import { EventDetailPage } from '../page-objects/EventDetailPage';

// Define custom fixtures
type Fixtures = {
  composePage: ComposePage;
  doomScrollPage: DoomScrollPage;
  profilePage: ProfilePage;
  eventsPage: EventsPage;
  eventDetailPage: EventDetailPage;
  authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  composePage: async ({ page }, use) => {
    await use(new ComposePage(page));
  },

  doomScrollPage: async ({ page }, use) => {
    await use(new DoomScrollPage(page));
  },

  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },

  eventsPage: async ({ page }, use) => {
    await use(new EventsPage(page));
  },

  eventDetailPage: async ({ page }, use) => {
    await use(new EventDetailPage(page));
  },

  // Fixture for authenticated state (if needed in future)
  authenticatedPage: async ({ page }, use) => {
    // Setup authentication if needed
    // await page.goto('/');
    // await setupAuth(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
