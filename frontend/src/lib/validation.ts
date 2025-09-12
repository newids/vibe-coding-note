import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address');

export const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number');

export const nameSchema = z.string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');

export const titleSchema = z.string()
    .min(1, 'Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters');

export const contentSchema = z.string()
    .min(1, 'Content is required')
    .min(10, 'Content must be at least 10 characters')
    .max(10000, 'Content must be less than 10,000 characters');

export const commentSchema = z.string()
    .min(1, 'Comment is required')
    .min(3, 'Comment must be at least 3 characters')
    .max(1000, 'Comment must be less than 1,000 characters');

export const tagSchema = z.string()
    .min(1, 'Tag name is required')
    .min(2, 'Tag name must be at least 2 characters')
    .max(30, 'Tag name must be less than 30 characters')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Tag name can only contain letters, numbers, hyphens, and underscores');

export const categorySchema = z.string()
    .min(1, 'Category name is required')
    .min(2, 'Category name must be at least 2 characters')
    .max(50, 'Category name must be less than 50 characters');

// Form validation schemas
export const loginFormSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required')
});

export const registerFormSchema = z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

export const noteFormSchema = z.object({
    title: titleSchema,
    content: contentSchema,
    categoryId: z.string().min(1, 'Category is required'),
    tags: z.array(z.string()).optional()
});

export const commentFormSchema = z.object({
    content: commentSchema
});

export const tagFormSchema = z.object({
    name: tagSchema
});

export const categoryFormSchema = z.object({
    name: categorySchema,
    description: z.string().max(200, 'Description must be less than 200 characters').optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Please enter a valid hex color')
});

// Validation helper functions
export const validateEmail = (email: string): string | null => {
    try {
        emailSchema.parse(email);
        return null;
    } catch (error) {
        if (error instanceof z.ZodError) {
            return error.errors[0].message;
        }
        return 'Invalid email';
    }
};

export const validatePassword = (password: string): string | null => {
    try {
        passwordSchema.parse(password);
        return null;
    } catch (error) {
        if (error instanceof z.ZodError) {
            return error.errors[0].message;
        }
        return 'Invalid password';
    }
};

export const sanitizeHtml = (html: string): string => {
    // Basic HTML sanitization - remove script tags and dangerous attributes
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/style\s*=/gi, '');
};

export const sanitizeText = (text: string): string => {
    // Remove HTML tags and decode HTML entities
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'");
};

// Type definitions for form data
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type RegisterFormData = z.infer<typeof registerFormSchema>;
export type NoteFormData = z.infer<typeof noteFormSchema>;
export type CommentFormData = z.infer<typeof commentFormSchema>;
export type TagFormData = z.infer<typeof tagFormSchema>;
export type CategoryFormData = z.infer<typeof categoryFormSchema>;