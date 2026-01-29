import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MessagesPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Inbox page elements
  get pageTitle(): Locator {
    return this.page.getByRole('heading', { name: 'Messages' });
  }

  get archiveButton(): Locator {
    return this.page.getByTitle(/archive/i);
  }

  get newMessageButton(): Locator {
    return this.page.getByTitle(/new message/i);
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder(/search/i);
  }

  get conversationList(): Locator {
    return this.page.locator('[class*="divide-y"]');
  }

  get emptyState(): Locator {
    return this.page.getByText(/no messages yet/i);
  }

  get signInPrompt(): Locator {
    return this.page.getByText(/sign in to message/i);
  }

  // New message page elements
  get userSearchInput(): Locator {
    return this.page.getByPlaceholder(/search for a user/i);
  }

  get searchResults(): Locator {
    return this.page.locator('button[class*="flex items-center gap-3"]');
  }

  get selectedUserChip(): Locator {
    return this.page.locator('[class*="rounded-full"][class*="bg-"]').filter({ hasText: /@/ });
  }

  get messageInput(): Locator {
    return this.page.getByPlaceholder(/type your message/i);
  }

  get sendButton(): Locator {
    return this.page.getByRole('button').filter({ has: this.page.locator('svg') }).last();
  }

  // Conversation page elements
  get backButton(): Locator {
    return this.page.locator('button').filter({ has: this.page.locator('[class*="lucide-arrow-left"]') });
  }

  get menuButton(): Locator {
    return this.page.locator('button').filter({ has: this.page.locator('[class*="lucide-more-vertical"]') });
  }

  get muteButton(): Locator {
    return this.page.getByRole('button', { name: /mute/i });
  }

  get unmuteButton(): Locator {
    return this.page.getByRole('button', { name: /unmute/i });
  }

  get archiveConversationButton(): Locator {
    return this.page.getByRole('button', { name: /archive/i });
  }

  get messages(): Locator {
    return this.page.locator('[class*="rounded-2xl"][class*="px-4"]');
  }

  get replyButton(): Locator {
    return this.page.locator('button[title="Reply"]');
  }

  get deleteButton(): Locator {
    return this.page.locator('button[title="Delete"]');
  }

  // Actions
  async goto(): Promise<void> {
    await this.page.goto('/messages');
  }

  async gotoNewMessage(): Promise<void> {
    await this.page.goto('/messages/new');
  }

  async searchUser(username: string): Promise<void> {
    await this.userSearchInput.fill(username);
    await this.page.waitForTimeout(500); // Wait for debounce
  }

  async selectFirstSearchResult(): Promise<void> {
    await this.searchResults.first().click();
  }

  async sendMessage(text: string): Promise<void> {
    await this.messageInput.fill(text);
    await this.sendButton.click();
  }

  async openMenu(): Promise<void> {
    await this.menuButton.click();
  }

  async clickConversation(index: number = 0): Promise<void> {
    await this.conversationList.locator('a').nth(index).click();
  }
}
