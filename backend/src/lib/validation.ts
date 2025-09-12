import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Initialize DOMPurify with JSDOM for server-side use
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

// Common validation schemas
export const emailSchema = Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
    });

export const passwordSchema = Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'any.required': 'Password is required'
    });

export const nameSchema = Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name must be less than 50 characters',
        'string.pattern.base': 'Name can only contain letters and spaces',
        'any.required': 'Name is required'
    });

export const titleSchema = Joi.string()
    .min(3)
    .max(200)
    .required()
    .messages({
        'string.min': 'Title must be at least 3 characters long',
        'string.max': 'Title must be less than 200 characters',
        'any.required': 'Title is required'
    });

export const contentSchema = Joi.string()
    .min(10)
    .max(10000)
    .required()
    .messages({
        'string.min': 'Content must be at least 10 characters long',
        'string.max': 'Content must be less than 10,000 characters',
        'any.required': 'Content is required'
    });

export const commentContentSchema = Joi.string()
    .min(3)
    .max(1000)
    .required()
    .messages({
        'string.min': 'Comment must be at least 3 characters long',
        'string.max': 'Comment must be less than 1,000 characters',
        'any.required': 'Comment is required'
    });

export const tagNameSchema = Joi.string()
    .min(2)
    .max(30)
    .pattern(/^[a-zA-Z0-9-_]+$/)
    .required()
    .messages({
        'string.min': 'Tag name must be at least 2 characters long',
        'string.max': 'Tag name must be less than 30 characters',
        'string.pattern.base': 'Tag name can only contain letters, numbers, hyphens, and underscores',
        'any.required': 'Tag name is required'
    });

export const categoryNameSchema = Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
        'string.min': 'Category name must be at least 2 characters long',
        'string.max': 'Category name must be less than 50 characters',
        'any.required': 'Category name is required'
    });

export const colorSchema = Joi.string()
    .pattern(/^#[0-9A-F]{6}$/i)
    .required()
    .messages({
        'string.pattern.base': 'Please enter a valid hex color (e.g., #FF0000)',
        'any.required': 'Color is required'
    });

// Form validation schemas
export const loginSchema = Joi.object({
    email: emailSchema,
    password: Joi.string().required().messages({
        'any.required': 'Password is required'
    })
});

export const registerSchema = Joi.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema
});

export const noteSchema = Joi.object({
    title: titleSchema,
    content: contentSchema,
    categoryId: Joi.string().uuid().required().messages({
        'string.uuid': 'Invalid category ID',
        'any.required': 'Category is required'
    }),
    tags: Joi.array().items(Joi.string().uuid()).optional()
});

export const updateNoteSchema = Joi.object({
    title: titleSchema.optional(),
    content: contentSchema.optional(),
    categoryId: Joi.string().uuid().optional().messages({
        'string.uuid': 'Invalid category ID'
    }),
    tags: Joi.array().items(Joi.string().uuid()).optional()
});

export const commentSchema = Joi.object({
    content: commentContentSchema
});

export const tagSchema = Joi.object({
    name: tagNameSchema
});

export const categorySchema = Joi.object({
    name: categoryNameSchema,
    description: Joi.string().max(200).optional().messages({
        'string.max': 'Description must be less than 200 characters'
    }),
    color: colorSchema
});

export const bulkTagsSchema = Joi.object({
    names: Joi.array().items(tagNameSchema).min(1).max(20).required().messages({
        'array.min': 'At least one tag name is required',
        'array.max': 'Cannot create more than 20 tags at once',
        'any.required': 'Tag names are required'
    })
});

// Pagination and filter schemas
export const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(200).optional(),
    categoryId: Joi.string().uuid().optional(),
    tags: Joi.alternatives().try(
        Joi.string().uuid(),
        Joi.array().items(Joi.string().uuid())
    ).optional()
});

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    details: errors
                }
            });
        }

        // Replace the original data with validated and sanitized data
        req[property] = value;
        next();
    };
};

// Sanitization functions
export const sanitizeHtml = (html: string): string => {
    return purify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'blockquote', 'code', 'pre'],
        ALLOWED_ATTR: []
    });
};

export const sanitizeText = (text: string): string => {
    // Remove HTML tags and decode HTML entities
    return purify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

// Sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
    const sanitizeObject = (obj: any): any => {
        if (typeof obj === 'string') {
            return sanitizeText(obj);
        }

        if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }

        if (obj && typeof obj === 'object') {
            const sanitized: any = {};
            for (const [key, value] of Object.entries(obj)) {
                // Special handling for content fields that may contain HTML
                if (key === 'content' && typeof value === 'string') {
                    sanitized[key] = sanitizeHtml(value);
                } else {
                    sanitized[key] = sanitizeObject(value);
                }
            }
            return sanitized;
        }

        return obj;
    };

    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    if (req.query) {
        req.query = sanitizeObject(req.query);
    }

    next();
};

// Rate limiting validation
export const validateRateLimit = (maxRequests: number, windowMs: number) => {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction) => {
        const clientId = req.ip || 'unknown';
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean up old entries
        for (const [key, value] of requests.entries()) {
            if (value.resetTime < windowStart) {
                requests.delete(key);
            }
        }

        const clientData = requests.get(clientId);

        if (!clientData) {
            requests.set(clientId, { count: 1, resetTime: now + windowMs });
            return next();
        }

        if (clientData.resetTime < now) {
            // Reset the window
            clientData.count = 1;
            clientData.resetTime = now + windowMs;
            return next();
        }

        if (clientData.count >= maxRequests) {
            return res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests. Please try again later.',
                    retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
                }
            });
        }

        clientData.count++;
        next();
    };
};