import type { Note, NotesResponse, CreateNoteData, UpdateNoteData, NotesFilters, Category, Tag } from '../../types/note';
import { createRetryableRequest } from '../retry';
import { ApiErrorHandler } from '../errors';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to build query string
const buildQueryString = (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value.toString());
        }
    });
    return searchParams.toString();
};

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

// Enhanced fetch function with error handling
const fetchWithErrorHandling = async (url: string, options: RequestInit = {}): Promise<any> => {
    const response = await fetch(url, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).response = { status: response.status, data: errorData };
        throw error;
    }

    return response.json();
};

// Fetch all notes with filters
export const fetchNotes = createRetryableRequest(async (filters: NotesFilters = {}): Promise<NotesResponse> => {
    const queryString = buildQueryString(filters);
    const url = `${API_BASE_URL}/notes${queryString ? `?${queryString}` : ''}`;

    const data = await fetchWithErrorHandling(url, {
        headers: getAuthHeaders(),
    });

    return data.data;
});

// Fetch a single note by ID
export const fetchNote = createRetryableRequest(async (id: string): Promise<Note> => {
    const data = await fetchWithErrorHandling(`${API_BASE_URL}/notes/${id}`, {
        headers: getAuthHeaders(),
    });

    return data.data;
});

// Create a new note (owner only)
export const createNote = async (noteData: CreateNoteData): Promise<Note> => {
    const data = await fetchWithErrorHandling(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(noteData),
    });

    return data.data;
};

// Update a note (owner only)
export const updateNote = async (id: string, noteData: UpdateNoteData): Promise<Note> => {
    const data = await fetchWithErrorHandling(`${API_BASE_URL}/notes/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(noteData),
    });

    return data.data;
};

// Delete a note (owner only)
export const deleteNote = async (id: string): Promise<void> => {
    await fetchWithErrorHandling(`${API_BASE_URL}/notes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
};

// Check like status for a note (anonymous)
export const checkLikeStatus = async (id: string): Promise<{ noteId: string; likeCount: number; liked: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/notes/${id}/like-status`, {
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to check like status');
    }

    const data = await response.json();
    return data.data;
};

// Like a note (anonymous)
export const likeNote = async (id: string): Promise<{ noteId: string; likeCount: number; liked: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/notes/${id}/like`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to like note');
    }

    const data = await response.json();
    return data.data;
};

// Fetch categories
export const fetchCategories = async (): Promise<Category[]> => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch categories');
    }

    const data = await response.json();
    return data.data;
};

// Fetch tags with optional search
export const fetchTags = async (search?: string, limit?: number): Promise<Tag[]> => {
    const queryParams: Record<string, any> = {};
    if (search) queryParams.search = search;
    if (limit) queryParams.limit = limit;

    const queryString = buildQueryString(queryParams);
    const url = `${API_BASE_URL}/tags${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch tags');
    }

    const data = await response.json();
    return data.data;
};

// Fetch tag suggestions for autocomplete
export const fetchTagSuggestions = async (query: string, limit: number = 10): Promise<Tag[]> => {
    if (!query.trim()) return [];

    const queryString = buildQueryString({ q: query.trim(), limit });
    const response = await fetch(`${API_BASE_URL}/tags/suggestions?${queryString}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch tag suggestions');
    }

    const data = await response.json();
    return data.data;
};

// Create a new tag (owner only)
export const createTag = async (name: string): Promise<Tag> => {
    const response = await fetch(`${API_BASE_URL}/tags`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create tag');
    }

    const data = await response.json();
    return data.data;
};

// Create multiple tags (owner only)
export const createTagsBulk = async (names: string[]): Promise<{ created: Tag[]; skipped: any[]; summary: unknown }> => {
    const response = await fetch(`${API_BASE_URL}/tags/bulk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ names }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create tags');
    }

    const data = await response.json();
    return data.data;
};

// Create a new category (owner only)
export const createCategory = async (categoryData: { name: string; description?: string; color: string }): Promise<Category> => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create category');
    }

    const data = await response.json();
    return data.data;
};

// Search notes with suggestions
export const searchNotes = async (query: string, limit: number = 5): Promise<{
    query: string;
    suggestions: string[];
    notes: Note[];
    totalFound: number;
}> => {
    if (!query.trim()) {
        return {
            query: '',
            suggestions: [],
            notes: [],
            totalFound: 0
        };
    }

    const queryString = buildQueryString({ q: query.trim(), limit });
    const response = await fetch(`${API_BASE_URL}/notes/search?${queryString}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to search notes');
    }

    const data = await response.json();
    return data.data;
};

// Fetch filter options (categories and tags with note counts)
export const fetchFilterOptions = async (): Promise<{
    categories: Category[];
    tags: Tag[];
}> => {
    const response = await fetch(`${API_BASE_URL}/notes/filters`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch filter options');
    }

    const data = await response.json();
    return data.data;
};