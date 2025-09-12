/**
 * Simple database connection test script
 * Run with: npx ts-node src/test-db.ts
 */

import dotenv from 'dotenv';
import { checkDatabaseConnection, getDatabaseInfo } from './lib/db-health';
import { DatabaseUtils } from './lib/db-utils';
import { prisma } from './lib/database';

dotenv.config();

async function testDatabase() {
    console.log('🧪 Testing database setup...\n');

    try {
        // Test 1: Basic connection
        console.log('1️⃣ Testing database connection...');
        const isConnected = await checkDatabaseConnection();

        if (!isConnected) {
            console.log('❌ Database connection failed');
            console.log('💡 Make sure PostgreSQL is running and DATABASE_URL is correct');
            return;
        }

        // Test 2: Database info
        console.log('2️⃣ Getting database information...');
        const dbInfo = await getDatabaseInfo();
        if (dbInfo) {
            console.log(`   Database: ${dbInfo.database_name}`);
            console.log(`   User: ${dbInfo.user_name}`);
            console.log(`   Version: ${dbInfo.version.split(' ')[0]}`);
        }

        // Test 3: Check if tables exist
        console.log('3️⃣ Checking database schema...');
        try {
            const stats = await DatabaseUtils.getStats();
            if (stats) {
                console.log('   Tables found and accessible:');
                console.log(`   - Users: ${stats.users}`);
                console.log(`   - Notes: ${stats.notes}`);
                console.log(`   - Comments: ${stats.comments}`);
                console.log(`   - Categories: ${stats.categories}`);
                console.log(`   - Tags: ${stats.tags}`);
                console.log(`   - Likes: ${stats.likes}`);
            }
        } catch (error) {
            console.log('   ⚠️  Tables not found - run migrations first:');
            console.log('   npm run db:migrate');
        }

        // Test 4: Utility functions
        console.log('4️⃣ Testing utility functions...');
        const testSlug = await DatabaseUtils.generateUniqueSlug('Test Article Title', 'note');
        console.log(`   Generated slug: ${testSlug}`);

        const testExcerpt = DatabaseUtils.createExcerpt(
            '# This is a test\n\nThis is some **bold** text with `code` and more content that should be truncated properly.',
            50
        );
        console.log(`   Generated excerpt: ${testExcerpt}`);

        console.log('\n✅ Database setup test completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('   1. Run migrations: npm run db:migrate');
        console.log('   2. Seed database: npm run db:seed');
        console.log('   3. Start development server: npm run dev');

    } catch (error) {
        console.error('❌ Database test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testDatabase();