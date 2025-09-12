import { PrismaClient } from '@prisma/client';

declare global {
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.__prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    },
    // Connection pool configuration
    __internal: {
        engine: {
            // Connection pool settings
            connection_limit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
            pool_timeout: parseInt(process.env.DB_POOL_TIMEOUT || '10'),
            schema_cache_size: parseInt(process.env.DB_SCHEMA_CACHE_SIZE || '1000')
        }
    }
});

if (process.env.NODE_ENV === 'development') {
    globalThis.__prisma = prisma;
}

export { prisma };

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});