import { test, expect } from '@playwright/test';

test.describe('Complete User Workflow E2E', () => {
    test('complete user journey from registration to content interaction', async ({ page }) => {
        // 1. Visit homepage
        await page.goto('/');
        await expect(page.locator('h1')).toContainText('Vibe Coding Notes');

        // 2. Register new account
        await page.click('text=Sign Up');
        await page.fill('[data-testid="name-input"]', 'Integration Test User');
        await page.fill('[data-testid="email-input"]', 'integration@test.com');
        await page.fill('[data-testid="password-input"]', 'TestPassword123!');
        await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!');
        await page.click('[data-testid="register-button"]');

        // Should redirect to dashboard
        await expect(page).toHaveURL('/dashboard');
        await expect(page.locator('text=Welcome')).toBeVisible();

        // 3. Browse notes
        await page.goto('/notes');
        await expect(page.locator('[data-testid="notes-list"]')).toBeVisible();

        // 4. Search for specific content
        const searchInput = page.locator('[data-testid="search-input"]');
        await searchInput.fill('React');
        await page.keyboard.press('Enter');

        // Should show filtered results
        await expect(page.locator('[data-testid="search-results"]')).toBeVisible();

        // 5. Filter by category
        await page.click('[data-testid="category-filter"]');
        await page.click('text=JavaScript');
        await expect(page.locator('[data-testid="filtered-notes"]')).toBeVisible();

        // 6. View note details
        await page.click('[data-testid="note-card"]');
        await expect(page).toHaveURL(/\/notes\/[a-zA-Z0-9-]+/);
        await expect(page.locator('[data-testid="note-title"]')).toBeVisible();
        await expect(page.locator('[data-testid="note-content"]')).toBeVisible();

        // 7. Like the note (anonymous functionality)
        const likeButton = page.locator('[data-testid="like-button"]');
        const initialLikeCount = await page.locator('[data-testid="like-count"]').textContent();
        await likeButton.click();

        // Should increment like count
        await expect(page.locator('[data-testid="like-count"]')).not.toHaveText(initialLikeCount || '0');
        await expect(likeButton).toHaveClass(/liked/);

        // 8. Add a comment
        await page.locator('[data-testid="comments-section"]').scrollIntoViewIfNeeded();
        const commentInput = page.locator('[data-testid="comment-input"]');
        await commentInput.fill('This is a very helpful article! Thanks for sharing.');
        await page.click('[data-testid="comment-submit"]');

        // Should show new comment
        await expect(page.locator('text=This is a very helpful article!')).toBeVisible();
        await expect(page.locator('[data-testid="comment-author"]')).toContainText('Integration Test User');

        // 9. Edit own comment
        await page.hover('[data-testid="comment-item"]');
        await page.click('[data-testid="edit-comment-button"]');
        const editInput = page.locator('[data-testid="comment-edit-input"]');
        await editInput.fill('This is a very helpful article! Thanks for sharing. Updated comment.');
        await page.click('[data-testid="save-comment-button"]');

        // Should show updated comment
        await expect(page.locator('text=Updated comment')).toBeVisible();

        // 10. Test tag filtering
        await page.click('[data-testid="note-tag"]');
        await expect(page).toHaveURL(/tag=/);
        await expect(page.locator('[data-testid="filtered-notes"]')).toBeVisible();

        // 11. Test pagination/infinite scroll
        await page.goto('/notes');
        const initialNoteCount = await page.locator('[data-testid="note-card"]').count();

        // Scroll to bottom to trigger infinite scroll
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000); // Wait for loading

        const newNoteCount = await page.locator('[data-testid="note-card"]').count();
        expect(newNoteCount).toBeGreaterThan(initialNoteCount);

        // 12. Test responsive design
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

        // Mobile navigation should work
        await page.click('[data-testid="mobile-menu-button"]');
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

        // 13. Logout
        await page.setViewportSize({ width: 1280, height: 720 }); // Back to desktop
        await page.click('[data-testid="user-menu"]');
        await page.click('text=Logout');

        // Should redirect to home
        await expect(page).toHaveURL('/');
        await expect(page.locator('text=Sign In')).toBeVisible();

        // 14. Login again to verify persistence
        await page.click('text=Sign In');
        await page.fill('[data-testid="email-input"]', 'integration@test.com');
        await page.fill('[data-testid="password-input"]', 'TestPassword123!');
        await page.click('[data-testid="login-button"]');

        // Should be logged in and see dashboard
        await expect(page).toHaveURL('/dashboard');
        await expect(page.locator('text=Integration Test User')).toBeVisible();
    });

    test('owner role functionality', async ({ page }) => {
        // Login as owner
        await page.goto('/');
        await page.click('text=Sign In');
        await page.fill('[data-testid="email-input"]', 'owner@example.com');
        await page.fill('[data-testid="password-input"]', 'ownerpassword');
        await page.click('[data-testid="login-button"]');

        await expect(page).toHaveURL('/dashboard');

        // 1. Create new note (owner only)
        await page.click('[data-testid="create-note-button"]');
        await expect(page).toHaveURL('/notes/create');

        await page.fill('[data-testid="note-title-input"]', 'New Integration Test Note');
        await page.fill('[data-testid="note-content-input"]', 'This is content for the integration test note.');

        // Select category
        await page.click('[data-testid="category-select"]');
        await page.click('text=JavaScript');

        // Add tags
        const tagInput = page.locator('[data-testid="tag-input"]');
        await tagInput.fill('testing');
        await page.keyboard.press('Enter');
        await tagInput.fill('integration');
        await page.keyboard.press('Enter');

        // Save note
        await page.click('[data-testid="save-note-button"]');

        // Should redirect to note detail
        await expect(page).toHaveURL(/\/notes\/[a-zA-Z0-9-]+/);
        await expect(page.locator('text=New Integration Test Note')).toBeVisible();

        // 2. Edit note (owner only)
        await page.click('[data-testid="edit-note-button"]');
        await expect(page).toHaveURL(/\/notes\/[a-zA-Z0-9-]+\/edit/);

        const titleInput = page.locator('[data-testid="note-title-input"]');
        await titleInput.fill('Updated Integration Test Note');
        await page.click('[data-testid="save-note-button"]');

        // Should show updated title
        await expect(page.locator('text=Updated Integration Test Note')).toBeVisible();

        // 3. Moderate comments (owner can edit/delete any comment)
        await page.goto('/notes');
        await page.click('[data-testid="note-card"]'); // Click any note with comments

        // Should see moderation options on all comments
        await expect(page.locator('[data-testid="moderate-comment-button"]')).toBeVisible();

        // Edit someone else's comment
        await page.click('[data-testid="moderate-comment-button"]');
        await page.click('text=Edit');

        const moderateInput = page.locator('[data-testid="comment-edit-input"]');
        await moderateInput.fill('[Moderated] This comment has been edited by moderator.');
        await page.click('[data-testid="save-comment-button"]');

        // Should show moderated comment
        await expect(page.locator('text=[Moderated]')).toBeVisible();

        // 4. Delete note (owner only)
        await page.goto('/notes');
        await page.click('[data-testid="note-card"]');
        await page.click('[data-testid="delete-note-button"]');

        // Confirm deletion
        await page.click('[data-testid="confirm-delete-button"]');

        // Should redirect to notes list
        await expect(page).toHaveURL('/notes');

        // Note should be removed from list
        await expect(page.locator('text=Updated Integration Test Note')).not.toBeVisible();
    });

    test('error handling and edge cases', async ({ page }) => {
        // 1. Test network errors
        await page.route('**/api/notes', route => route.abort());
        await page.goto('/notes');

        // Should show error state
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

        // Retry should work
        await page.unroute('**/api/notes');
        await page.click('[data-testid="retry-button"]');
        await expect(page.locator('[data-testid="notes-list"]')).toBeVisible();

        // 2. Test form validation
        await page.goto('/');
        await page.click('text=Sign In');
        await page.click('[data-testid="login-button"]'); // Submit empty form

        await expect(page.locator('text=Email is required')).toBeVisible();
        await expect(page.locator('text=Password is required')).toBeVisible();

        // 3. Test invalid email format
        await page.fill('[data-testid="email-input"]', 'invalid-email');
        await page.click('[data-testid="login-button"]');
        await expect(page.locator('text=Invalid email format')).toBeVisible();

        // 4. Test password strength (registration)
        await page.click('text=Sign Up');
        await page.fill('[data-testid="password-input"]', '123');
        await page.click('[data-testid="register-button"]');
        await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();

        // 5. Test password confirmation mismatch
        await page.fill('[data-testid="password-input"]', 'ValidPassword123!');
        await page.fill('[data-testid="confirm-password-input"]', 'DifferentPassword123!');
        await page.click('[data-testid="register-button"]');
        await expect(page.locator('text=Passwords do not match')).toBeVisible();

        // 6. Test unauthorized access
        await page.goto('/notes/create');
        // Should redirect to login if not authenticated
        await expect(page).toHaveURL('/login');

        // 7. Test 404 handling
        await page.goto('/notes/non-existent-note-id');
        await expect(page.locator('text=Note not found')).toBeVisible();
        await expect(page.locator('[data-testid="back-to-notes-button"]')).toBeVisible();
    });

    test('accessibility compliance', async ({ page }) => {
        await page.goto('/');

        // Test keyboard navigation
        await page.keyboard.press('Tab');
        await expect(page.locator(':focus')).toBeVisible();

        // Test ARIA labels
        await expect(page.locator('[aria-label]')).toHaveCount(5); // Adjust based on actual count

        // Test heading hierarchy
        const h1 = await page.locator('h1').count();
        expect(h1).toBeGreaterThan(0);

        // Test alt text on images
        const images = page.locator('img');
        const imageCount = await images.count();

        for (let i = 0; i < imageCount; i++) {
            const img = images.nth(i);
            const alt = await img.getAttribute('alt');
            expect(alt).toBeTruthy();
        }

        // Test form labels
        await page.click('text=Sign In');
        const inputs = page.locator('input');
        const inputCount = await inputs.count();

        for (let i = 0; i < inputCount; i++) {
            const input = inputs.nth(i);
            const id = await input.getAttribute('id');
            const label = page.locator(`label[for="${id}"]`);
            await expect(label).toBeVisible();
        }

        // Test color contrast (basic check)
        const backgroundColor = await page.evaluate(() => {
            const body = document.body;
            return window.getComputedStyle(body).backgroundColor;
        });

        const textColor = await page.evaluate(() => {
            const body = document.body;
            return window.getComputedStyle(body).color;
        });

        // Basic contrast check (should not be the same)
        expect(backgroundColor).not.toBe(textColor);
    });

    test('performance and loading states', async ({ page }) => {
        // Test loading states
        await page.goto('/notes');

        // Should show loading skeleton initially
        await expect(page.locator('[data-testid="loading-skeleton"]')).toBeVisible();

        // Should hide loading skeleton when content loads
        await expect(page.locator('[data-testid="loading-skeleton"]')).not.toBeVisible();
        await expect(page.locator('[data-testid="notes-list"]')).toBeVisible();

        // Test image lazy loading
        const images = page.locator('img[loading="lazy"]');
        const imageCount = await images.count();
        expect(imageCount).toBeGreaterThan(0);

        // Test infinite scroll loading
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await expect(page.locator('[data-testid="loading-more"]')).toBeVisible();

        // Wait for more content to load
        await page.waitForTimeout(2000);
        await expect(page.locator('[data-testid="loading-more"]')).not.toBeVisible();

        // Test search debouncing
        const searchInput = page.locator('[data-testid="search-input"]');
        await searchInput.fill('test');

        // Should not search immediately
        await page.waitForTimeout(100);

        // Should search after debounce delay
        await page.waitForTimeout(500);
        await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    });
});