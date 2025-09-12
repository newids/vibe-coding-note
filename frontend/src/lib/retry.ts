import { ApiErrorHandler } from './errors';

export interface RetryOptions {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
    shouldRetry?: (error: any) => boolean;
}

export const withRetry = async <T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> => {
    const {
        maxAttempts = 3,
        delay = 1000,
        backoff = true,
        shouldRetry = ApiErrorHandler.shouldRetry
    } = options;

    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Don't retry if it's the last attempt or if we shouldn't retry this error
            if (attempt === maxAttempts || !shouldRetry(error)) {
                throw error;
            }

            // Calculate delay with optional exponential backoff
            const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;

            console.warn(`Request failed (attempt ${attempt}/${maxAttempts}), retrying in ${currentDelay}ms...`, error);

            await new Promise(resolve => setTimeout(resolve, currentDelay));
        }
    }

    throw lastError;
};

export const createRetryableRequest = <T extends any[], R>(
    requestFn: (...args: T) => Promise<R>,
    options?: RetryOptions
) => {
    return (...args: T): Promise<R> => {
        return withRetry(() => requestFn(...args), options);
    };
};