import { createClient, RedisClientType } from 'redis';

class CacheService {
    private client: RedisClientType | null = null;
    private isConnected = false;

    async connect(): Promise<void> {
        if (this.isConnected) return;

        try {
            this.client = createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                socket: {
                    connectTimeout: 5000
                }
            });

            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('Redis Client Connected');
                this.isConnected = true;
            });

            this.client.on('disconnect', () => {
                console.log('Redis Client Disconnected');
                this.isConnected = false;
            });

            await this.client.connect();
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            this.client = null;
            this.isConnected = false;
        }
    }

    async disconnect(): Promise<void> {
        if (this.client && this.isConnected) {
            await this.client.disconnect();
            this.client = null;
            this.isConnected = false;
        }
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.client || !this.isConnected) {
            return null;
        }

        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
        if (!this.client || !this.isConnected) {
            return false;
        }

        try {
            await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    async del(key: string): Promise<boolean> {
        if (!this.client || !this.isConnected) {
            return false;
        }

        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    }

    async delPattern(pattern: string): Promise<boolean> {
        if (!this.client || !this.isConnected) {
            return false;
        }

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
            return true;
        } catch (error) {
            console.error('Cache delete pattern error:', error);
            return false;
        }
    }

    async exists(key: string): Promise<boolean> {
        if (!this.client || !this.isConnected) {
            return false;
        }

        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            console.error('Cache exists error:', error);
            return false;
        }
    }

    // Cache key generators
    static keys = {
        note: (id: string) => `note:${id}`,
        notesList: (page: number, limit: number, filters: string) => `notes:list:${page}:${limit}:${filters}`,
        noteComments: (noteId: string) => `note:${noteId}:comments`,
        categories: () => 'categories:all',
        tags: () => 'tags:all',
        searchSuggestions: (query: string) => `search:suggestions:${query}`,
        searchResults: (query: string, limit: number) => `search:results:${query}:${limit}`,
        filters: () => 'filters:all'
    };

    // Cache TTL constants (in seconds)
    static TTL = {
        SHORT: 60,      // 1 minute
        MEDIUM: 300,    // 5 minutes
        LONG: 1800,     // 30 minutes
        VERY_LONG: 3600 // 1 hour
    };
}

// Create singleton instance
const cacheService = new CacheService();

export { cacheService, CacheService };