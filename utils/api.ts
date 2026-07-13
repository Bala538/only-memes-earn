export function getApiBaseUrl(): string {
    if (typeof window === 'undefined') return '';
    
    // If we have an explicit VITE_API_URL defined, use it
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    const { hostname, protocol } = window.location;

    // Direct Capacitor/Cordova app requests to the production custom domain
    const isNativeApp = protocol === 'capacitor:' || protocol === 'chrome-extension:' || protocol === 'file:';
    if (isNativeApp) {
        return 'https://onlymemesearn.store';
    }

    // For custom domains, we route requests directly to our production Cloud Run backend
    // on Google Cloud to handle secure operations like SMTP mail sending and transactional tasks.
    if (
        hostname === 'onlymemesearn.store' || 
        hostname.endsWith('.onlymemesearn.store') ||
        hostname === 'onlymemeearn.store' ||
        hostname.endsWith('.onlymemeearn.store')
    ) {
        return 'https://ais-pre-qflflhxh4mcrk3ijlamcqr-11079566135.asia-southeast1.run.app';
    }

    // If the hostname is a direct Cloud Run instance or local development/sandboxes,
    // we use relative paths since the backend runs on the exact same origin.
    if (
        hostname.endsWith('.run.app') || 
        hostname === 'localhost' || 
        hostname === '127.0.0.1' ||
        hostname.endsWith('.gitpod.io') ||
        hostname.endsWith('.webcontainer.io')
    ) {
        return '';
    }
    
    // Fallback URL (the development/pre-release app URL)
    return 'https://ais-pre-qflflhxh4mcrk3ijlamcqr-11079566135.asia-southeast1.run.app';
}
