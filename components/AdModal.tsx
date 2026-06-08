
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import AdBanner from './AdBanner';

const AdModal: React.FC = () => {
    const { state, closeAd } = useContext(AppContext);
    const { adModal, adsConfig } = state;
    const duration = adModal.type === 'rewarded' ? 15 : 5;
    const [timeLeft, setTimeLeft] = useState(duration);
    const [canClose, setCanClose] = useState(false);

    useEffect(() => {
        if (!adModal.visible) {
            setTimeLeft(duration);
            setCanClose(false);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setCanClose(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [adModal.visible, adModal.type, duration]);

    if (!adModal.visible) return null;

    const unitId = adModal.type === 'rewarded' ? adsConfig.rewardedUnitId : adsConfig.interstitialUnitId;

    return (
        <div 
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl p-4"
            style={{ touchAction: 'none' }}
        >
            <div className="w-full max-w-lg bg-white dark:bg-[#1c1c1e] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col h-full max-h-[80vh]">
                {/* Header */}
                <div className="p-4 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-900 dark:text-white font-bold text-sm uppercase tracking-widest">
                            {adModal.type === 'rewarded' ? 'Reward Ad' : 'Advertisement'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {canClose ? (
                            <button 
                                onClick={closeAd}
                                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors"
                            >
                                {adModal.type === 'rewarded' ? 'Close & Reward' : 'Close Ad'}
                            </button>
                        ) : (
                            <span className="text-gray-500 dark:text-gray-400 text-xs font-mono">
                                Closing in {timeLeft}s
                            </span>
                        )}
                    </div>
                </div>

                {/* Ad Container */}
                <div className="flex-grow flex items-center justify-center bg-gray-50 dark:bg-black relative p-2">
                    {/* Placeholder for visual feedback if AdBlock is on or ID is missing */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-gray-300 dark:text-gray-700 font-black text-2xl uppercase tracking-widest opacity-50 dark:opacity-20">
                            Ad Space
                        </span>
                    </div>
                    
                    {/* The Ad Unit */}
                    <div className="w-full h-full flex items-center justify-center">
                        <AdBanner 
                            slotId={unitId} 
                            format="rectangle" 
                            className="my-0 w-full h-full flex items-center justify-center" 
                        />
                    </div>
                </div>

                {/* Footer for Rewarded */}
                {adModal.type === 'rewarded' && (
                    <div className="p-4 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Watch the entire video to claim your reward.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdModal;
