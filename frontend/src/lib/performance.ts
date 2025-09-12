// Performance monitoring and optimization utilities

// Web Vitals tracking
export interface WebVitalsMetric {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    id: string;
}

// Performance observer for monitoring
class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: Map<string, number> = new Map();
    private observers: PerformanceObserver[] = [];

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    // Initialize performance monitoring
    init() {
        if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
            return;
        }

        // Monitor Largest Contentful Paint (LCP)
        this.observeMetric('largest-contentful-paint', (entries) => {
            const lastEntry = entries[entries.length - 1];
            this.recordMetric('LCP', lastEntry.startTime);
        });

        // Monitor First Input Delay (FID)
        this.observeMetric('first-input', (entries) => {
            const firstEntry = entries[0];
            this.recordMetric('FID', firstEntry.processingStart - firstEntry.startTime);
        });

        // Monitor Cumulative Layout Shift (CLS)
        this.observeMetric('layout-shift', (entries) => {
            let clsValue = 0;
            for (const entry of entries) {
                if (!(entry as any).hadRecentInput) {
                    clsValue += (entry as any).value;
                }
            }
            this.recordMetric('CLS', clsValue);
        });

        // Monitor navigation timing
        this.observeNavigation();
    }

    private observeMetric(type: string, callback: (entries: PerformanceEntry[]) => void) {
        try {
            const observer = new PerformanceObserver((list) => {
                callback(list.getEntries());
            });
            observer.observe({ type, buffered: true });
            this.observers.push(observer);
        } catch (error) {
            console.warn(`Failed to observe ${type}:`, error);
        }
    }

    private observeNavigation() {
        if ('navigation' in performance) {
            const navigation = (performance as any).navigation;
            this.recordMetric('TTFB', navigation.responseStart - navigation.requestStart);
            this.recordMetric('DOM_LOAD', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
            this.recordMetric('LOAD_COMPLETE', navigation.loadEventEnd - navigation.loadEventStart);
        }
    }

    private recordMetric(name: string, value: number) {
        this.metrics.set(name, value);

        // Log performance metrics in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`Performance Metric - ${name}: ${value.toFixed(2)}ms`);
        }
    }

    // Get recorded metrics
    getMetrics(): Record<string, number> {
        return Object.fromEntries(this.metrics);
    }

    // Cleanup observers
    disconnect() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
    }
}

// Bundle size analyzer
export const analyzeBundleSize = () => {
    if (typeof window === 'undefined') return;

    // Analyze loaded resources
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsResources = resources.filter(r => r.name.includes('.js'));
    const cssResources = resources.filter(r => r.name.includes('.css'));

    const totalJSSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    const totalCSSSize = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

    console.log('Bundle Analysis:', {
        jsFiles: jsResources.length,
        cssFiles: cssResources.length,
        totalJSSize: `${(totalJSSize / 1024).toFixed(2)} KB`,
        totalCSSSize: `${(totalCSSSize / 1024).toFixed(2)} KB`,
        totalSize: `${((totalJSSize + totalCSSSize) / 1024).toFixed(2)} KB`
    });
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
    if (typeof window === 'undefined' || !('memory' in performance)) return;

    const memory = (performance as any).memory;
    return {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
    };
};

// Debounce utility for performance optimization
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate = false
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };

        const callNow = immediate && !timeout;

        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(later, wait);

        if (callNow) func(...args);
    };
};

// Throttle utility for performance optimization
export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
    const monitor = PerformanceMonitor.getInstance();
    monitor.init();

    // Analyze bundle size after load
    window.addEventListener('load', () => {
        setTimeout(() => {
            analyzeBundleSize();
            console.log('Memory Usage:', monitorMemoryUsage());
        }, 1000);
    });

    return monitor;
};

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();