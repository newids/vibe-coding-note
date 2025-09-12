// Service Worker registration and management

export const registerServiceWorker = async (): Promise<void> => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');

            console.log('Service Worker registered successfully:', registration);

            // Handle updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New content is available, prompt user to refresh
                            if (confirm('New version available! Refresh to update?')) {
                                window.location.reload();
                            }
                        }
                    });
                }
            });

        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
};

export const unregisterServiceWorker = async (): Promise<void> => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.unregister();
                console.log('Service Worker unregistered successfully');
            }
        } catch (error) {
            console.error('Service Worker unregistration failed:', error);
        }
    }
};

// Check if service worker is supported and active
export const isServiceWorkerSupported = (): boolean => {
    return 'serviceWorker' in navigator;
};

export const isServiceWorkerActive = async (): Promise<boolean> => {
    if (!isServiceWorkerSupported()) return false;

    try {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!(registration && registration.active);
    } catch {
        return false;
    }
};