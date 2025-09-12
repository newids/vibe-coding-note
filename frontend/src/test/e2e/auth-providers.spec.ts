import { test, expect } from '@playwright/test';

test.describe('Authentication Providers E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.click('text=Sign In');
    });

    test('all OAuth providers are available', async ({ page }) => {
        // Check that all OAuth provider buttons are present
        await expect(page.locator('[data-testid="google-login"]')).toBeVisible();
        await expect(page.locator('[data-testid="github-login"]')).toBeVisible();
        await expect(page.locator('[data-testid="facebook-login"]')).toBeVisible();
        await expect(page.locator('[data-testid="apple-login"]')).toBeVisible();

        // Check Korean providers if available
        const naverButton = page.locator('[data-testid="naver-login"]');
        const kakaoButton = page.locator('[data-testid="kakao-login"]');

        if (await naverButton.isVisible()) {
            await expect(naverButton).toBeVisible();
        }

        if (await kakaoButton.isVisible()) {
            await expect(kakaoButton).toBeVisible();
        }
    });

    test('Google OAuth flow initiation', async ({ page, context }) => {
        // Mock Google OAuth redirect
        await page.route('**/auth/google', route => {
            route.fulfill({
                status: 302,
                headers: {
                    'Location': 'https://accounts.google.com/oauth/authorize?client_id=test&redirect_uri=http://localhost:3001/auth/google/callback'
                }
            });
        });

        // Click Google login button
        const [popup] = await Promise.all([
            context.waitForEvent('page'),
            page.click('[data-testid="google-login"]')
        ]);

        // Should open Google OAuth popup/redirect
        expect(popup.url()).toContain('accounts.google.com');
        await popup.close();
    });

    test('GitHub OAuth flow initiation', async ({ page, context }) => {
        // Mock GitHub OAuth redirect
        await page.route('**/auth/github', route => {
            route.fulfill({
                status: 302,
                headers: {
                    'Location': 'https://github.com/login/oauth/authorize?client_id=test&redirect_uri=http://localhost:3001/auth/github/callback'
                }
            });
        });

        // Click GitHub login button
        const [popup] = await Promise.all([
            context.waitForEvent('page'),
            page.click('[data-testid="github-login"]')
        ]);

        // Should open GitHub OAuth popup/redirect
        expect(popup.url()).toContain('github.com');
        await popup.close();
    });

    test('Facebook OAuth flow initiation', async ({ page, context }) => {
        // Mock Facebook OAuth redirect
        await page.route('**/auth/facebook', route => {
            route.fulfill({
                status: 302,
                headers: {
                    'Location': 'https://www.facebook.com/v18.0/dialog/oauth?client_id=test&redirect_uri=http://localhost:3001/auth/facebook/callback'
                }
            });
        });

        // Click Facebook login button
        const [popup] = await Promise.all([
            context.waitForEvent('page'),
            page.click('[data-testid="facebook-login"]')
        ]);

        // Should open Facebook OAuth popup/redirect
        expect(popup.url()).toContain('facebook.com');
        await popup.close();
    });

    test('Apple OAuth flow initiation', async ({ page, context }) => {
        // Mock Apple OAuth redirect
        await page.route('**/auth/apple', route => {
            route.fulfill({
                status: 302,
                headers: {
                    'Location': 'https://appleid.apple.com/auth/authorize?client_id=test&redirect_uri=http://localhost:3001/auth/apple/callback'
                }
            });
        });

        // Click Apple login button
        const [popup] = await Promise.all([
            context.waitForEvent('page'),
            page.click('[data-testid="apple-login"]')
        ]);

        // Should open Apple OAuth popup/redirect
        expect(popup.url()).toContain('appleid.apple.com');
        await popup.close();
    });

    test('successful OAuth callback handling', async ({ page }) => {
        // Mock successful OAuth callback
        await page.route('**/auth/google/callback*', route => {
            route.fulfill({
                status: 200,
                contentType: 'text/html',
                body: `
                    <script>
                        window.opener.postMessage({
                            type: 'OAUTH_SUCCESS',
                            token: 'mock-jwt-token',
                            user: {
                                id: '1',
                                name: 'Google User',
                                email: 'google@example.com',
                                provider: 'google'
                            }
                        }, '*');
                        window.close();
                    </script>
                `
            });
        });

        // Listen for OAuth success message
        await page.addInitScript(() => {
            window.addEventListener('message', (event) => {
                if (event.data.type === 'OAUTH_SUCCESS') {
                    localStorage.setItem('token', event.data.token);
                    localStorage.setItem('user', JSON.stringify(event.data.user));
                    window.location.href = '/dashboard';
                }
            });
        });

        // Simulate OAuth flow
        await page.click('[data-testid="google-login"]');

        // Should redirect to dashboard after successful OAuth
        await expect(page).toHaveURL('/dashboard');
        await expect(page.locator('text=Google User')).toBeVisible();
    });

    test('OAuth error handling', async ({ page }) => {
        // Mock OAuth error
        await page.route('**/auth/google', route => {
            route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    error: {
                        code: 'OAUTH_ERROR',
                        message: 'OAuth authentication failed'
                    }
                })
            });
        });

        await page.click('[data-testid="google-login"]');

        // Should show error message
        await expect(page.locator('text=OAuth authentication failed')).toBeVisible();

        // Should remain on login page
        await expect(page.locator('text=Sign In')).toBeVisible();
    });

    test('OAuth provider button styling and accessibility', async ({ page }) => {
        // Check Google button
        const googleButton = page.locator('[data-testid="google-login"]');
        await expect(googleButton).toHaveAttribute('aria-label', 'Sign in with Google');
        await expect(googleButton).toHaveCSS('cursor', 'pointer');

        // Check GitHub button
        const githubButton = page.locator('[data-testid="github-login"]');
        await expect(githubButton).toHaveAttribute('aria-label', 'Sign in with GitHub');
        await expect(githubButton).toHaveCSS('cursor', 'pointer');

        // Check Facebook button
        const facebookButton = page.locator('[data-testid="facebook-login"]');
        await expect(facebookButton).toHaveAttribute('aria-label', 'Sign in with Facebook');
        await expect(facebookButton).toHaveCSS('cursor', 'pointer');

        // Check Apple button
        const appleButton = page.locator('[data-testid="apple-login"]');
        await expect(appleButton).toHaveAttribute('aria-label', 'Sign in with Apple');
        await expect(appleButton).toHaveCSS('cursor', 'pointer');

        // Test keyboard navigation
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab'); // Should focus on first OAuth button

        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
    });

    test('OAuth provider icons and branding', async ({ page }) => {
        // Check that provider icons are present
        await expect(page.locator('[data-testid="google-icon"]')).toBeVisible();
        await expect(page.locator('[data-testid="github-icon"]')).toBeVisible();
        await expect(page.locator('[data-testid="facebook-icon"]')).toBeVisible();
        await expect(page.locator('[data-testid="apple-icon"]')).toBeVisible();

        // Check button text
        await expect(page.locator('text=Continue with Google')).toBeVisible();
        await expect(page.locator('text=Continue with GitHub')).toBeVisible();
        await expect(page.locator('text=Continue with Facebook')).toBeVisible();
        await expect(page.locator('text=Continue with Apple')).toBeVisible();
    });

    test('OAuth state parameter security', async ({ page }) => {
        // Intercept OAuth requests to check state parameter
        let stateParam = '';

        await page.route('**/auth/google', route => {
            const url = new URL(route.request().url());
            stateParam = url.searchParams.get('state') || '';

            route.fulfill({
                status: 302,
                headers: {
                    'Location': `https://accounts.google.com/oauth/authorize?state=${stateParam}`
                }
            });
        });

        await page.click('[data-testid="google-login"]');

        // State parameter should be present and non-empty
        expect(stateParam).toBeTruthy();
        expect(stateParam.length).toBeGreaterThan(10); // Should be a random string
    });

    test('multiple OAuth provider account linking', async ({ page }) => {
        // First, login with Google
        await page.route('**/auth/google/callback*', route => {
            route.fulfill({
                status: 200,
                contentType: 'text/html',
                body: `
                    <script>
                        window.opener.postMessage({
                            type: 'OAUTH_SUCCESS',
                            token: 'mock-jwt-token',
                            user: {
                                id: '1',
                                name: 'Test User',
                                email: 'test@example.com',
                                provider: 'google'
                            }
                        }, '*');
                        window.close();
                    </script>
                `
            });
        });

        await page.addInitScript(() => {
            window.addEventListener('message', (event) => {
                if (event.data.type === 'OAUTH_SUCCESS') {
                    localStorage.setItem('token', event.data.token);
                    localStorage.setItem('user', JSON.stringify(event.data.user));
                    window.location.href = '/dashboard';
                }
            });
        });

        await page.click('[data-testid="google-login"]');
        await expect(page).toHaveURL('/dashboard');

        // Go to account settings to link another provider
        await page.goto('/settings/account');

        // Should show option to link GitHub account
        await expect(page.locator('[data-testid="link-github"]')).toBeVisible();
        await expect(page.locator('text=Link GitHub Account')).toBeVisible();

        // Mock GitHub linking
        await page.route('**/auth/github/link*', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    message: 'GitHub account linked successfully'
                })
            });
        });

        await page.click('[data-testid="link-github"]');

        // Should show success message
        await expect(page.locator('text=GitHub account linked successfully')).toBeVisible();

        // Should show both providers as linked
        await expect(page.locator('[data-testid="google-linked"]')).toBeVisible();
        await expect(page.locator('[data-testid="github-linked"]')).toBeVisible();
    });

    test('OAuth provider error scenarios', async ({ page }) => {
        // Test user cancellation
        await page.route('**/auth/google/callback*', route => {
            const url = new URL(route.request().url());
            const error = url.searchParams.get('error');

            if (error === 'access_denied') {
                route.fulfill({
                    status: 400,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: false,
                        error: {
                            code: 'OAUTH_CANCELLED',
                            message: 'User cancelled OAuth authentication'
                        }
                    })
                });
            }
        });

        // Simulate user cancelling OAuth
        await page.goto('/auth/google/callback?error=access_denied');

        // Should show appropriate message
        await expect(page.locator('text=Authentication was cancelled')).toBeVisible();

        // Should redirect back to login
        await expect(page).toHaveURL('/login');

        // Test invalid state parameter
        await page.route('**/auth/google/callback*', route => {
            route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    error: {
                        code: 'INVALID_STATE',
                        message: 'Invalid state parameter'
                    }
                })
            });
        });

        await page.goto('/auth/google/callback?state=invalid');

        // Should show security error
        await expect(page.locator('text=Authentication failed for security reasons')).toBeVisible();
    });

    test('OAuth provider rate limiting', async ({ page }) => {
        // Mock rate limiting response
        await page.route('**/auth/google', route => {
            route.fulfill({
                status: 429,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    error: {
                        code: 'RATE_LIMITED',
                        message: 'Too many authentication attempts. Please try again later.'
                    }
                })
            });
        });

        await page.click('[data-testid="google-login"]');

        // Should show rate limiting message
        await expect(page.locator('text=Too many authentication attempts')).toBeVisible();

        // Button should be disabled temporarily
        await expect(page.locator('[data-testid="google-login"]')).toBeDisabled();
    });
});