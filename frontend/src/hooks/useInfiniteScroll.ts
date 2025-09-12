import { useEffect, useRef, useCallback } from "react";

interface UseInfiniteScrollOptions {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
}

export const useInfiniteScroll = ({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    threshold = 1.0,
    rootMargin = "100px",
    enabled = true,
}: UseInfiniteScrollOptions) => {
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const handleIntersection = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;

            if (
                entry.isIntersecting &&
                hasNextPage &&
                !isFetchingNextPage &&
                enabled
            ) {
                fetchNextPage();
            }
        },
        [hasNextPage, isFetchingNextPage, fetchNextPage, enabled]
    );

    useEffect(() => {
        const element = loadMoreRef.current;
        if (!element || !enabled) return;

        const observer = new IntersectionObserver(handleIntersection, {
            threshold,
            rootMargin,
        });

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [handleIntersection, threshold, rootMargin, enabled]);

    return { loadMoreRef };
};