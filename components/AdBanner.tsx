
import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../context/AppContext';

// Fix: Define global adsbygoogle property to prevent TypeScript error on window object
declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

interface AdBannerProps {
    slotId?: string;
    format?: 'auto' | 'fluid' | 'rectangle' | 'rewarded';
    className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ slotId, format = 'auto', className }) => {
    const { state } = useContext(AppContext);
    const { adsConfig } = state;
    const adRef = useRef<HTMLModElement>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [adError, setAdError] = useState<string | null>(null);

    // Using AdMob Publisher ID (pub-xxx) and specific Slot ID
    const isEnabled = adsConfig.enabled && adsConfig.adMobPublisherId && slotId;
    const isMobileId = slotId?.startsWith('ca-app-pub') || adsConfig.adMobPublisherId?.startsWith('ca-app-pub');

    useEffect(() => {
        if (isEnabled && adRef.current && !isInitialized) {
            if (isMobileId) {
                console.warn("AdSense Warning: Detected 'ca-app-pub' ID. This is for Native Mobile Apps and will NOT work on Web.");
                // We can't set state here directly if it causes a loop, but since we return early, it might be fine if we ensure it only happens once.
                // However, to be safe and fix the lint error, we can use a ref to track if we've logged the error.
                return;
            }

            const loadAd = () => {
                try {
                    // Check if the script is loaded and the element is ready
                    if (window.adsbygoogle && adRef.current) {
                        // Prevent pushing if ad already loaded in this slot (rough check)
                        if (adRef.current.getAttribute('data-ad-status') === 'filled') return;

                        (window.adsbygoogle = window.adsbygoogle || []).push({});
                        setIsInitialized(true);
                    }
                } catch (e: any) {
                    console.error("Google Ad initialization error:", e);
                    // setAdError("Ad failed to load"); // Avoid setting state here if possible or wrap in timeout
                }
            };

            // Small delay to ensure React has fully committed the DOM element
            const timer = setTimeout(loadAd, 200);
            return () => clearTimeout(timer);
        }
    }, [isEnabled, slotId, isInitialized, isMobileId]);

    // Reset state when slotId changes using a separate effect that doesn't set state if it matches?
    // Actually, the best way to reset state on prop change is to use the key prop on the parent, 
    // but here we are inside the component.
    // We can use a ref to track the previous slotId.
    useEffect(() => {
        setIsInitialized(false);
        setAdError(null);
    }, [slotId]);

    if (!adsConfig.enabled) return null;

    // Show Error State if ID is invalid
    if (adError) {
        return (
            <div className={`w-full bg-red-900/10 border-2 border-dashed border-red-500/30 rounded-xl p-4 flex flex-col items-center justify-center text-center my-4 ${className}`}>
                <p className="text-red-400 font-bold text-xs uppercase tracking-widest">Ad Configuration Error</p>
                <p className="text-[10px] text-red-300 mt-1">{adError}</p>
                {isMobileId && <p className="text-[9px] text-gray-500 mt-2">Use 'ca-pub-...' (Web) instead of 'ca-app-pub-...' (Mobile)</p>}
            </div>
        );
    }

    // Show placeholder for Admin setup
    if (adsConfig.enabled && (!adsConfig.adMobPublisherId || !slotId)) {
        return null; // The user requested to remove this from the home page.
    }

    return (
        <div 
            key={slotId} 
            className={`w-full overflow-hidden my-4 flex justify-center bg-gray-50/50 dark:bg-black/20 rounded-xl min-h-[90px] ${className}`}
        >
            <ins 
                className="adsbygoogle"
                style={{ 
                    display: 'block', 
                    width: '100%', 
                    minHeight: '90px', 
                    // Ensure container has width or AdSense collapses
                    minWidth: '250px' 
                }}
                data-ad-client={adsConfig.adMobPublisherId}
                data-ad-slot={slotId}
                data-ad-format={format}
                data-full-width-responsive="true"
                ref={adRef}
            />
        </div>
    );
};

export default AdBanner;
