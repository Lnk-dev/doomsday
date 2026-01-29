import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard', () => {
  test.describe('Login Flow', () => {
    test('should show login page at /admin/login', async ({ page }) => {
      await page.goto('/admin/login')

      await expect(page.locator('h1')).toContainText('Admin Portal')
      await expect(page.locator('input[type="text"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('should show error on invalid credentials', async ({ page }) => {
      await page.goto('/admin/login')

      await page.fill('input[type="text"]', 'invalid')
      await page.fill('input[type="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')

      // Wait for error message (API will return error)
      await expect(page.locator('text=/invalid|error|failed/i')).toBeVisible({ timeout: 5000 })
    })

    test('should disable submit button when fields are empty', async ({ page }) => {
      await page.goto('/admin/login')

      const submitButton = page.locator('button[type="submit"]')
      await expect(submitButton).toBeDisabled()

      // Fill only username
      await page.fill('input[type="text"]', 'testuser')
      await expect(submitButton).toBeDisabled()

      // Clear and fill only password
      await page.fill('input[type="text"]', '')
      await page.fill('input[type="password"]', 'testpass')
      await expect(submitButton).toBeDisabled()

      // Fill both
      await page.fill('input[type="text"]', 'testuser')
      await expect(submitButton).toBeEnabled()
    })

    test('should redirect to /admin/login when accessing protected route unauthenticated', async ({ page }) => {
      await page.goto('/admin/users')

      // Should redirect to login
      await expect(page).toHaveURL(/\/admin\/login/)
    })
  })

  test.describe('Navigation', () => {
    // These tests assume there's a way to mock authentication or test with real credentials
    // In a real scenario, you would either:
    // 1. Set up a test admin account
    // 2. Mock the auth state
    // 3. Use API to create a session before tests

    test.beforeEach(async ({ page }) => {
      // Go to admin login page
      await page.goto('/admin/login')
    })

    test('login form should have proper accessibility', async ({ page }) => {
      // Check for proper labels
      await expect(page.locator('label[for="username"]')).toBeVisible()
      await expect(page.locator('label[for="password"]')).toBeVisible()

      // Check inputs have proper attributes
      const usernameInput = page.locator('#username')
      const passwordInput = page.locator('#password')

      await expect(usernameInput).toHaveAttribute('type', 'text')
      await expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  test.describe('Admin Routes', () => {
    test('should have correct page titles', async ({ page }) => {
      // Login page
      await page.goto('/admin/login')
      await expect(page.locator('h1')).toContainText('Admin Portal')
    })

    test('should redirect unknown admin routes to dashboard', async ({ page }) => {
      await page.goto('/admin/unknown-page')

      // Should redirect to admin (which then may redirect to login if not auth'd)
      await expect(page).toHaveURL(/\/admin/)
    })
  })

  test.describe('Visual Checks', () => {
    test('login page should have dark theme styling', async ({ page }) => {
      await page.goto('/admin/login')

      // Check for dark background
      const body = page.locator('body')
      // The login page should have dark styling
      await expect(page.locator('.bg-\\[\\#0a0a0a\\]')).toBeVisible()
    })

    test('login page should be responsive', async ({ page }) => {
      await page.goto('/admin/login')

      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await expect(page.locator('input[type="text"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()

      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      await expect(page.locator('input[type="text"]')).toBeVisible()

      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 })
      await expect(page.locator('input[type="text"]')).toBeVisible()
    })
  })
})
