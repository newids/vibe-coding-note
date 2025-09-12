import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import session from 'express-session';
import { checkDatabaseConnection, getDatabaseInfo } from './lib/db-health';
import { prisma } from './lib/database';
import { cacheService } from './lib/cache';
import passport from './lib/passport';
import authRoutes from './routes/auth';
import oauthRoutes from './routes/oauth';
import notesRoutes from './routes/notes';
import categoriesRoutes from './routes/categories';
import tagsRoutes from './routes/tags';
import commentsRoutes from './routes/comments';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for proper IP address handling
app.set('trust proxy', true);

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration for OAuth
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api', commentsRoutes);

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
        cache: {
            connected: cacheService['isConnected'] || false
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
        // Initialize cache service
        console.log('🔄 Connecting to Redis cache...');
        await cacheService.connect();

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

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    await cacheService.disconnect();
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    await cacheService.disconnect();
    await prisma.$disconnect();
    process.exit(0);
});

startServer();

export default app;