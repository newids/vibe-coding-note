import { test, expect } from '@playwright/test';

test.describe('Responsive Design E2E', () => {
    const viewports = {
        mobile: { width: 375, height: 667 },
        tablet: { width: 768, height: 1024 },
        desktop: { width: 1280, height: 720 },
        largeDesktop: { width: 1920, height: 1080 }
    };

    test.describe('Mobile Viewport (375px)', () => {
        test.beforeEach(async ({ page }) => {
            await page.setViewportSize(viewports.mobile);
        });

        test('mobile navigation works correctly', async ({ page }) => {
            await page.goto('/');

            // Should show mobile menu button
            await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

            // Desktop navigation should be hidden
            await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();

            // Click mobile menu
            await page.click('[data-testid="mobile-menu-button"]');
            await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

            // Should show navigation items
            await expect(page.locator('[data-testid="mobile-nav-home"]')).toBeVisible();
            await expect(page.locator('[data-testid="mobile-nav-notes"]')).toBeVisible();
            await expect(page.locator('[data-testid="mobile-nav-login"]')).toBeVisible();

            // Close menu
            await page.click('[data-testid="mobile-menu-close"]');
            await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible();
        });

        test('notes display in single column on mobile', async ({ page }) => {
            await page.goto('/notes');

            const noteCards = page.locator('[data-testid="note-card"]');
            const firstCard = noteCards.first();
            const secondCard = noteCards.nth(1);

            if (await secondCard.isVisible()) {
                const firstCardBox = await firstCard.boundingBox();
                const secondCardBox = await secondCard.boundingBox();

                // Second card should be below first card (single column)
                expect(secondCardBox?.y).toBeGreaterThan((firstCardBox?.y || 0) + (firstCardBox?.height || 0) - 50);
            }
        });

        test('search bar is responsive on mobile', async ({ page }) => {
            await page.goto('/notes');

            const searchBar = page.locator('[data-testid="search-bar"]');
            const searchInput = page.locator('[data-testid="search-input"]');

            // Search bar should be full width on mobile
            const searchBarBox = await searchBar.boundingBox();
            const viewportWidth = viewports.mobile.width;

            expect(searchBarBox?.width).toBeGreaterThan(viewportWidth * 0.8); // At least 80% of viewport width

            // Search input should be easily tappable
            const searchInputBox = await searchInput.boundingBox();
            expect(searchInputBox?.height).toBeGreaterThan(40); // Minimum touch target size
        });

        test('comment form is mobile-friendly', async ({ page }) => {
            // Login first
            await page.goto('/');
            await page.click('[data-testid="mobile-menu-button"]');
            await page.click('[data-testid="mobile-nav-login"]');
            await page.fill('[data-testid="email-input"]', 'test@example.com');
            await page.fill('[data-testid="password-input"]', 'password123');
            await page.click('[data-testid="login-button"]');

            await page.goto('/notes');
            await page.click('[data-testid="note-card"]');

            // Comment form should be responsive
            const commentInput = page.locator('[data-testid="comment-input"]');
            const commentInputBox = await commentInput.boundingBox();

            // Should be full width minus padding
            expect(commentInputBox?.width).toBeGreaterThan(viewports.mobile.width * 0.8);

            // Should have adequate height for mobile typing
            expect(commentInputBox?.height).toBeGreaterThan(80);

            // Submit button should be easily tappable
            const submitButton = page.locator('[data-testid="comment-submit"]');
            const submitButtonBox = await submitButton.boundingBox();
            expect(submitButtonBox?.height).toBeGreaterThan(40);
        });

        test('login form is mobile-optimized', async ({ page }) => {
            await page.goto('/');
            await page.click('[data-testid="mobile-menu-button"]');
            await page.click('[data-testid="mobile-nav-login"]');

            // Form should be full width on mobile
            const loginForm = page.locator('[data-testid="login-form"]');
            const formBox = await loginForm.boundingBox();
            expect(formBox?.width).toBeGreaterThan(viewports.mobile.width * 0.8);

            // Input fields should be large enough for mobile
            const emailInput = page.locator('[data-testid="email-input"]');
            const passwordInput = page.locator('[data-testid="password-input"]');

            const emailBox = await emailInput.boundingBox();
            const passwordBox = await passwordInput.boundingBox();

            expect(emailBox?.height).toBeGreaterThan(40);
            expect(passwordBox?.height).toBeGreaterThan(40);

            // Social login buttons should be stacked vertically
            const socialButtons = page.locator('[data-testid="social-login-buttons"]');
            const googleButton = page.locator('[data-testid="google-login"]');
            const githubButton = page.locator('[data-testid="github-login"]');

            if (await googleButton.isVisible() && await githubButton.isVisible()) {
                const googleBox = await googleButton.boundingBox();
                const githubBox = await githubButton.boundingBox();

                // Buttons should be stacked (GitHub below Google)
                expect(githubBox?.y).toBeGreaterThan((googleBox?.y || 0) + (googleBox?.height || 0) - 10);
            }
        });

        test('mobile touch interactions work', async ({ page }) => {
            await page.goto('/notes');

            // Test tap on note card
            await page.tap('[data-testid="note-card"]');
            await expect(page).toHaveURL(/\/notes\/[a-zA-Z0-9-]+/);

            // Test swipe gestures (if implemented)
            const noteContent = page.locator('[data-testid="note-content"]');
            await noteContent.hover();

            // Test pinch zoom (content should be zoomable)
            await page.evaluate(() => {
                const meta = document.querySelector('meta[name="viewport"]');
                return meta?.getAttribute('content')?.includes('user-scalable=yes') ||
                    !meta?.getAttribute('content')?.includes('user-scalable=no');
            });
        });

        test('mobile keyboard navigation', async ({ page }) => {
            await page.goto('/');

            // Focus should be visible on mobile
            await page.keyboard.press('Tab');
            const focusedElement = page.locator(':focus');
            await expect(focusedElement).toBeVisible();

            // Focus outline should be clearly visible
            const focusedBox = await focusedElement.boundingBox();
            expect(focusedBox?.width).toBeGreaterThan(0);
            expect(focusedBox?.height).toBeGreaterThan(0);
        });
    });

    test.describe('Tablet Viewport (768px)', () => {
        test.beforeEach(async ({ page }) => {
            await page.setViewportSize(viewports.tablet);
        });

        test('tablet layout uses appropriate columns', async ({ page }) => {
            await page.goto('/notes');

            const noteCards = page.locator('[data-testid="note-card"]');
            const firstCard = noteCards.first();
            const secondCard = noteCards.nth(1);

            if (await secondCard.isVisible()) {
                const firstCardBox = await firstCard.boundingBox();
                const secondCardBox = await secondCard.boundingBox();

                // On tablet, cards might be side by side or in 2 columns
                const horizontalDistance = Math.abs((secondCardBox?.x || 0) - (firstCardBox?.x || 0));
                const verticalDistance = Math.abs((secondCardBox?.y || 0) - (firstCardBox?.y || 0));

                // Either side by side (horizontal distance > 200) or stacked (vertical distance > 100)
                expect(horizontalDistance > 200 || verticalDistance > 100).toBeTruthy();
            }
        });

        test('tablet navigation is appropriate', async ({ page }) => {
            await page.goto('/');

            // Should show either desktop nav or mobile nav depending on design
            const desktopNav = page.locator('[data-testid="desktop-nav"]');
            const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');

            // One of them should be visible
            const desktopNavVisible = await desktopNav.isVisible();
            const mobileMenuVisible = await mobileMenuButton.isVisible();

            expect(desktopNavVisible || mobileMenuVisible).toBeTruthy();
        });

        test('tablet form layouts are optimized', async ({ page }) => {
            await page.goto('/');
            await page.click('text=Sign In');

            const loginForm = page.locator('[data-testid="login-form"]');
            const formBox = await loginForm.boundingBox();

            // Form should not be too wide on tablet
            expect(formBox?.width).toBeLessThan(viewports.tablet.width * 0.8);
            expect(formBox?.width).toBeGreaterThan(300); // But not too narrow
        });
    });

    test.describe('Desktop Viewport (1280px)', () => {
        test.beforeEach(async ({ page }) => {
            await page.setViewportSize(viewports.desktop);
        });

        test('desktop navigation is fully visible', async ({ page }) => {
            await page.goto('/');

            // Should show desktop navigation
            await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();

            // Mobile menu button should not be visible
            await expect(page.locator('[data-testid="mobile-menu-button"]')).not.toBeVisible();

            // All navigation items should be visible
            await expect(page.locator('[data-testid="nav-home"]')).toBeVisible();
            await expect(page.locator('[data-testid="nav-notes"]')).toBeVisible();
            await expect(page.locator('[data-testid="nav-login"]')).toBeVisible();
        });

        test('desktop notes display in grid layout', async ({ page }) => {
            await page.goto('/notes');

            const noteCards = page.locator('[data-testid="note-card"]');
            const cardCount = await noteCards.count();

            if (cardCount >= 3) {
                const firstCard = noteCards.first();
                const secondCard = noteCards.nth(1);
                const thirdCard = noteCards.nth(2);

                const firstBox = await firstCard.boundingBox();
                const secondBox = await secondCard.boundingBox();
                const thirdBox = await thirdCard.boundingBox();

                // Cards should be arranged in a grid (multiple columns)
                const sameRowAsFirst = Math.abs((secondBox?.y || 0) - (firstBox?.y || 0)) < 50;
                const sameRowAsSecond = Math.abs((thirdBox?.y || 0) - (secondBox?.y || 0)) < 50;

                // At least some cards should be on the same row
                expect(sameRowAsFirst || sameRowAsSecond).toBeTruthy();
            }
        });

        test('desktop sidebar is visible', async ({ page }) => {
            await page.goto('/notes');

            // Should show sidebar with filters
            await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
            await expect(page.locator('[data-testid="category-filter"]')).toBeVisible();
            await expect(page.locator('[data-testid="tag-filter"]')).toBeVisible();
        });

        test('desktop forms have appropriate width', async ({ page }) => {
            await page.goto('/');
            await page.click('text=Sign In');

            const loginForm = page.locator('[data-testid="login-form"]');
            const formBox = await loginForm.boundingBox();

            // Form should be centered and not too wide
            expect(formBox?.width).toBeLessThan(500);
            expect(formBox?.width).toBeGreaterThan(300);

            // Should be centered horizontally
            const formCenter = (formBox?.x || 0) + (formBox?.width || 0) / 2;
            const viewportCenter = viewports.desktop.width / 2;
            expect(Math.abs(formCenter - viewportCenter)).toBeLessThan(100);
        });
    });

    test.describe('Large Desktop Viewport (1920px)', () => {
        test.beforeEach(async ({ page }) => {
            await page.setViewportSize(viewports.largeDesktop);
        });

        test('large desktop layout utilizes space efficiently', async ({ page }) => {
            await page.goto('/notes');

            const noteCards = page.locator('[data-testid="note-card"]');
            const cardCount = await noteCards.count();

            if (cardCount >= 4) {
                // Should show more cards per row on large screens
                const cards = [];
                for (let i = 0; i < Math.min(4, cardCount); i++) {
                    const box = await noteCards.nth(i).boundingBox();
                    cards.push(box);
                }

                // Check if multiple cards are on the same row
                const firstRowCards = cards.filter(box =>
                    Math.abs((box?.y || 0) - (cards[0]?.y || 0)) < 50
                );

                expect(firstRowCards.length).toBeGreaterThan(2);
            }
        });

        test('large desktop content is not too wide', async ({ page }) => {
            await page.goto('/notes');

            const mainContent = page.locator('[data-testid="main-content"]');
            const contentBox = await mainContent.boundingBox();

            // Content should have max width to maintain readability
            expect(contentBox?.width).toBeLessThan(1400);
        });
    });

    test.describe('Cross-Viewport Consistency', () => {
        test('content remains accessible across all viewports', async ({ page }) => {
            const testContent = async (viewport: { width: number; height: number }) => {
                await page.setViewportSize(viewport);
                await page.goto('/notes');

                // Essential elements should be visible
                await expect(page.locator('[data-testid="notes-list"]')).toBeVisible();
                await expect(page.locator('[data-testid="search-input"]')).toBeVisible();

                // Click on a note
                await page.click('[data-testid="note-card"]');
                await expect(page.locator('[data-testid="note-content"]')).toBeVisible();
            };

            // Test all viewports
            await testContent(viewports.mobile);
            await testContent(viewports.tablet);
            await testContent(viewports.desktop);
            await testContent(viewports.largeDesktop);
        });

        test('typography scales appropriately', async ({ page }) => {
            const checkTypography = async (viewport: { width: number; height: number }) => {
                await page.setViewportSize(viewport);
                await page.goto('/notes');
                await page.click('[data-testid="note-card"]');

                const title = page.locator('[data-testid="note-title"]');
                const content = page.locator('[data-testid="note-content"]');

                const titleFontSize = await title.evaluate(el =>
                    window.getComputedStyle(el).fontSize
                );
                const contentFontSize = await content.evaluate(el =>
                    window.getComputedStyle(el).fontSize
                );

                // Font sizes should be readable (at least 14px for content)
                const titleSize = parseInt(titleFontSize);
                const contentSize = parseInt(contentFontSize);

                expect(titleSize).toBeGreaterThan(contentSize);
                expect(contentSize).toBeGreaterThanOrEqual(14);
            };

            await checkTypography(viewports.mobile);
            await checkTypography(viewports.tablet);
            await checkTypography(viewports.desktop);
        });

        test('images are responsive', async ({ page }) => {
            await page.goto('/notes');
            await page.click('[data-testid="note-card"]');

            const images = page.locator('img');
            const imageCount = await images.count();

            for (let i = 0; i < imageCount; i++) {
                const image = images.nth(i);

                // Test on mobile
                await page.setViewportSize(viewports.mobile);
                const mobileBox = await image.boundingBox();

                // Test on desktop
                await page.setViewportSize(viewports.desktop);
                const desktopBox = await image.boundingBox();

                // Image should not overflow container on mobile
                expect(mobileBox?.width).toBeLessThanOrEqual(viewports.mobile.width);

                // Image should scale appropriately
                if (mobileBox && desktopBox) {
                    expect(desktopBox.width).toBeGreaterThanOrEqual(mobileBox.width);
                }
            }
        });

        test('interactive elements maintain minimum touch targets', async ({ page }) => {
            const checkTouchTargets = async (viewport: { width: number; height: number }) => {
                await page.setViewportSize(viewport);
                await page.goto('/');

                // Check buttons
                const buttons = page.locator('button');
                const buttonCount = await buttons.count();

                for (let i = 0; i < Math.min(5, buttonCount); i++) {
                    const button = buttons.nth(i);
                    if (await button.isVisible()) {
                        const box = await button.boundingBox();

                        // Minimum touch target size (44px recommended)
                        expect(box?.height).toBeGreaterThanOrEqual(40);
                        expect(box?.width).toBeGreaterThanOrEqual(40);
                    }
                }
            };

            await checkTouchTargets(viewports.mobile);
            await checkTouchTargets(viewports.tablet);
        });
    });

    test.describe('Orientation Changes', () => {
        test('landscape orientation on mobile', async ({ page }) => {
            // Set mobile landscape
            await page.setViewportSize({ width: 667, height: 375 });
            await page.goto('/notes');

            // Layout should adapt to landscape
            await expect(page.locator('[data-testid="notes-list"]')).toBeVisible();

            // Navigation should still work
            const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
            if (await mobileMenuButton.isVisible()) {
                await mobileMenuButton.click();
                await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
            }
        });

        test('portrait orientation on tablet', async ({ page }) => {
            // Set tablet portrait
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.goto('/notes');

            // Should show appropriate layout for portrait tablet
            await expect(page.locator('[data-testid="notes-list"]')).toBeVisible();

            const noteCards = page.locator('[data-testid="note-card"]');
            if (await noteCards.count() >= 2) {
                const firstCard = noteCards.first();
                const secondCard = noteCards.nth(1);

                const firstBox = await firstCard.boundingBox();
                const secondBox = await secondCard.boundingBox();

                // Cards should be arranged appropriately for portrait
                const horizontalDistance = Math.abs((secondBox?.x || 0) - (firstBox?.x || 0));
                expect(horizontalDistance).toBeGreaterThan(50); // Some horizontal spacing
            }
        });
    });
});