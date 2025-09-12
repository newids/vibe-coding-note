import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { checkDatabaseConnection, getDatabaseInfo } from './lib/db-health';
import { prisma } from './lib/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check routes
app.get('/health', async (req, res) => {
    const dbConnected = await checkDatabaseConnection();
    const dbInfo = await getDatabaseInfo();

    res.json({
        status: 'OK',
        message: 'Vibe Coding Notes API is running',
        database: {
            connected: dbConnected,
            info: dbInfo
        },
        timestamp: new Date().toISOString()
    });
});

// Database health check route
app.get('/health/db', async (req, res) => {
    try {
        const dbConnected = await checkDatabaseConnection();
        const dbInfo = await getDatabaseInfo();

        if (dbConnected) {
            res.json({
                status: 'OK',
                database: {
                    connected: true,
                    info: dbInfo
                }
            });
        } else {
            res.status(503).json({
                status: 'ERROR',
                database: {
                    connected: false,
                    error: 'Database connection failed'
                }
            });
        }
    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            database: {
                connected: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
});

// Start server
async function startServer() {
    try {
        // Test database connection on startup
        console.log('🔍 Testing database connection...');
        const dbConnected = await checkDatabaseConnection();

        if (dbConnected) {
            const dbInfo = await getDatabaseInfo();
            console.log('📊 Database info:', dbInfo);
        } else {
            console.warn('⚠️  Database connection failed, but server will start anyway');
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📍 Health check: http://localhost:${PORT}/health`);
            console.log(`🗄️  Database health: http://localhost:${PORT}/health/db`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

export default app;