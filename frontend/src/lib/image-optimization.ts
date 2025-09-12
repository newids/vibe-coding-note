// Image optimization utilities for better performance

export interface ImageOptimizationOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
    lazy?: boolean;
}

// Lazy loading image component with intersection observer
export const useLazyImage = (src: string, options: ImageOptimizationOptions = {}) => {
    const { lazy = true } = options;

    if (!lazy) {
        return { src, loading: false, error: false };
    }

    // This would typically use intersection observer
    // For now, we'll return the basic implementation
    return { src, loading: false, error: false };
};

// Generate optimized image URLs (placeholder for CDN integration)
export const getOptimizedImageUrl = (
    src: string,
    options: ImageOptimizationOptions = {}
): string => {
    const { width, height, quality = 80, format = 'webp' } = options;

    // In a real implementation, this would integrate with a CDN like Cloudinary
    // For now, return the original src
    let optimizedUrl = src;

    // Add query parameters for optimization (if using a service)
    const params = new URLSearchParams();

    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality !== 80) params.set('q', quality.toString());
    if (format !== 'webp') params.set('f', format);

    const queryString = params.toString();
    if (queryString) {
        optimizedUrl += (src.includes('?') ? '&' : '?') + queryString;
    }

    return optimizedUrl;
};

// Preload critical images
export const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = src;
    });
};

// Generate responsive image srcSet
export const generateSrcSet = (
    baseSrc: string,
    sizes: number[] = [320, 640, 768, 1024, 1280, 1920]
): string => {
    return sizes
        .map(size => `${getOptimizedImageUrl(baseSrc, { width: size })} ${size}w`)
        .join(', ');
};

// Image component with lazy loading and optimization
export interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    lazy?: boolean;
    quality?: number;
    sizes?: string;
    priority?: boolean;
}

// Placeholder for optimized image component
// In a real implementation, this would be a React component
export const createOptimizedImageProps = (props: OptimizedImageProps) => {
    const {
        src,
        alt,
        width,
        height,
        className,
        lazy = true,
        quality = 80,
        sizes,
        priority = false
    } = props;

    const optimizedSrc = getOptimizedImageUrl(src, { width, height, quality });

    return {
        src: optimizedSrc,
        alt,
        width,
        height,
        className,
        loading: (lazy && !priority) ? 'lazy' as const : 'eager' as const,
        decoding: 'async' as const,
        ...(sizes && { sizes }),
        ...(width && height && {
            srcSet: generateSrcSet(src, [width * 0.5, width, width * 1.5, width * 2])
        })
    };
};