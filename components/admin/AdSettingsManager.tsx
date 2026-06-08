
import { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { Token } from '../../types';

const AdSettingsManager: React.FC = () => {
    const { state, adminUpdateAdsConfig } = useContext(AppContext);
    const { adsConfig } = state;

    const [enabled, setEnabled] = useState(adsConfig.enabled);
    const [adMobPublisherId, setAdMobPublisherId] = useState(adsConfig.adMobPublisherId || '');
    const [bannerUnitId, setBannerUnitId] = useState(adsConfig.bannerUnitId || '');
    const [interstitialUnitId, setInterstitialUnitId] = useState(adsConfig.interstitialUnitId || '');
    const [rewardedUnitId, setRewardedUnitId] = useState(adsConfig.rewardedUnitId || '');
    
    // Reward Config
    const [rewardTitle, setRewardTitle] = useState(adsConfig.rewardTitle || 'Watch Video Earn +1,000');
    const [rewardAmount, setRewardAmount] = useState(adsConfig.rewardAmount?.toString() || '1000');
    const [rewardToken, setRewardToken] = useState<Token>(adsConfig.rewardToken || 'USHA');

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    useEffect(() => {
        setEnabled(adsConfig.enabled);
        setAdMobPublisherId(adsConfig.adMobPublisherId || '');
        setBannerUnitId(adsConfig.bannerUnitId || '');
        setInterstitialUnitId(adsConfig.interstitialUnitId || '');
        setRewardedUnitId(adsConfig.rewardedUnitId || '');
        setRewardTitle(adsConfig.rewardTitle || 'Watch Video Earn +1,000');
        setRewardAmount(adsConfig.rewardAmount?.toString() || '1000');
        setRewardToken(adsConfig.rewardToken || 'USHA');
    }, [adsConfig, setEnabled, setAdMobPublisherId, setBannerUnitId, setInterstitialUnitId, setRewardedUnitId, setRewardTitle, setRewardAmount, setRewardToken]);

    const handleSave = async () => {
        setSaveStatus('saving');
        await adminUpdateAdsConfig({
            enabled,
            adMobPublisherId,
            bannerUnitId,
            interstitialUnitId,
            rewardedUnitId,
            rewardTitle,
            rewardAmount: parseFloat(rewardAmount),
            rewardToken
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    };

    return (
        <div className="bg-white dark:bg-[#161B22] p-8 rounded-2xl shadow-2xl border border-blue-900/30">
            <div className="flex items-center space-x-4 mb-8 border-b border-gray-700 pb-6">
                <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-900/40">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">Monetization Engine</h2>
                    <p className="text-gray-400 text-sm font-medium">Configure Google AdSense or AdMob for Web</p>
                </div>
            </div>

            <div className="space-y-8 max-w-4xl">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Enable Toggle */}
                    <div className="flex-1 flex justify-between items-center bg-blue-600/5 p-6 rounded-2xl border border-blue-500/20">
                        <div>
                            <h3 className="text-gray-900 dark:text-white font-black text-lg">Ad Delivery Active</h3>
                            <p className="text-sm text-gray-400">Master switch for all advertisements</p>
                        </div>
                        <label className="inline-flex items-center cursor-pointer scale-125">
                            <input 
                                type="checkbox" 
                                checked={enabled} 
                                onChange={(e) => setEnabled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Publisher ID (e.g. pub-123456789)</label>
                        <input 
                            type="text" 
                            value={adMobPublisherId} 
                            onChange={(e) => setAdMobPublisherId(e.target.value)}
                            className="w-full bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white p-4 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono text-sm"
                            placeholder="pub-XXXXXXXXXXXXXXXX"
                        />
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-200 dark:border-gray-700/50">
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Standard Banner Unit ID</label>
                        <input 
                            type="text" 
                            value={bannerUnitId} 
                            onChange={(e) => setBannerUnitId(e.target.value)}
                            className="w-full bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white p-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono text-xs"
                            placeholder="Unit ID (e.g. 1234567890)"
                        />
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-200 dark:border-gray-700/50">
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Full-Page Unit ID</label>
                        <input 
                            type="text" 
                            value={interstitialUnitId} 
                            onChange={(e) => setInterstitialUnitId(e.target.value)}
                            className="w-full bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white p-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono text-xs"
                            placeholder="Unit ID (e.g. 1234567890)"
                        />
                    </div>
                </div>

                <div className="bg-amber-900/20 p-5 rounded-2xl border border-amber-500/20">
                    <h4 className="text-amber-400 font-black text-sm mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Important Notice
                    </h4>
                    <ul className="text-xs text-gray-400 space-y-2 leading-relaxed font-medium">
                        <li>1. Ensure you are using <strong>Web Unit IDs</strong> from AdSense or AdMob.</li>
                        <li>2. Mobile App IDs (Android/iOS) will <strong>not</strong> work on the web.</li>
                        <li>3. Your domain must be <strong>Approved</strong> in the Google dashboard to show live ads.</li>
                    </ul>
                </div>

                <button 
                    onClick={handleSave} 
                    disabled={saveStatus === 'saving'}
                    className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl transform active:scale-[0.98] ${saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                >
                    {saveStatus === 'saving' ? 'Applying...' : saveStatus === 'saved' ? 'Config Updated!' : 'Save Monetization Settings'}
                </button>
            </div>
        </div>
    );
};

export default AdSettingsManager;
