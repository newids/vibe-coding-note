import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Create a separate Prisma client for testing
export const testPrisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
        }
    }
});

// Global test setup
beforeAll(async () => {
    // Connect to test database
    await testPrisma.$connect();
});

// Clean up after each test
afterEach(async () => {
    // Clean up test data in reverse order of dependencies
    await testPrisma.like.deleteMany();
    await testPrisma.comment.deleteMany();
    await testPrisma.note.deleteMany();
    await testPrisma.user.deleteMany();
    await testPrisma.tag.deleteMany();
    await testPrisma.category.deleteMany();
});

// Global test teardown
afterAll(async () => {
    await testPrisma.$disconnect();
});

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};