// Optimized API client with request deduplication and caching

interface RequestCache {
    [key: string]: {
        promise: Promise<any>;
        timestamp: number;
        ttl: number;
    };
}

class ApiClient {
    private baseURL: string;
    private requestCache: RequestCache = {};
    private pendingRequests: Map<string, Promise<any>> = new Map();

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    // Generate cache key for request
    private getCacheKey(url: string, options: RequestInit = {}): string {
        const method = options.method || 'GET';
        const body = options.body ? JSON.stringify(options.body) : '';
        return `${method}:${url}:${body}`;
    }

    // Check if cached response is still valid
    private isCacheValid(cacheEntry: RequestCache[string]): boolean {
        return Date.now() - cacheEntry.timestamp < cacheEntry.ttl;
    }

    // Get auth headers
    private getAuthHeaders(): HeadersInit {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    }

    // Enhanced fetch with deduplication and caching
    async request<T>(
        endpoint: string,
        options: RequestInit & { cache?: boolean; ttl?: number } = {}
    ): Promise<T> {
        const { cache = true, ttl = 5 * 60 * 1000, ...fetchOptions } = options; // 5 minutes default TTL
        const url = `${this.baseURL}${endpoint}`;
        const cacheKey = this.getCacheKey(url, fetchOptions);

        // For GET requests, check cache first
        if (fetchOptions.method === 'GET' || !fetchOptions.method) {
            if (cache && this.requestCache[cacheKey] && this.isCacheValid(this.requestCache[cacheKey])) {
                return this.requestCache[cacheKey].promise;
            }

            // Check for pending identical requests (deduplication)
            if (this.pendingRequests.has(cacheKey)) {
                return this.pendingRequests.get(cacheKey)!;
            }
        }

        // Prepare request options
        const requestOptions: RequestInit = {
            ...fetchOptions,
            headers: {
                ...this.getAuthHeaders(),
                ...fetchOptions.headers,
            },
        };

        // Create the request promise
        const requestPromise = this.executeRequest<T>(url, requestOptions);

        // Store pending request for deduplication
        this.pendingRequests.set(cacheKey, requestPromise);

        // Cache GET requests
        if ((fetchOptions.method === 'GET' || !fetchOptions.method) && cache) {
            this.requestCache[cacheKey] = {
                promise: requestPromise,
                timestamp: Date.now(),
                ttl,
            };
        }

        try {
            const result = await requestPromise;
            return result;
        } finally {
            // Clean up pending request
            this.pendingRequests.delete(cacheKey);
        }
    }

    // Execute the actual HTTP request
    private async executeRequest<T>(url: string, options: RequestInit): Promise<T> {
        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const error = new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
                (error as any).response = { status: response.status, data: errorData };
                throw error;
            }

            const data = await response.json();
            return data.data || data;
        } catch (error) {
            // Remove failed requests from cache
            this.clearCacheByUrl(url);
            throw error;
        }
    }

    // Clear cache for specific URL pattern
    clearCacheByUrl(urlPattern: string): void {
        Object.keys(this.requestCache).forEach(key => {
            if (key.includes(urlPattern)) {
                delete this.requestCache[key];
            }
        });
    }

    // Clear all cache
    clearCache(): void {
        this.requestCache = {};
        this.pendingRequests.clear();
    }

    // Prefetch data
    async prefetch<T>(endpoint: string, options: RequestInit = {}): Promise<void> {
        try {
            await this.request<T>(endpoint, { ...options, cache: true });
        } catch (error) {
            // Silently fail prefetch requests
            console.warn('Prefetch failed:', error);
        }
    }

    // Batch requests
    async batch<T>(requests: Array<{ endpoint: string; options?: RequestInit }>): Promise<T[]> {
        const promises = requests.map(({ endpoint, options }) =>
            this.request<T>(endpoint, options)
        );
        return Promise.all(promises);
    }

    // GET request
    async get<T>(endpoint: string, options: Omit<RequestInit, 'method'> & { cache?: boolean; ttl?: number } = {}): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    // POST request
    async post<T>(endpoint: string, data?: any, options: Omit<RequestInit, 'method' | 'body'> = {}): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
            cache: false, // Don't cache POST requests
        });
    }

    // PUT request
    async put<T>(endpoint: string, data?: any, options: Omit<RequestInit, 'method' | 'body'> = {}): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
            cache: false, // Don't cache PUT requests
        });
    }

    // DELETE request
    async delete<T>(endpoint: string, options: Omit<RequestInit, 'method'> = {}): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'DELETE',
            cache: false, // Don't cache DELETE requests
        });
    }
}

// Create singleton instance
const apiClient = new ApiClient(import.meta.env.VITE_API_URL || 'http://localhost:3001/api');

export { apiClient, ApiClient };