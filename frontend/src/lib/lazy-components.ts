import React, { ComponentType, LazyExoticComponent } from 'react';

// Enhanced lazy loading with error boundaries and retry logic
export interface LazyComponentOptions {
    fallback?: React.ComponentType;
    retryCount?: number;
    retryDelay?: number;
}

// Create a lazy component with enhanced error handling
export const createLazyComponent = <T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    options: LazyComponentOptions = {}
): LazyExoticComponent<T> => {
    const { retryCount = 3, retryDelay = 1000 } = options;

    let retries = 0;

    const retryImport = async (): Promise<{ default: T }> => {
        try {
            return await importFn();
        } catch (error) {
            if (retries < retryCount) {
                retries++;
                console.warn(`Failed to load component, retrying (${retries}/${retryCount})...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return retryImport();
            }
            throw error;
        }
    };

    return React.lazy(retryImport);
};

// Preload a lazy component
export const preloadComponent = (
    importFn: () => Promise<{ default: ComponentType<any> }>
): Promise<void> => {
    return importFn().then(() => { }).catch(console.error);
};

// Lazy load components with prefetching on hover
export const createPrefetchLazyComponent = <T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    options: LazyComponentOptions = {}
) => {
    const LazyComponent = createLazyComponent(importFn, options);
    let prefetched = false;

    const PrefetchWrapper: React.FC<React.ComponentProps<T> & { prefetch?: boolean }> = ({
        prefetch = true,
        ...props
    }) => {
        const handleMouseEnter = () => {
            if (prefetch && !prefetched) {
                prefetched = true;
                preloadComponent(importFn);
            }
        };

        return (
            <div onMouseEnter= { handleMouseEnter } >
            <LazyComponent { ...props as any } />
            </div>
    );
  };

return PrefetchWrapper;
};

// Common lazy-loaded components
export const lazyComponents = {
    // Notes components
    NoteEditor: createLazyComponent(() => import('../components/notes/NoteEditor')),
    NoteDetail: createLazyComponent(() => import('../components/notes/NoteDetail')),
    InfiniteNoteList: createLazyComponent(() => import('../components/notes/InfiniteNoteList')),

    // Comments components
    CommentEditor: createLazyComponent(() => import('../components/comments/CommentEditor')),
    CommentFormWrapper: createLazyComponent(() => import('../components/comments/CommentFormWrapper')),

    // Auth components
    RegisterForm: createLazyComponent(() => import('../components/auth/RegisterForm')),
    SocialLogin: createLazyComponent(() => import('../components/auth/SocialLogin')),

    // Admin components (if they exist)
    AdminUsersPage: createLazyComponent(() => import('../pages/AdminUsersPage').catch(() => ({ default: () => null }))),
};

// Preload critical components
export const preloadCriticalComponents = () => {
    // Preload components that are likely to be used soon
    preloadComponent(() => import('../components/notes/NoteCard'));
    preloadComponent(() => import('../components/search/SearchBar'));
    preloadComponent(() => import('../components/comments/CommentList'));
};

// Component loading states
export const ComponentLoader: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    return (
        <div className= "flex items-center justify-center p-4" >
        <div className={ `animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}` } />
            </div>
  );
};

export const ComponentError: React.FC<{ error?: Error; retry?: () => void }> = ({
    error,
    retry
}) => (
    <div className= "flex flex-col items-center justify-center p-4 text-center" >
    <p className="text-red-600 mb-2" > Failed to load component </p>
{
    error && (
        <p className="text-sm text-gray-500 mb-2" > { error.message } </p>
    )
}
{
    retry && (
        <button 
        onClick={ retry }
    className = "px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
        Retry
        </button>
    )
}
</div>
);