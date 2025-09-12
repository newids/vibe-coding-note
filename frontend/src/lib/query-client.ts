import { QueryClient } from '@tanstack/react-query';
import { ApiErrorHandler } from './errors';

// Enhanced React Query configuration with optimized caching
export const createQueryClient = () => {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Stale time - how long data is considered fresh
                staleTime: 5 * 60 * 1000, // 5 minutes

                // Cache time - how long data stays in cache after becoming stale
                gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)

                // Retry configuration
                retry: (failureCount, error) => {
                    // Don't retry on client errors (4xx)
                    if (ApiErrorHandler.isClientError(error)) {
                        return false;
                    }
                    // Retry up to 3 times for network/server errors
                    return failureCount < 3;
                },

                // Exponential backoff for retries
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

                // Don't refetch on window focus by default
                refetchOnWindowFocus: false,

                // Refetch on reconnect
                refetchOnReconnect: true,

                // Don't refetch on mount if data is fresh
                refetchOnMount: true,
            },
            mutations: {
                // Retry configuration for mutations
                retry: (failureCount, error) => {
                    // Don't retry mutations on client errors
                    if (ApiErrorHandler.isClientError(error)) {
                        return false;
                    }
                    // Only retry once for mutations to avoid duplicate operations
                    return failureCount < 1;
                },

                // Shorter retry delay for mutations
                retryDelay: 1000,
            },
        },
    });
};

// Query keys factory for consistent cache key management
export const queryKeys = {
    // Notes
    notes: {
        all: ['notes'] as const,
        lists: () => [...queryKeys.notes.all, 'list'] as const,
        list: (filters: Record<string, any>) => [...queryKeys.notes.lists(), filters] as const,
        details: () => [...queryKeys.notes.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.notes.details(), id] as const,
        search: (query: string) => [...queryKeys.notes.all, 'search', query] as const,
        filters: () => [...queryKeys.notes.all, 'filters'] as const,
    },

    // Comments
    comments: {
        all: ['comments'] as const,
        byNote: (noteId: string) => [...queryKeys.comments.all, 'note', noteId] as const,
    },

    // Categories
    categories: {
        all: ['categories'] as const,
        lists: () => [...queryKeys.categories.all, 'list'] as const,
        details: () => [...queryKeys.categories.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.categories.details(), id] as const,
    },

    // Tags
    tags: {
        all: ['tags'] as const,
        lists: () => [...queryKeys.tags.all, 'list'] as const,
        suggestions: (query: string) => [...queryKeys.tags.all, 'suggestions', query] as const,
    },

    // Auth
    auth: {
        user: ['auth', 'user'] as const,
    },
} as const;

// Cache invalidation helpers
export const cacheUtils = {
    // Invalidate all notes-related queries
    invalidateNotes: (queryClient: QueryClient) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
    },

    // Invalidate specific note and related data
    invalidateNote: (queryClient: QueryClient, noteId: string) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.comments.byNote(noteId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
    },

    // Invalidate comments for a note
    invalidateNoteComments: (queryClient: QueryClient, noteId: string) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.comments.byNote(noteId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },

    // Invalidate categories
    invalidateCategories: (queryClient: QueryClient) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.notes.filters() });
    },

    // Invalidate tags
    invalidateTags: (queryClient: QueryClient) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.notes.filters() });
    },

    // Prefetch next page of notes
    prefetchNotesPage: async (
        queryClient: QueryClient,
        filters: Record<string, any>,
        nextPage: number
    ) => {
        const nextFilters = { ...filters, page: nextPage };
        await queryClient.prefetchQuery({
            queryKey: queryKeys.notes.list(nextFilters),
            staleTime: 2 * 60 * 1000, // 2 minutes for prefetched data
        });
    },
};