import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { prisma } from './database';

// Type for passport done callback
type DoneCallback = (error: any, user?: any) => void;

// Serialize user for session
passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                provider: true
            }
        });
        done(null, user);
    } catch (error) {
        done(error, undefined);
    }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
    }, async (accessToken: string, refreshToken: string, profile: any, done: DoneCallback) => {
        try {
            // Check if user already exists
            let user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: profile.emails?.[0]?.value },
                        {
                            provider: 'GOOGLE',
                            providerId: profile.id
                        }
                    ]
                }
            });

            if (user) {
                // Update existing user with Google info if needed
                if (user.provider !== 'GOOGLE' || user.providerId !== profile.id) {
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            provider: 'GOOGLE',
                            providerId: profile.id,
                            avatar: profile.photos?.[0]?.value || user.avatar
                        }
                    });
                }
            } else {
                // Create new user
                user = await prisma.user.create({
                    data: {
                        email: profile.emails?.[0]?.value || '',
                        name: profile.displayName || profile.username || 'Google User',
                        avatar: profile.photos?.[0]?.value,
                        provider: 'GOOGLE',
                        providerId: profile.id,
                        role: 'VISITOR'
                    }
                });
            }

            return done(null, user);
        } catch (error) {
            return done(error, undefined);
        }
    }));
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "/api/auth/github/callback"
    }, async (accessToken: string, refreshToken: string, profile: any, done: DoneCallback) => {
        try {
            let user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: profile.emails?.[0]?.value },
                        {
                            provider: 'GITHUB',
                            providerId: profile.id
                        }
                    ]
                }
            });

            if (user) {
                if (user.provider !== 'GITHUB' || user.providerId !== profile.id) {
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            provider: 'GITHUB',
                            providerId: profile.id,
                            avatar: profile.photos?.[0]?.value || user.avatar
                        }
                    });
                }
            } else {
                user = await prisma.user.create({
                    data: {
                        email: profile.emails?.[0]?.value || '',
                        name: profile.displayName || profile.username || 'GitHub User',
                        avatar: profile.photos?.[0]?.value,
                        provider: 'GITHUB',
                        providerId: profile.id,
                        role: 'VISITOR'
                    }
                });
            }

            return done(null, user);
        } catch (error) {
            return done(error, undefined);
        }
    }));
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "/api/auth/facebook/callback",
        profileFields: ['id', 'emails', 'name', 'picture.type(large)']
    }, async (accessToken: string, refreshToken: string, profile: any, done: DoneCallback) => {
        try {
            let user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: profile.emails?.[0]?.value },
                        {
                            provider: 'FACEBOOK',
                            providerId: profile.id
                        }
                    ]
                }
            });

            if (user) {
                if (user.provider !== 'FACEBOOK' || user.providerId !== profile.id) {
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            provider: 'FACEBOOK',
                            providerId: profile.id,
                            avatar: profile.photos?.[0]?.value || user.avatar
                        }
                    });
                }
            } else {
                user = await prisma.user.create({
                    data: {
                        email: profile.emails?.[0]?.value || '',
                        name: profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}` || 'Facebook User',
                        avatar: profile.photos?.[0]?.value,
                        provider: 'FACEBOOK',
                        providerId: profile.id,
                        role: 'VISITOR'
                    }
                });
            }

            return done(null, user);
        } catch (error) {
            return done(error, undefined);
        }
    }));
}

// Note: Apple OAuth is more complex and requires additional setup
// For now, we'll skip it and implement it later if needed

export default passport;