import { prisma } from './database';

export async function checkDatabaseConnection(): Promise<boolean> {
    try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Database connection successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}

export async function getDatabaseInfo() {
    try {
        const result = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        version() as version
    ` as Array<{
            database_name: string;
            user_name: string;
            version: string;
        }>;

        return result[0];
    } catch (error) {
        console.error('Error getting database info:', error);
        return null;
    }
}