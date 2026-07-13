export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'error' | 'success' | 'warning' | 'selection' = 'light') => {
    if (typeof window !== 'undefined') {
        const tg = (window as any).Telegram?.WebApp;
        if (tg && tg.HapticFeedback) {
            try {
                if (['error', 'success', 'warning'].includes(type)) {
                    tg.HapticFeedback.notificationOccurred(type);
                } else if (type === 'selection') {
                    tg.HapticFeedback.selectionChanged();
                } else {
                    tg.HapticFeedback.impactOccurred(type);
                }
            } catch (e) {
                console.error("Haptic feedback error:", e);
            }
        }
    }
};
