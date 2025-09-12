import type { Comment } from '../../types/note';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

// Fetch comments for a specific note
export const fetchComments = async (noteId: string): Promise<Comment[]> => {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/comments`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch comments');
    }

    const data = await response.json();
    return data.data;
};

// Create a new comment
export const createComment = async (noteId: string, content: string, parentId?: string): Promise<Comment> => {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content, parentId }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create comment');
    }

    const data = await response.json();
    return data.data;
};

// Update a comment
export const updateComment = async (commentId: string, content: string): Promise<Comment> => {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update comment');
    }

    const data = await response.json();
    return data.data;
};

// Delete a comment
export const deleteComment = async (commentId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete comment');
    }
};