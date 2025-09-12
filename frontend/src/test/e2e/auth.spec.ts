import { test, expect } from '@playwright/test';

test.describe('Authentication E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('user can login with valid credentials', async ({ page }) => {
        // Navigate to login page
        await page.click('text=Sign In');

        // Fill login form
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');

        // Submit form
        await page.click('[data-testid="login-button"]');

        // Should redirect to dashboard
        await expect(page).toHaveURL('/dashboard');
        await expect(page.locator('text=Welcome')).toBeVisible();

        // Should show user menu
        await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('user can register new account', async ({ page }) => {
        // Navigate to register page
        await page.click('text=Sign Up');

        // Fill registration form
        await page.fill('[data-testid="name-input"]', 'New User');
        await page.fill('[data-testid="email-input"]', 'newuser@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.fill('[data-testid="confirm-password-input"]', 'password123');

        // Submit form
        await page.click('[data-testid="register-button"]');

        // Should redirect to dashboard
        await expect(page).toHaveURL('/dashboard');
        await expect(page.locator('text=Welcome')).toBeVisible();
    });

    test('shows validation errors for invalid login', async ({ page }) => {
        await page.click('text=Sign In');

        // Try to submit empty form
        await page.click('[data-testid="login-button"]');

        // Should show validation errors
        await expect(page.locator('text=Email is required')).toBeVisible();
        await expect(page.locator('text=Password is required')).toBeVisible();

        // Fill invalid email
        await page.fill('[data-testid="email-input"]', 'invalid-email');
        await page.click('[data-testid="login-button"]');

        await expect(page.locator('text=Invalid email format')).toBeVisible();
    });

    test('user can logout', async ({ page }) => {
        // Login first
        await page.click('text=Sign In');
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');

        await expect(page).toHaveURL('/dashboard');

        // Logout
        await page.click('[data-testid="user-menu"]');
        await page.click('text=Logout');

        // Should redirect to home/login
        await expect(page).toHaveURL('/');
        await expect(page.locator('text=Sign In')).toBeVisible();
    });

    test('social login buttons are present', async ({ page }) => {
        await page.click('text=Sign In');

        await expect(page.locator('[data-testid="google-login"]')).toBeVisible();
        await expect(page.locator('[data-testid="github-login"]')).toBeVisible();
        await expect(page.locator('[data-testid="facebook-login"]')).toBeVisible();
    });

    test('password visibility toggle works', async ({ page }) => {
        await page.click('text=Sign In');

        const passwordInput = page.locator('[data-testid="password-input"]');
        const toggleButton = page.locator('[data-testid="password-toggle"]');

        // Initially password should be hidden
        await expect(passwordInput).toHaveAttribute('type', 'password');

        // Click toggle to show password
        await toggleButton.click();
        await expect(passwordInput).toHaveAttribute('type', 'text');

        // Click toggle to hide password again
        await toggleButton.click();
        await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('remember me checkbox works', async ({ page }) => {
        await page.click('text=Sign In');

        const rememberCheckbox = page.locator('[data-testid="remember-me"]');

        // Initially unchecked
        await expect(rememberCheckbox).not.toBeChecked();

        // Check the box
        await rememberCheckbox.check();
        await expect(rememberCheckbox).toBeChecked();

        // Login with remember me checked
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');

        // Should set longer-lasting token (implementation dependent)
        await expect(page).toHaveURL('/dashboard');
    });
});