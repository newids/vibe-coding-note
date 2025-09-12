import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { prisma } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 12;

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}

// Email validation
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Password validation (at least 8 characters, contains letters and numbers)
export const validatePassword = (password: string): boolean => {
    if (password.length < 8) return false;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasLetter && hasNumber;
};

// Password comparison alias for consistency
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    return verifyPassword(password, hashedPassword);
};

// JWT token generation with role support
export const generateToken = (userId: string, role: 'owner' | 'visitor' = 'visitor'): string => {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

// JWT token verification
export const verifyToken = (token: string): { userId: string; role?: string } => {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role?: string };
    return decoded;
};

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

// Password verification
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
};

// Authentication middleware
export const authenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    try {
        const authHeader = authReq.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'NO_TOKEN',
                    message: 'Access token is required'
                }
            });
            return;
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid or expired token'
                }
            });
            return;
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            }
        });

        if (!user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
            return;
        }

        authReq.user = user;
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'AUTH_ERROR',
                message: 'Authentication error'
            }
        });
    }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    try {
        const authHeader = authReq.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = verifyToken(token);
            if (decoded) {
                const user = await prisma.user.findUnique({
                    where: { id: decoded.userId },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true
                    }
                });
                if (user) {
                    authReq.user = user;
                }
            }
        }
        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

// Owner-only middleware
export const requireOwner = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
        res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
            }
        });
        return;
    }

    if (authReq.user.role !== 'OWNER') {
        res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'Owner access required'
            }
        });
        return;
    }

    next();
};

// Visitor or higher middleware (authenticated users)
export const requireVisitor = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
        res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
            }
        });
        return;
    }

    // Both VISITOR and OWNER roles are allowed
    if (authReq.user.role !== 'VISITOR' && authReq.user.role !== 'OWNER') {
        res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'User access required'
            }
        });
        return;
    }

    next();
};

// Role checking middleware factory
export const requireRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const authReq = req as AuthenticatedRequest;
        if (!authReq.user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required'
                }
            });
            return;
        }

        if (!allowedRoles.includes(authReq.user.role)) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
                }
            });
            return;
        }

        next();
    };
};

// Resource ownership middleware factory
export const requireOwnership = (resourceType: 'note' | 'comment') => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const authReq = req as AuthenticatedRequest;
        if (!authReq.user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required'
                }
            });
            return;
        }

        try {
            const resourceId = req.params.id;
            let resource: any = null;

            // Get the resource based on type
            switch (resourceType) {
                case 'note':
                    resource = await prisma.note.findUnique({
                        where: { id: resourceId },
                        select: { id: true, authorId: true }
                    });
                    break;
                case 'comment':
                    resource = await prisma.comment.findUnique({
                        where: { id: resourceId },
                        select: { id: true, authorId: true }
                    });
                    break;
            }

            if (!resource) {
                res.status(404).json({
                    success: false,
                    error: {
                        code: `${resourceType.toUpperCase()}_NOT_FOUND`,
                        message: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found`
                    }
                });
                return;
            }

            // Check if user is the owner of the resource or has OWNER role
            const isResourceOwner = resource.authorId === authReq.user.id;
            const isSystemOwner = authReq.user.role === 'OWNER';

            if (!isResourceOwner && !isSystemOwner) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: `You can only modify your own ${resourceType}s or you must be the system owner`
                    }
                });
                return;
            }

            next();
        } catch (error) {
            console.error(`Error checking ${resourceType} ownership:`, error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'OWNERSHIP_CHECK_ERROR',
                    message: `Failed to verify ${resourceType} ownership`
                }
            });
        }
    };
};