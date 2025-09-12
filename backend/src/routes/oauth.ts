import express from 'express';
import passport from '../lib/passport';
import { generateToken } from '../lib/auth';

const router = express.Router();

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
        try {
            const user = req.user as any;
            if (!user) {
                return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
            }

            const token = generateToken(user.id);

            // Redirect to frontend with token
            res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&provider=google`);
        } catch (error) {
            console.error('Google OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_error`);
        }
    }
);

// GitHub OAuth routes
router.get('/github',
    passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
    passport.authenticate('github', { session: false }),
    (req, res) => {
        try {
            const user = req.user as any;
            if (!user) {
                return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
            }

            const token = generateToken(user.id);
            res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&provider=github`);
        } catch (error) {
            console.error('GitHub OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_error`);
        }
    }
);

// Facebook OAuth routes
router.get('/facebook',
    passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/facebook/callback',
    passport.authenticate('facebook', { session: false }),
    (req, res) => {
        try {
            const user = req.user as any;
            if (!user) {
                return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
            }

            const token = generateToken(user.id);
            res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&provider=facebook`);
        } catch (error) {
            console.error('Facebook OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_error`);
        }
    }
);

// Apple OAuth routes (placeholder - requires additional setup)
router.get('/apple', (req, res) => {
    res.status(501).json({
        success: false,
        error: {
            code: 'NOT_IMPLEMENTED',
            message: 'Apple OAuth requires additional setup and configuration'
        }
    });
});

// Korean OAuth providers (Naver and Kakao)
// Note: These would require additional passport strategies that may not be available
// For now, we'll create placeholder routes that return not implemented

router.get('/naver', (req, res) => {
    res.status(501).json({
        success: false,
        error: {
            code: 'NOT_IMPLEMENTED',
            message: 'Naver OAuth not yet implemented'
        }
    });
});

router.get('/kakao', (req, res) => {
    res.status(501).json({
        success: false,
        error: {
            code: 'NOT_IMPLEMENTED',
            message: 'Kakao OAuth not yet implemented'
        }
    });
});

export default router;