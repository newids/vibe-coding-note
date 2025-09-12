import { Request, Response, NextFunction } from 'express';
import { cacheService, CacheService } from './cache';

interface CacheOptions {
    ttl?: number;
    keyGenerator?: (req: Request) => string;
    condition?: (req: Request) => boolean;
}

// Cache middleware for GET requests
export const cacheMiddleware = (key: string, options: CacheOptions = {}) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Check condition if provided
        if (options.condition && !options.condition(req)) {
            return next();
        }

        try {
            // Generate cache key
            const cacheKey = options.keyGenerator ? options.keyGenerator(req) : key;

            // Try to get from cache
            const cachedData = await cacheService.get(cacheKey);

            if (cachedData) {
                console.log(`Cache hit for key: ${cacheKey}`);
                return res.json(cachedData);
            }

            // Store original json method
            const originalJson = res.json;

            // Override json method to cache the response
            res.json = function (data: any) {
                // Only cache successful responses
                if (res.statusCode === 200 && data.success) {
                    const ttl = options.ttl || CacheService.TTL.MEDIUM;
                    cacheService.set(cacheKey, data, ttl).catch(err => {
                        console.error('Failed to cache response:', err);
                    });
                    console.log(`Cached response for key: ${cacheKey}`);
                }

                // Call original json method
                return originalJson.call(this, data);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

// Cache invalidation middleware for write operations
export const cacheInvalidationMiddleware = (patterns: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Store original json method
        const originalJson = res.json;

        // Override json method to invalidate cache after successful operations
        res.json = function (data: any) {
            // Only invalidate cache for successful operations
            if (res.statusCode < 400 && data.success) {
                patterns.forEach(pattern => {
                    cacheService.delPattern(pattern).catch(err => {
                        console.error(`Failed to invalidate cache pattern ${pattern}:`, err);
                    });
                });
                console.log(`Invalidated cache patterns: ${patterns.join(', ')}`);
            }

            // Call original json method
            return originalJson.call(this, data);
        };

        next();
    };
};

// Helper function to generate cache key from request parameters
export const generateCacheKey = (baseKey: string, params: Record<string, any>): string => {
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}:${params[key]}`)
        .join('|');

    return sortedParams ? `${baseKey}:${sortedParams}` : baseKey;
};