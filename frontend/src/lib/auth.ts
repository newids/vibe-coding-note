import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: 'OWNER' | 'VISITOR';
    provider: 'EMAIL' | 'GOOGLE' | 'GITHUB' | 'FACEBOOK' | 'APPLE' | 'NAVER' | 'KAKAO';
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    success: boolean;
    data: {
        user: User;
        token: string;
    };
}

export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
    };
}

// Auth API functions
export const authApi = {
    register: async (data: { email: string; password: string; name: string }): Promise<AuthResponse> => {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, data);
        return response.data;
    },

    login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, data);
        return response.data;
    },

    getCurrentUser: async (token: string): Promise<{ success: boolean; data: { user: User } }> => {
        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    },

    logout: async (token: string): Promise<{ success: boolean; message: string }> => {
        const response = await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    },

    refreshToken: async (token: string): Promise<{ success: boolean; data: { token: string } }> => {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    }
};

// Token management
export const tokenStorage = {
    get: (): string | null => {
        return localStorage.getItem('auth_token');
    },

    set: (token: string): void => {
        localStorage.setItem('auth_token', token);
    },

    remove: (): void => {
        localStorage.removeItem('auth_token');
    }
};

// OAuth URLs
export const oauthUrls = {
    google: `${API_BASE_URL}/auth/google`,
    github: `${API_BASE_URL}/auth/github`,
    facebook: `${API_BASE_URL}/auth/facebook`,
    apple: `${API_BASE_URL}/auth/apple`,
    naver: `${API_BASE_URL}/auth/naver`,
    kakao: `${API_BASE_URL}/auth/kakao`
};