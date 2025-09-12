import { User, Note, Category, Tag, Comment } from '@prisma/client';
import { testPrisma } from '../setup-integration';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export interface TestUser {
    id: string;
    email: string;
    name: string;
    role: 'OWNER' | 'VISITOR';
    provider: string;
}

export interface TestNote {
    id: string;
    title: string;
    content: string;
    authorId: string;
    categoryId: string;
}

// Create test user
export async function createTestUser(overrides: Partial<User> = {}): Promise<TestUser & { token: string }> {
    const hashedPassword = await bcrypt.hash('testpassword123', 10);

    const user = await testPrisma.user.create({
        data: {
            email: overrides.email || 'test@example.com',
            name: overrides.name || 'Test User',
            password: hashedPassword,
            role: overrides.role || 'VISITOR',
            provider: overrides.provider || 'EMAIL',
            ...overrides
        }
    });

    const token = generateTestToken(user.id, user.role === 'OWNER' ? 'owner' : 'visitor');

    return { ...user, token };
}

// Create test owner user
export async function createTestOwner(): Promise<TestUser & { token: string }> {
    return createTestUser({
        email: 'owner@example.com',
        name: 'Test Owner',
        role: 'OWNER'
    });
}

// Create test category
export async function createTestCategory(overrides: Partial<Category> = {}): Promise<Category> {
    return testPrisma.category.create({
        data: {
            name: overrides.name || 'Test Category',
            slug: overrides.slug || 'test-category',
            description: overrides.description || 'Test category description',
            color: overrides.color || '#3B82F6',
            ...overrides
        }
    });
}

// Create test tag
export async function createTestTag(overrides: Partial<Tag> = {}): Promise<Tag> {
    return testPrisma.tag.create({
        data: {
            name: overrides.name || 'Test Tag',
            slug: overrides.slug || 'test-tag',
            ...overrides
        }
    });
}

// Create test note
export async function createTestNote(
    authorId: string,
    categoryId: string,
    overrides: Partial<Note> = {}
): Promise<TestNote> {
    const note = await testPrisma.note.create({
        data: {
            title: overrides.title || 'Test Note',
            content: overrides.content || 'This is a test note content',
            excerpt: overrides.excerpt || 'Test note excerpt',
            slug: overrides.slug || 'test-note',
            authorId,
            categoryId,
            published: overrides.published ?? true,
            ...overrides
        }
    });

    return note;
}

// Create test comment
export async function createTestComment(
    noteId: string,
    authorId: string,
    overrides: Partial<Comment> = {}
): Promise<Comment> {
    return testPrisma.comment.create({
        data: {
            content: overrides.content || 'This is a test comment',
            noteId,
            authorId,
            ...overrides
        }
    });
}

// Generate JWT token for testing
export function generateTestToken(userId: string, role: 'owner' | 'visitor' = 'visitor'): string {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET || 'test-jwt-secret-key',
        { expiresIn: '1h' }
    );
}

// Create authorization header
export function createAuthHeader(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
}

// Wait for async operations
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}