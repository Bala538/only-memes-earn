
import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Video, Token } from '../types';
import { triggerHapticFeedback } from '../utils/telegramUtils';

import CheckCircleIcon from './icons/CheckCircleIcon';
import ClockIcon from './icons/ClockIcon';
import TokenIcon from './icons/TokenIcon';
import { YouTubeIcon } from './icons/YouTubeIcon';
import TelegramIcon from './icons/TelegramIcon';
import FacebookIcon from './icons/FacebookIcon';
import InstagramIcon from './icons/InstagramIcon';
import TwitterIcon from './icons/TwitterIcon';
import TikTokIcon from './icons/TikTokIcon';
import AppStoreIcon from './icons/AppStoreIcon';
import RewardClaimedModal from './RewardClaimedModal';

interface VideosViewProps {
    onVideoSelect: (video: Video) => void;
}

const VideosView: React.FC<VideosViewProps> = ({ onVideoSelect }) => {
    const { state, submitVideoProof, claimTaskReward } = useContext(AppContext);
    const { 
        currentUser, adsConfig, 
        youtubeTasks, facebookTasks, 
        instagramTasks, twitterTasks, tiktokTasks, appDownloadTasks, otherTasks
    } = state;
    
    const [adRewardData, setAdRewardData] = useState<{show: boolean, amount: number, token: Token} | null>(null);
    const [claimingTask, setClaimingTask] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    
    const categories = ['All', 'YouTube', 'Telegram', 'Twitter', 'Facebook', 'Instagram', 'TikTok', 'App', 'Other'];

    // Pull to Refresh State
    const [pullStartY, setPullStartY] = useState(0);
    const [pullMoveY, setPullMoveY] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const PULL_THRESHOLD = 80;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (window.scrollY === 0) {
            setPullStartY(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (pullStartY > 0 && window.scrollY === 0) {
            const touchY = e.touches[0].clientY;
            const pull = touchY - pullStartY;
            if (pull > 0) {
                setPullMoveY(pull);
            }
        }
    };

    const handleTouchEnd = () => {
        if (pullMoveY > PULL_THRESHOLD) {
            setIsRefreshing(true);
            setTimeout(() => {
                setIsRefreshing(false);
                setPullMoveY(0);
                setPullStartY(0);
            }, 1500); // Simulate refresh delay
        } else {
            setPullMoveY(0);
            setPullStartY(0);
        }
    };

    const handleClaim = async (e: React.MouseEvent, taskId: string, taskType: string, reward: number, token: Token) => {
        e.stopPropagation();
        if (claimingTask) return;
        setClaimingTask(taskId);
        try {
            await claimTaskReward(taskId, taskType, reward, token);
            setAdRewardData({ show: true, amount: reward, token });
        } catch (error) {
            console.error("Claim failed", error);
            alert("Claim failed. Please try again.");
        } finally {
            setClaimingTask(null);
        }
    };

    if (!currentUser) return null;

    // Helper to render a list of tasks
    const renderTaskList = (
        title: string, 
        tasks: any[], 
        Icon: React.FC<any>, 
        iconColorClass: string, 
        borderColorClass: string, 
        taskType: string
    ) => {
        if (!tasks || tasks.length === 0) return null;

        return (
            <div className="animate-fade-in">
                <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center">
                    <span className={`w-1.5 h-6 rounded-full mr-3 ${iconColorClass.replace('text-', 'bg-')}`}></span>
                    {title}
                </h2>
                <div className="space-y-4">
                    {tasks.map(task => {
                        // Determine status based on task type proofs
                        let proof;
                        if (taskType === 'youtube') proof = currentUser.youtubeTaskProofs?.[task.id];
                        else if (taskType === 'telegram') proof = currentUser.telegramTaskProofs?.[task.id];
                        else if (taskType === 'facebook') proof = currentUser.facebookTaskProofs?.[task.id];
                        else if (taskType === 'instagram') proof = currentUser.instagramTaskProofs?.[task.id];
                        else if (taskType === 'twitter') proof = currentUser.twitterTaskProofs?.[task.id];
                        else if (taskType === 'tiktok') proof = currentUser.tiktokTaskProofs?.[task.id];
                        else if (taskType === 'app_download') proof = currentUser.appDownloadTaskProofs?.[task.id];
                        else if (taskType === 'other') proof = currentUser.otherTaskProofs?.[task.id];

                        const isClaimed = proof?.status === 'claimed';
                        const isApproved = proof?.status === 'approved';
                        const isPending = proof?.status === 'pending' || proof?.status === 'processing';
                        const isRejected = proof?.status === 'rejected';

                        return (
                            <div 
                                key={task.id} 
                                onClick={() => {
                                    if (!isClaimed && !isPending && !isApproved) {
                                        triggerHapticFeedback('light');
                                        onVideoSelect({...task, taskType});
                                    }
                                }} 
                                className={`bg-white dark:bg-[#161B22] p-5 rounded-[2rem] border ${isClaimed ? 'border-green-500/30 opacity-70' : 'border-gray-100 dark:border-gray-700'} flex justify-between items-center cursor-pointer hover:shadow-xl transition-all hover:scale-[1.01] active:scale-95 group relative overflow-hidden gap-4`}
                            >
                                <div className="flex items-center space-x-4 relative z-10 min-w-0 flex-1">
                                    <div className={`p-3 rounded-2xl shrink-0 transition-colors ${isClaimed ? 'bg-green-100 dark:bg-green-900/20' : `bg-gray-50 dark:bg-gray-800 ${borderColorClass}`}`}>
                                        {isClaimed ? <CheckCircleIcon className="w-7 h-7 text-green-500" /> : <Icon className={`w-7 h-7 ${iconColorClass}`} />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight truncate">{task.title}</h4>
                                        <div className="flex flex-wrap items-center mt-1.5 gap-1.5">
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-tighter flex items-center whitespace-nowrap">
                                                <TokenIcon token={task.rewardToken} className="w-3 h-3 mr-1" />
                                                {task.reward.toLocaleString()} {state.tokenConfigs[task.rewardToken]?.name || task.rewardToken}
                                            </div>
                                            {task.timerInSeconds > 0 && (
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter flex items-center bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                    <ClockIcon className="w-3 h-3 mr-1" />
                                                    {Math.floor(task.timerInSeconds / 60).toString().padStart(2, '0')}:{(task.timerInSeconds % 60).toString().padStart(2, '0')}
                                                </div>
                                            )}
                                            {task.endTime && (
                                                <div className="text-[10px] font-bold text-red-400 uppercase tracking-tighter flex items-center bg-red-400/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                    Expires: {new Date(task.endTime).toLocaleDateString()}
                                                </div>
                                            )}
                                            {task.limit && task.limit > 0 && (
                                                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-tighter flex items-center bg-purple-400/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                    {task.claimCount || 0}/{task.limit} Claims
                                                </div>
                                            )}
                                            {isPending && <span className="text-[10px] text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded whitespace-nowrap">Pending</span>}
                                            {isRejected && <span className="text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded whitespace-nowrap">Rejected</span>}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="shrink-0">
                                    {isApproved ? (
                                        <button 
                                            onClick={(e) => handleClaim(e, task.id, taskType, task.reward, task.rewardToken)}
                                            disabled={claimingTask === task.id}
                                            className="text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest border bg-yellow-500 hover:bg-yellow-400 text-black border-yellow-500 animate-pulse shadow-lg shadow-yellow-500/30"
                                        >
                                            {claimingTask === task.id ? '...' : 'Claim'}
                                        </button>
                                    ) : (
                                        <span className={`text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest border transition-all ${
                                            isClaimed 
                                            ? 'bg-green-500 text-white border-green-500' 
                                            : isPending
                                                ? 'bg-blue-500 text-white border-blue-500'
                                                : isRejected
                                                    ? 'bg-red-500 text-white border-red-500'
                                                    : proof?.status === 'started'
                                                        ? 'bg-yellow-500 text-white border-yellow-500'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                                        }`}>
                                            {isClaimed ? 'Done' : isPending ? 'Wait' : isRejected ? 'Redo' : proof?.status === 'started' ? 'Verify' : 'Start'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div 
            className="pt-20 pb-24 px-4 space-y-8 max-w-screen-md mx-auto relative min-h-screen"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull to Refresh Indicator */}
            {(pullMoveY > 0 || isRefreshing) && (
                <div 
                    className="absolute top-20 left-0 right-0 flex justify-center items-center z-50 pointer-events-none transition-transform duration-200"
                    style={{ transform: `translateY(${Math.min(pullMoveY * 0.5, 100)}px)` }}
                >
                    <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border border-gray-200 dark:border-gray-700">
                        {isRefreshing ? (
                            <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className={`h-6 w-6 text-blue-500 transition-transform duration-200 ${pullMoveY > PULL_THRESHOLD ? 'rotate-180' : ''}`} 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        )}
                    </div>
                </div>
            )}

            {adRewardData && (
                <RewardClaimedModal 
                    isOpen={adRewardData.show} 
                    onClose={() => setAdRewardData(null)} 
                    reward={adRewardData.amount} 
                    token={adRewardData.token} 
                />
            )}

            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Earning Hub</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Power up your wallet with Videos & Tasks</p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-900 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm shadow-sm"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Category Filter */}
            <div className="flex overflow-x-auto pb-4 space-x-2 no-scrollbar mb-4">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                            activeCategory === cat 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>




            


            {/* YouTube Tasks */}
            {(activeCategory === 'All' || activeCategory === 'YouTube') && renderTaskList("YouTube Bounty", youtubeTasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) && (!t.endTime || new Date(t.endTime) > new Date())), YouTubeIcon, "text-red-600", "group-hover:bg-red-600", "youtube")}

            {/* Telegram Tasks */}
            {(activeCategory === 'All' || activeCategory === 'Telegram') && renderTaskList("Telegram Tasks", state.telegramTasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) && (!t.endTime || new Date(t.endTime) > new Date())), TelegramIcon, "text-blue-500", "group-hover:bg-blue-500", "telegram")}

            {/* Twitter Tasks */}
            {(activeCategory === 'All' || activeCategory === 'Twitter') && renderTaskList("X (Twitter) Tasks", twitterTasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) && (!t.endTime || new Date(t.endTime) > new Date())), TwitterIcon, "text-sky-500", "group-hover:bg-sky-500", "twitter")}

            {/* Facebook Tasks */}
            {(activeCategory === 'All' || activeCategory === 'Facebook') && renderTaskList("Facebook Tasks", facebookTasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) && (!t.endTime || new Date(t.endTime) > new Date())), FacebookIcon, "text-blue-700", "group-hover:bg-blue-700", "facebook")}

            {/* Instagram Tasks */}
            {(activeCategory === 'All' || activeCategory === 'Instagram') && renderTaskList("Instagram Tasks", instagramTasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) && (!t.endTime || new Date(t.endTime) > new Date())), InstagramIcon, "text-pink-600", "group-hover:bg-pink-600", "instagram")}



            {/* TikTok Tasks */}
            {(activeCategory === 'All' || activeCategory === 'TikTok') && renderTaskList("TikTok Tasks", tiktokTasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) && (!t.endTime || new Date(t.endTime) > new Date())), TikTokIcon, "text-gray-900 dark:text-white", "group-hover:bg-black", "tiktok")}

            {/* App Downloads */}
            {(activeCategory === 'All' || activeCategory === 'App') && renderTaskList("App Downloads", appDownloadTasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) && (!t.endTime || new Date(t.endTime) > new Date())), AppStoreIcon, "text-green-600", "group-hover:bg-green-600", "app_download")}

            {/* Other Tasks */}
            {(activeCategory === 'All' || activeCategory === 'Other') && renderTaskList("Other Tasks", otherTasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) && (!t.endTime || new Date(t.endTime) > new Date())), () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" /></svg>, "text-gray-600 dark:text-gray-400", "group-hover:bg-gray-600", "other")}
        </div>
    );
};

export default VideosView;
