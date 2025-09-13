const API_BASE_URL = 'http://localhost:3001/api';

// API client with error handling
class ApiClient {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Auth methods
    async login(email: string, password: string) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async register(name: string, email: string, password: string) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });
    }

    // Notes methods
    async getNotes(params?: {
        search?: string;
        category?: string;
        page?: number;
        limit?: number;
    }) {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.append('search', params.search);
        if (params?.category) searchParams.append('category', params.category);
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());

        const queryString = searchParams.toString();
        const endpoint = queryString ? `/notes?${queryString}` : '/notes';

        return this.request(endpoint);
    }

    async getCategories() {
        return this.request('/categories');
    }

    async getNote(id: string) {
        return this.request(`/notes/${id}`);
    }

    async createNote(noteData: {
        title: string;
        content: string;
        category: string;
        tags?: string[];
    }) {
        return this.request('/notes', {
            method: 'POST',
            body: JSON.stringify(noteData),
        });
    }

    async updateNote(id: string, noteData: {
        title: string;
        content: string;
        category: string;
        tags?: string[];
    }) {
        return this.request(`/notes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(noteData),
        });
    }

    async deleteNote(id: string) {
        return this.request(`/notes/${id}`, {
            method: 'DELETE',
        });
    }
}

export const apiClient = new ApiClient(API_BASE_URL);