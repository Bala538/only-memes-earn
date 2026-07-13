export const openSafeLink = (url: string) => {
    if (!url) return;
    
    // Check if we are in Telegram WebApp
    const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
    
    if (tg && tg.openLink) {
        // Use Telegram's native link opener
        try {
            // For telegram links, openTelegramLink is preferred sometimes, but openLink is safer for external.
            // Let's just use openLink which handles standard external links via telegram's in-app browser.
            // If it's a telegram.me or t.me link, we can use openTelegramLink, though openLink works fine usually.
            if (url.includes('t.me/') || url.includes('telegram.me/')) {
                 if (tg.openTelegramLink) {
                     tg.openTelegramLink(url);
                     return;
                 }
            }
            tg.openLink(url);
            return;
        } catch (e) {
            console.error("Telegram openLink failed:", e);
        }
    }
    
    // Fallback
    window.open(url, '_blank', 'noopener,noreferrer');
};


