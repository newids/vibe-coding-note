import { test, expect } from '@playwright/test';

test.describe('Role-Based Access Control E2E', () => {
    test.describe('Owner Role Tests', () => {
        test.beforeEach(async ({ page }) => {
            // Login as owner
            await page.goto('/');
            await page.click('text=Sign In');
            await page.fill('[data-testid="email-input"]', 'owner@example.com');
            await page.fill('[data-testid="password-input"]', 'ownerpassword');
            await page.click('[data-testid="login-button"]');
            await expect(page).toHaveURL('/dashboard');
        });

        test('owner can create notes', async ({ page }) => {
            // Should see create note button
            await expect(page.locator('[data-testid="create-note-button"]')).toBeVisible();

            // Navigate to create note page
            await page.click('[data-testid="create-note-button"]');
            await expect(page).toHaveURL('/notes/create');

            // Fill out note form
            await page.fill('[data-testid="note-title-input"]', 'Owner Created Note');
            await page.fill('[data-testid="note-content-input"]', 'This note was created by the owner.');

            // Select category
            await page.click('[data-testid="category-select"]');
            await page.click('text=JavaScript');

            // Add tags
            const tagInput = page.locator('[data-testid="tag-input"]');
            await tagInput.fill('owner');
            await page.keyboard.press('Enter');
            await tagInput.fill('test');
            await page.keyboard.press('Enter');

            // Save note
            await page.click('[data-testid="save-note-button"]');

            // Should redirect to note detail
            await expect(page).toHaveURL(/\/notes\/[a-zA-Z0-9-]+/);
            await expect(page.locator('text=Owner Created Note')).toBeVisible();
        });

        test('owner can edit any note', async ({ page }) => {
            await page.goto('/notes');
            await page.click('[data-testid="note-card"]');

            // Should see edit button
            await expect(page.locator('[data-testid="edit-note-button"]')).toBeVisible();

            // Click edit
            await page.click('[data-testid="edit-note-button"]');
            await expect(page).toHaveURL(/\/notes\/[a-zA-Z0-9-]+\/edit/);

            // Edit note
            const titleInput = page.locator('[data-testid="note-title-input"]');
            await titleInput.fill('Edited by Owner');
            await page.click('[data-testid="save-note-button"]');

            // Should show updated title
            await expect(page.locator('text=Edited by Owner')).toBeVisible();
        });

        test('owner can delete any note', async ({ page }) => {
            await page.goto('/notes');
            await page.click('[data-testid="note-card"]');

            // Should see delete button
            await expect(page.locator('[data-testid="delete-note-button"]')).toBeVisible();

            // Click delete
            await page.click('[data-testid="delete-note-button"]');

            // Should show confirmation dialog
            await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible();
            await page.click('[data-testid="confirm-delete-button"]');

            // Should redirect to notes list
            await expect(page).toHaveURL('/notes');
        });

        test('owner can moderate any comment', async ({ page }) => {
            await page.goto('/notes');
            await page.click('[data-testid="note-card"]');

            // Should see moderation options on all comments
            const moderateButtons = page.locator('[data-testid="moderate-comment-button"]');
            const buttonCount = await moderateButtons.count();
            expect(buttonCount).toBeGreaterThan(0);

            // Click moderate on first comment
            await moderateButtons.first().click();
            await expect(page.locator('[data-testid="moderation-menu"]')).toBeVisible();

            // Should see edit and delete options
            await expect(page.locator('[data-testid="edit-comment-option"]')).toBeVisible();
            await expect(page.locator('[data-testid="delete-comment-option"]')).toBeVisible();

            // Edit comment
            await page.click('[data-testid="edit-comment-option"]');
            const editInput = page.locator('[data-testid="comment-edit-input"]');
            await editInput.fill('[Moderated] This comment has been edited by the owner.');
            await page.click('[data-testid="save-comment-button"]');

            // Should show moderated comment
            await expect(page.locator('text=[Moderated]')).toBeVisible();
        });

        test('owner can delete any comment', async ({ page }) => {
            await page.goto('/notes');
            await page.click('[data-testid="note-card"]');

            const initialCommentCount = await page.locator('[data-testid="comment-item"]').count();

            // Moderate and delete a comment
            await page.locator('[data-testid="moderate-comment-button"]').first().click();
            await page.click('[data-testid="delete-comment-option"]');

            // Confirm deletion
            await page.click('[data-testid="confirm-delete-comment"]');

            // Should have one less comment
            const newCommentCount = await page.locator('[data-testid="comment-item"]').count();
            expect(newCommentCount).toBe(initialCommentCount - 1);
        });

        test('owner can manage categories and tags', async ({ page }) => {
            await page.goto('/admin/categories');

            // Should see category management interface
            await expect(page.locator('[data-testid="category-management"]')).toBeVisible();

            // Create new category
            await page.click('[data-testid="create-category-button"]');
            await page.fill('[data-testid="category-name-input"]', 'New Category');
            await page.fill('[data-testid="category-description-input"]', 'Description for new category');
            await page.click('[data-testid="save-category-button"]');

            // Should show new category
            await expect(page.locator('text=New Category')).toBeVisible();

            // Go to tag management
            await page.goto('/admin/tags');
            await expect(page.locator('[data-testid="tag-management"]')).toBeVisible();

            // Create new tag
            await page.click('[data-testid="create-tag-button"]');
            await page.fill('[data-testid="tag-name-input"]', 'new-tag');
            await page.click('[data-testid="save-tag-button"]');

            // Should show new tag
            await expect(page.locator('text=new-tag')).toBeVisible();
        });

        test('owner has access to admin dashboard', async ({ page }) => {
            await page.goto('/admin');

            // Should see admin dashboard
            await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();

            // Should see statistics
            await expect(page.locator('[data-testid="total-notes"]')).toBeVisible();
            await expect(page.locator('[data-testid="total-comments"]')).toBeVisible();
            await expect(page.locator('[data-testid="total-users"]')).toBeVisible();

            // Should see recent activity
            await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();
        });
    });

    test.describe('Visitor Role Tests', () => {
        test.beforeEach(async ({ page }) => {
            // Login as visitor
            await page.goto('/');
            await page.click('text=Sign In');
            await page.fill('[data-testid="email-input"]', 'visitor@example.com');
            await page.fill('[data-testid="password-input"]', 'visitorpassword');
            await page.click('[data-testid="login-button"]');
            await expect(page).toHaveURL('/dashboard');
        });

        test('visitor cannot create notes', async ({ page }) => {
            // Should not see create note button
            await expect(page.locator('[data-testid="create-note-button"]')).not.toBeVisible();

            // Direct access to create page should redirect
            await page.goto('/notes/create');
            await expect(page).toHaveURL('/unauthorized');
            await expect(page.locator('text=You do not have permission')).toBeVisible();
        });

        test('visitor cannot edit notes', async ({ page }) => {
            await page.goto('/notes');
            await page.click('[data-testid="note-card"]');

            // Should not see edit button
            await expect(page.locator('[data-testid="edit-note-button"]')).not.toBeVisible();

            // Direct access to edit page should redirect
            const noteId = page.url().split('/').pop();
            await page.goto(`/notes/${noteId}/edit`);
            await expect(page).toHaveURL('/unauthorized');
        });

        test('visitor cannot delete notes', async ({ page }) => {
            await page.goto('/notes');
            await page.click('[data-testid="note-card"]');

            // Should not see delete button
            await expect(page.locator('[data-testid="delete-note-button"]')).not.toBeVisible();
        });

        test('visitor can read notes', async ({ page }) => {
            await page.goto('/notes');

            // Should see notes list
            await expect(page.locator('[data-testid="notes-list"]')).toBeVisible();

            // Can click and view note details
            await page.click('[data-testid="note-card"]');
            await expect(page.locator('[data-testid="note-content"]')).toBeVisible();
        });

        test('visitor can comment on notes', async ({ page }) => {
            await page.goto('/notes');
            await page.click('[data-testid="note-card"]');

            // Should see comment form
            await expect(page.locator('[data-testid="comment-form"]')).toBeVisible();

            // Can add comment
            const commentInput = page.locator('[data-testid="comment-input"]');
            await commentInput.fill('This is a visitor comment.');
            await page.click('[data-testid="comment-submit"]');

            // Should show new comment
            await expect(page.locator('text=This is a visitor comment.')).toBeVisible();
        });

        test('visitor can edit own comments', async ({ page }) => {
            await page.goto('/notes');
            await page.click('[data-testid="note-card"]');

            // Add a comment first
            const commentInput = page.locator('[data-testid="comment-input"]');
            await commentInput.fill('Original visitor comment.');
            await page.click('[data-testid="comment-submit"]');

            // Should see edit option on own comment
            const ownComment = page.locator('[data-testid="comment-item"]').filter({ hasText: 'Original visitor comment.' });
            await ownComment.hover();
            await expect(ownComment.locator('[data-testid="edit-own-comment"]')).toBeVisible();

            // Edit own comment
            await ownComment.locator('[data-testid="edit-own-comment"]').click();
            const editInput = page.locator('[data-testid="comment-edit-input"]');
            await editInput.fill('Edited visitor comment.');
            await page.click('[data-testid="save-comment-button"]');

            // Should show edited comment
            await expect(page.locator('text=Edited visitor comment.')).toBeVisible();
        });

        test('visitor can delete own comments', async ({ page }) => {
            await page.goto('/notes');
            await page.click('[data-testid="note-card"]');

            // Add a comment first
            const commentInput = page.locator('[data-testid="comment-input"]');
            await commentInput.fill('Comment to be deleted.');
            await page.click('[data-testid="comment-submit"]');

            const initialCommentCount = await page.locator('[data-testid="comment-item"]').count();

            // Delete own comment
            const ownComment = page.locator('[data-testid="comment-item"]').filter({ hasText: 'Comment to be deleted.' });
            await ownComment.hover();
            await ownComment.locator('[data-testid="delete-own-comment"]').click();

            // Confirm deletion
            await page.click('[data-testid="confirm-delete-comment"]');

            // Should have one less comment
            const newCommentCount = await page.locator('[data-testid="comment-item"]').count();
            expect(newCommentCount).toBe(initialCommentCount - 1);
        });

        test('visitor cannot edit others comments', async ({ page }) => {
            await page.goto('/notes');
            await page.click('[data-testid="note-card"]');

            // Should not see edit options on others' comments
            const otherComments = page.locator('[data-testid="comment-item"]').filter({ hasNotText: 'visitor@example.com' });
            const otherCommentCount = await otherComments.count();

            for (let i = 0; i < otherCommentCount; i++) {
                const comment = otherComments.nth(i);
                await comment.hover();
                await expect(comment.locator('[data-testid="edit-comment-button"]')).not.toBeVisible();
                await expect(comment.locator('[data-testid="delete-comment-button"]')).not.toBeVisible();
            }
        });

        test('visitor cannot access admin areas', async ({ page }) => {
            // Should not see admin navigation
            await expect(page.locator('[data-testid="admin-nav"]')).not.toBeVisible();

            // Direct access should redirect
            await page.goto('/admin');
            await expect(page).toHaveURL('/unauthorized');
            await expect(page.locator('text=You do not have permission')).toBeVisible();

            // Category management should be restricted
            await page.goto('/admin/categories');
            await expect(page).toHaveURL('/unauthorized');

            // Tag management should be restricted
            await page.goto('/admin/tags');
            await expect(page).toHaveURL('/unauthorized');
        });

        test('visitor can use search and filtering', async ({ page }) => {
            await page.goto('/notes');

            // Can use search
            const searchInput = page.locator('[data-testid="search-input"]');
            await searchInput.fill('React');
            await expect(page.locator('[data-testid="search-results"]')).toBeVisible();

            // Can use category filter
            await page.click('[data-testid="category-filter"]');
            await page.click('text=JavaScript');
            await expect(page.locator('[data-testid="filtered-notes"]')).toBeVisible();

            // Can use tag filter
            await page.click('[data-testid="tag-filter"]');
            await page.click('text=tutorial');
            await expect(page.locator('[data-testid="filtered-notes"]')).toBeVisible();
        });
    });

    test.describe('Anonymous User Tests', () => {
        test('anonymous user can view notes', async ({ page }) => {
            await page.goto('/notes');

            // Should see notes list
            await expect(page.locator('[data-testid="notes-list"]')).toBeVisible();

            // Can view note details
            await page.click('[data-testid="note-card"]');
            await expect(page.locator('[data-testid="note-content"]')).toBeVisible();
        });

        test('anonymous user can like notes', async ({ page }) => {
            await page.goto('/notes');
            await page.click('[data-testid="note-card"]');

            // Should see like button
            const likeButton = page.locator('[data-testid="like-button"]');
            await expect(likeButton).toBeVisible();

            // Can click like
            const initialLikeCount = await page.locator('[data-testid="like-count"]').textContent();
            await likeButton.click();

            // Should increment like count
            await expect(page.locator('[data-testid="like-count"]')).not.toHaveText(initialLikeCount || '0');
        });

        test('anonymous user cannot comment', async ({ page }) => {
            await page.goto('/notes');
            await page.click('[data-testid="note-card"]');

            // Should not see comment form
            await expect(page.locator('[data-testid="comment-form"]')).not.toBeVisible();

            // Should see login prompt for commenting
            await expect(page.locator('[data-testid="login-to-comment"]')).toBeVisible();
            await expect(page.locator('text=Login to leave a comment')).toBeVisible();
        });

        test('anonymous user cannot access protected routes', async ({ page }) => {
            // Dashboard should redirect to login
            await page.goto('/dashboard');
            await expect(page).toHaveURL('/login');

            // Create note should redirect to login
            await page.goto('/notes/create');
            await expect(page).toHaveURL('/login');

            // Admin areas should redirect to login
            await page.goto('/admin');
            await expect(page).toHaveURL('/login');
        });

        test('anonymous user can use search and filtering', async ({ page }) => {
            await page.goto('/notes');

            // Can use search
            const searchInput = page.locator('[data-testid="search-input"]');
            await searchInput.fill('React');
            await expect(page.locator('[data-testid="search-results"]')).toBeVisible();

            // Can use filters
            await page.click('[data-testid="category-filter"]');
            await page.click('text=JavaScript');
            await expect(page.locator('[data-testid="filtered-notes"]')).toBeVisible();
        });
    });

    test.describe('Role Transition Tests', () => {
        test('user role persists across sessions', async ({ page }) => {
            // Login as visitor
            await page.goto('/');
            await page.click('text=Sign In');
            await page.fill('[data-testid="email-input"]', 'visitor@example.com');
            await page.fill('[data-testid="password-input"]', 'visitorpassword');
            await page.click('[data-testid="login-button"]');

            // Verify visitor role
            await expect(page.locator('[data-testid="create-note-button"]')).not.toBeVisible();

            // Reload page
            await page.reload();

            // Should still be visitor
            await expect(page.locator('[data-testid="create-note-button"]')).not.toBeVisible();

            // Logout and login as owner
            await page.click('[data-testid="user-menu"]');
            await page.click('text=Logout');

            await page.click('text=Sign In');
            await page.fill('[data-testid="email-input"]', 'owner@example.com');
            await page.fill('[data-testid="password-input"]', 'ownerpassword');
            await page.click('[data-testid="login-button"]');

            // Should now have owner permissions
            await expect(page.locator('[data-testid="create-note-button"]')).toBeVisible();
        });

        test('role-based UI elements update correctly', async ({ page }) => {
            // Start as anonymous
            await page.goto('/notes');
            await expect(page.locator('[data-testid="login-to-comment"]')).toBeVisible();

            // Login as visitor
            await page.goto('/');
            await page.click('text=Sign In');
            await page.fill('[data-testid="email-input"]', 'visitor@example.com');
            await page.fill('[data-testid="password-input"]', 'visitorpassword');
            await page.click('[data-testid="login-button"]');

            await page.goto('/notes');
            await page.click('[data-testid="note-card"]');

            // Should now see comment form
            await expect(page.locator('[data-testid="comment-form"]')).toBeVisible();
            await expect(page.locator('[data-testid="login-to-comment"]')).not.toBeVisible();

            // Should not see admin options
            await expect(page.locator('[data-testid="edit-note-button"]')).not.toBeVisible();
        });
    });
});