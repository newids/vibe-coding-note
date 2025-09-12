import { test, expect } from '@playwright/test';

test.describe('Notes E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/');
        await page.click('text=Sign In');
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');
        await expect(page).toHaveURL('/dashboard');
    });

    test('user can view notes list', async ({ page }) => {
        await page.goto('/notes');

        // Should show notes list
        await expect(page.locator('[data-testid="notes-list"]')).toBeVisible();

        // Should show note cards
        await expect(page.locator('[data-testid="note-card"]').first()).toBeVisible();

        // Should show note titles
        await expect(page.locator('text=Test Note')).toBeVisible();
    });

    test('user can search notes', async ({ page }) => {
        await page.goto('/notes');

        // Use search bar
        const searchInput = page.locator('[data-testid="search-input"]');
        await searchInput.fill('React');

        // Should filter notes
        await expect(page.locator('[data-testid="note-card"]')).toHaveCount(1);
        await expect(page.locator('text=React Tutorial')).toBeVisible();

        // Clear search
        await searchInput.fill('');
        await expect(page.locator('[data-testid="note-card"]')).toHaveCount(2);
    });

    test('user can filter notes by category', async ({ page }) => {
        await page.goto('/notes');

        // Click category filter
        await page.click('[data-testid="category-filter"]');
        await page.click('text=JavaScript');

        // Should filter notes by category
        await expect(page.locator('[data-testid="note-card"]')).toHaveCount(1);
        await expect(page.locator('text=JavaScript')).toBeVisible();
    });

    test('user can view note details', async ({ page }) => {
        await page.goto('/notes');

        // Click on first note
        await page.click('[data-testid="note-card"]');

        // Should navigate to note detail page
        await expect(page).toHaveURL(/\/notes\/[a-zA-Z0-9-]+/);

        // Should show note content
        await expect(page.locator('[data-testid="note-title"]')).toBeVisible();
        await expect(page.locator('[data-testid="note-content"]')).toBeVisible();
        await expect(page.locator('[data-testid="note-author"]')).toBeVisible();

        // Should show comments section
        await expect(page.locator('[data-testid="comments-section"]')).toBeVisible();
    });

    test('user can like a note', async ({ page }) => {
        await page.goto('/notes');

        const likeButton = page.locator('[data-testid="like-button"]').first();
        const likeCount = page.locator('[data-testid="like-count"]').first();

        // Get initial like count
        const initialCount = await likeCount.textContent();

        // Click like button
        await likeButton.click();

        // Should increment like count
        await expect(likeCount).not.toHaveText(initialCount || '0');

        // Like button should show liked state
        await expect(likeButton).toHaveClass(/liked/);
    });

    test('user can add comment to note', async ({ page }) => {
        await page.goto('/notes');
        await page.click('[data-testid="note-card"]');

        // Scroll to comments section
        await page.locator('[data-testid="comments-section"]').scrollIntoViewIfNeeded();

        // Add comment
        const commentInput = page.locator('[data-testid="comment-input"]');
        await commentInput.fill('This is a great article!');
        await page.click('[data-testid="comment-submit"]');

        // Should show new comment
        await expect(page.locator('text=This is a great article!')).toBeVisible();

        // Comment input should be cleared
        await expect(commentInput).toHaveValue('');
    });

    test('pagination works correctly', async ({ page }) => {
        await page.goto('/notes');

        // Should show pagination if there are many notes
        const pagination = page.locator('[data-testid="pagination"]');

        if (await pagination.isVisible()) {
            // Click next page
            await page.click('[data-testid="next-page"]');

            // Should load next page
            await expect(page).toHaveURL(/page=2/);

            // Should show different notes
            await expect(page.locator('[data-testid="note-card"]')).toBeVisible();

            // Click previous page
            await page.click('[data-testid="prev-page"]');
            await expect(page).toHaveURL(/page=1/);
        }
    });

    test('infinite scroll works', async ({ page }) => {
        await page.goto('/notes');

        // Get initial number of notes
        const initialNotes = await page.locator('[data-testid="note-card"]').count();

        // Scroll to bottom
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        // Should load more notes
        await expect(page.locator('[data-testid="note-card"]')).toHaveCount(initialNotes + 10);
    });

    test('responsive design works on mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/notes');

        // Should show mobile layout
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

        // Notes should stack vertically
        const noteCards = page.locator('[data-testid="note-card"]');
        const firstCard = noteCards.first();
        const secondCard = noteCards.nth(1);

        const firstCardBox = await firstCard.boundingBox();
        const secondCardBox = await secondCard.boundingBox();

        // Second card should be below first card (not side by side)
        expect(secondCardBox?.y).toBeGreaterThan(firstCardBox?.y || 0);
    });

    test('note tags are clickable and filter notes', async ({ page }) => {
        await page.goto('/notes');

        // Click on a tag
        await page.click('[data-testid="note-tag"]');

        // Should filter notes by tag
        await expect(page).toHaveURL(/tag=/);
        await expect(page.locator('[data-testid="note-card"]')).toHaveCount(1);
    });

    test('error states are handled gracefully', async ({ page }) => {
        // Mock network failure
        await page.route('**/api/notes', route => route.abort());

        await page.goto('/notes');

        // Should show error message
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        await expect(page.locator('text=Failed to load notes')).toBeVisible();

        // Should show retry button
        await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });
});