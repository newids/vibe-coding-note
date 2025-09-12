import express from 'express';
import { prisma } from '../lib/database';
import {
    generateToken,
    hashPassword,
    verifyPassword,
    authenticateToken,
    requireOwner,
    AuthenticatedRequest
} from '../lib/auth';
import {
    validate,
    sanitizeInput,
    validateRateLimit,
    loginSchema,
    registerSchema,
    paginationSchema
} from '../lib/validation';

const router = express.Router();

// User registration
router.post('/register',
    validateRateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
    sanitizeInput,
    validate(registerSchema),
    async (req, res) => {
        try {
            const { email, password, name } = req.body;

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'USER_EXISTS',
                        message: 'User with this email already exists'
                    }
                });
            }

            // Hash password
            const hashedPassword = await hashPassword(password);

            // Create user
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    provider: 'EMAIL',
                    role: 'VISITOR' // Default role
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    provider: true,
                    createdAt: true
                }
            });

            // Generate token
            const token = generateToken(user.id);

            res.status(201).json({
                success: true,
                data: {
                    user,
                    token
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'REGISTRATION_ERROR',
                    message: 'Failed to register user'
                }
            });
        }
    });

// User login
router.post('/login',
    validateRateLimit(10, 15 * 60 * 1000), // 10 attempts per 15 minutes
    sanitizeInput,
    validate(loginSchema),
    async (req, res) => {
        try {
            const { email, password } = req.body;

            // Find user
            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user || !user.password) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        message: 'Invalid email or password'
                    }
                });
            }

            // Verify password
            const isValidPassword = await verifyPassword(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        message: 'Invalid email or password'
                    }
                });
            }

            // Generate token
            const token = generateToken(user.id);

            // Return user data without password
            const { password: _, ...userWithoutPassword } = user;

            res.json({
                success: true,
                data: {
                    user: userWithoutPassword,
                    token
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'LOGIN_ERROR',
                    message: 'Failed to login'
                }
            });
        }
    });

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
        const user = await prisma.user.findUnique({
            where: { id: authReq.user!.id },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                provider: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
        }

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'GET_USER_ERROR',
                message: 'Failed to get user information'
            }
        });
    }
});

// Logout (client-side token removal, but we can track it server-side if needed)
router.post('/logout', authenticateToken, (req, res) => {
    // In a JWT-based system, logout is typically handled client-side by removing the token
    // For server-side logout, you would need to maintain a blacklist of tokens
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Refresh token endpoint
router.post('/refresh', authenticateToken, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
        // Generate new token
        const newToken = generateToken(authReq.user!.id);

        res.json({
            success: true,
            data: {
                token: newToken
            }
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'REFRESH_ERROR',
                message: 'Failed to refresh token'
            }
        });
    }
});

// Get all users (owner only) - for user management
router.get('/users',
    authenticateToken,
    validate(paginationSchema, 'query'),
    async (req, res) => {
        const authReq = req as AuthenticatedRequest;
        try {
            // Check if user is owner
            if (authReq.user!.role !== 'OWNER') {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Owner access required'
                    }
                });
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = req.query.search as string;
            const role = req.query.role as string;
            const skip = (page - 1) * limit;

            // Build where clause
            const where: any = {};
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ];
            }
            if (role && (role === 'OWNER' || role === 'VISITOR')) {
                where.role = role;
            }

            const [users, totalCount] = await Promise.all([
                prisma.user.findMany({
                    where,
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        avatar: true,
                        role: true,
                        provider: true,
                        createdAt: true,
                        updatedAt: true,
                        _count: {
                            select: {
                                notes: true,
                                comments: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    skip,
                    take: limit
                }),
                prisma.user.count({ where })
            ]);

            res.json({
                success: true,
                data: {
                    users,
                    pagination: {
                        page,
                        limit,
                        totalCount,
                        totalPages: Math.ceil(totalCount / limit),
                        hasNext: page * limit < totalCount,
                        hasPrev: page > 1
                    }
                }
            });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'GET_USERS_ERROR',
                    message: 'Failed to get users'
                }
            });
        }
    });

// Update user role (owner only)
router.put('/users/:userId/role', authenticateToken, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
        // Check if user is owner
        if (authReq.user!.role !== 'OWNER') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Owner access required'
                }
            });
        }

        const { userId } = req.params;
        const { role } = req.body;

        // Validate role
        if (!role || (role !== 'OWNER' && role !== 'VISITOR')) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ROLE',
                    message: 'Role must be either OWNER or VISITOR'
                }
            });
        }

        // Check if target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            }
        });

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
        }

        // Prevent owner from changing their own role
        if (targetUser.id === authReq.user!.id) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'CANNOT_CHANGE_OWN_ROLE',
                    message: 'You cannot change your own role'
                }
            });
        }

        // Update user role
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                provider: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.json({
            success: true,
            data: updatedUser,
            message: `User role updated to ${role}`
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'UPDATE_ROLE_ERROR',
                message: 'Failed to update user role'
            }
        });
    }
});

export default router;