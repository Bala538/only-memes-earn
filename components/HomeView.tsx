
import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Video, Token, ActiveTab } from '../types';
import PlayCircleIcon from './icons/PlayCircleIcon';
import UsersIcon from './icons/UsersIcon';
import ExchangeIcon from './icons/ExchangeIcon';
import TokenIcon from './icons/TokenIcon';
import BabyDogeIcon from './icons/BabyDogeIcon';

import { openSafeLink } from '../utils/urlUtils';

const TaskItem: React.FC<{ icon: React.ReactNode, title: string, reward: number, token: Token, tokenName: string, endTime?: string, limit?: number, claimCount?: number, onClick: () => void }> = ({ icon, title, reward, token, tokenName, endTime, limit, claimCount, onClick }) => (
    <div onClick={onClick} className="flex flex-col p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-transparent hover:border-gray-300 dark:hover:border-gray-700">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
                <div className="p-2 bg-white dark:bg-gray-700 rounded-md shrink-0 border border-gray-200 dark:border-transparent">{icon}</div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{title}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs font-bold text-yellow-600 dark:text-yellow-500 whitespace-nowrap pl-2">
                <TokenIcon token={token} className="w-4 h-4" />
                <span>+{reward.toLocaleString()} {tokenName}</span>
            </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
            {endTime && (
                <div className="text-[10px] font-bold text-red-400 uppercase tracking-tighter flex items-center bg-red-400/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                    Expires: {new Date(endTime).toLocaleDateString()}
                </div>
            )}
            {limit && limit > 0 && (
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-tighter flex items-center bg-purple-400/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                    {claimCount || 0}/{limit} Claims
                </div>
            )}
        </div>
    </div>
);

interface HomeViewProps {
    onVideoSelect: (video: Video) => void;
    setActiveTab: (tab: ActiveTab) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onVideoSelect, setActiveTab }) => {
    const { state } = useContext(AppContext);
    const { currentUser, videos, banners, adsConfig } = state;
    
    // Banner Slider State
    const [currentSlide, setCurrentSlide] = useState(0);
    const slideIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Banner Slider Effect
    useEffect(() => {
        if (banners.length > 1) {
            slideIntervalRef.current = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % banners.length);
            }, 5000); // Change slide every 5 seconds
        }
        return () => {
            if (slideIntervalRef.current) clearInterval(slideIntervalRef.current);
        };
    }, [banners.length]);

    if (!currentUser) return null;

    const handleBannerClick = (linkUrl?: string) => {
        if (linkUrl) {
            openSafeLink(linkUrl);
        }
    };
    
    return (
        <div className="pt-20 pb-24 px-4 space-y-6 max-w-screen-md mx-auto">
            {/* Dynamic Banner Slider */}
            <div className="relative rounded-xl shadow-xl overflow-hidden h-[160px] sm:h-[200px] bg-gray-100 dark:bg-gray-900 group">
                <div 
                    className="flex transition-transform duration-700 ease-in-out h-full" 
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                    {banners.map((banner) => (
                        <div 
                            key={banner.id} 
                            className={`w-full flex-shrink-0 relative h-[160px] sm:h-[200px] ${banner.linkUrl ? 'cursor-pointer' : ''}`}
                            onClick={() => handleBannerClick(banner.linkUrl)}
                        >
                            {banner.imageUrl ? (
                                <div 
                                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                    style={{ backgroundImage: `url('${banner.imageUrl}')` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                                </div>
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600" />
                            )}
                            
                            {(banner.title || banner.description) && (
                                <div className="relative z-10 pl-6 flex flex-col justify-center h-full pb-4 pt-4">
                                    {banner.title && (
                                        <h1 className="text-3xl font-extrabold mb-2 tracking-tight drop-shadow-lg text-white whitespace-pre-line">
                                            {banner.title}
                                        </h1>
                                    )}
                                    {banner.description && (
                                        <p className="text-gray-100 font-medium text-sm max-w-[85%] drop-shadow-md leading-relaxed">
                                            {banner.description}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {banners.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-2 z-20">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentSlide(index);
                                }}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    currentSlide === index ? 'bg-white w-6' : 'bg-white/50'
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { icon: PlayCircleIcon, label: 'Videos', sub: 'Earn Crypto', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10', action: () => setActiveTab('tasks') },
                    { icon: UsersIcon, label: 'Refer', sub: 'Earn Rewards', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/10', action: () => setActiveTab('referral') },
                    { icon: ExchangeIcon, label: 'Exchange', sub: 'Manage Funds', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10', action: () => setActiveTab('exchange') },
                    { icon: ExchangeIcon, label: 'Markets', sub: 'Trade Pairs', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10', action: () => setActiveTab('markets') }
                ].map((item, idx) => (
                    <div key={idx} onClick={item.action} className={`${item.bg} p-3 rounded-lg text-center border border-gray-200 dark:border-transparent hover:border-gray-300 dark:hover:border-gray-700 transition-all cursor-pointer active:scale-95`}>
                        <div className={`w-8 h-8 mx-auto mb-2 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center ${item.color} border border-gray-100 dark:border-transparent`}>
                            <item.icon className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{item.label}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{item.sub}</p>
                    </div>
                ))}
            </div>
            
            {/* All Videos List - Watch Videos in Home Page */}
            {videos.length > 0 && (
                <div className="bg-white dark:bg-[#161B22] p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                            <span className="bg-purple-500 w-1.5 h-5 rounded-full mr-2"></span>
                            Watch & Earn
                        </h2>
                        <button onClick={() => setActiveTab('tasks')} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-500">View All</button>
                    </div>
                    <div className="space-y-2">
                        {videos.filter(v => !v.endTime || new Date(v.endTime) > new Date()).slice(0, 5).map((video) => (
                            <TaskItem 
                                key={video.id}
                                icon={<BabyDogeIcon className="w-5 h-5" />} 
                                title={video.title}
                                reward={video.rewardPerSecond}
                                token={video.rewardToken}
                                tokenName={state.tokenConfigs[video.rewardToken]?.name || video.rewardToken}
                                endTime={video.endTime}
                                limit={video.limit}
                                claimCount={video.claimCount}
                                onClick={() => onVideoSelect(video)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomeView;
