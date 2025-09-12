export interface ApiError {
    message: string;
    code?: string;
    status?: number;
    details?: any;
}

export class ApiErrorHandler {
    static getErrorMessage(error: any): string {
        // Handle network errors
        if (!error.response) {
            return 'Network error. Please check your connection and try again.';
        }

        const status = error.response?.status;
        const data = error.response?.data;

        // Handle specific HTTP status codes
        switch (status) {
            case 400:
                return data?.error?.message || 'Invalid request. Please check your input.';
            case 401:
                return 'You need to log in to perform this action.';
            case 403:
                return 'You don\'t have permission to perform this action.';
            case 404:
                return 'The requested resource was not found.';
            case 409:
                return data?.error?.message || 'This action conflicts with existing data.';
            case 422:
                return data?.error?.message || 'Please check your input and try again.';
            case 429:
                return 'Too many requests. Please wait a moment and try again.';
            case 500:
                return 'Server error. Please try again later.';
            case 503:
                return 'Service temporarily unavailable. Please try again later.';
            default:
                return data?.error?.message || 'An unexpected error occurred. Please try again.';
        }
    }

    static isNetworkError(error: any): boolean {
        return !error.response && error.request;
    }

    static isServerError(error: any): boolean {
        return error.response?.status >= 500;
    }

    static isClientError(error: any): boolean {
        const status = error.response?.status;
        return status >= 400 && status < 500;
    }

    static shouldRetry(error: any): boolean {
        // Retry on network errors or server errors (5xx)
        return this.isNetworkError(error) || this.isServerError(error);
    }
}

export const createApiError = (message: string, code?: string, status?: number, details?: any): ApiError => ({
    message,
    code,
    status,
    details
});