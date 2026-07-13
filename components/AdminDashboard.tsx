
import React, { useState } from 'react';
import AdminTabs, { AdminTab } from './admin/AdminTabs';
import WithdrawalManager from './admin/WithdrawalManager';
import YouTubeTaskManager from './admin/YouTubeTaskManager';
import ProofVerifier from './admin/ProofVerifier';
import FacebookTaskManager from './admin/FacebookTaskManager';
import InstagramTaskManager from './admin/InstagramTaskManager';
import TwitterTaskManager from './admin/TwitterTaskManager';
import TikTokTaskManager from './admin/TikTokTaskManager';
import AppDownloadTaskManager from './admin/AppDownloadTaskManager';
import OtherTaskManager from './admin/OtherTaskManager';
import GameManager from './admin/GameManager';
import BannerManager from './admin/BannerManager';
import PromoCodeManager from './admin/PromoCodeManager';
import TokenManager from './admin/TokenManager';
import MineComboManager from './admin/MineComboManager';
import AirdropManager from './admin/AirdropManager';
import DepositManager from './admin/DepositManager';
import Dashboard from './admin/Dashboard';
import UserManager from './admin/UserManager';
import AuthSettingsManager from './admin/AuthSettingsManager';
import AdminPriceControl from './AdminPriceControl';
import MarketManager from './admin/MarketManager';
import VerificationQueue from './admin/VerificationQueue';
import ActivityLogs from './admin/ActivityLogs';

import { YouTubeIcon } from './icons/YouTubeIcon';
import FacebookIcon from './icons/FacebookIcon';
import InstagramIcon from './icons/InstagramIcon';
import TwitterIcon from './icons/TwitterIcon';
import TikTokIcon from './icons/TikTokIcon';
import AppStoreIcon from './icons/AppStoreIcon';

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

    const taskTypes = [
        { id: 'youtube', label: 'YouTube', icon: <YouTubeIcon className="w-5 h-5 text-red-500" /> },
        { id: 'facebook', label: 'Facebook', icon: <FacebookIcon className="w-5 h-5 text-blue-600" /> },
        { id: 'instagram', label: 'Instagram', icon: <InstagramIcon className="w-5 h-5 text-pink-500" /> },
        { id: 'twitter', label: 'Twitter', icon: <TwitterIcon className="w-5 h-5 text-blue-400" /> },
        { id: 'tiktok', label: 'TikTok', icon: <TikTokIcon className="w-5 h-5 text-black dark:text-white" /> },
        { id: 'app_download', label: 'Apps', icon: <AppStoreIcon className="w-5 h-5 text-green-500" /> },
        { id: 'other', label: 'Other', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" /></svg> }
    ];

    const isTaskTab = taskTypes.some(t => t.id === activeTab);

    const renderContent = () => {
        switch(activeTab) {
            case 'dashboard':
                return <Dashboard setActiveTab={setActiveTab} />;
            case 'markets':
                return <MarketManager />;
            case 'settings':
                return (
                    <div className="space-y-6">
                        <AuthSettingsManager />
                        <AdminPriceControl />
                    </div>
                );
            case 'users':
                return <UserManager />;
            case 'proofs':
                return <ProofVerifier />;
            case 'verification-queue':
                return <VerificationQueue />;
            case 'logs':
                return <ActivityLogs />;
            case 'withdrawals':
                return <WithdrawalManager />;
            case 'deposits':
                return <DepositManager />;
            case 'tokens':
                return <TokenManager />;
            case 'mine':
                return <MineComboManager />;
            case 'airdrop':
                return <AirdropManager />;
            case 'games':
                return <GameManager />;
            case 'banners':
                return <BannerManager />;
            case 'promo':
                return <PromoCodeManager />;
            case 'youtube':
                return <YouTubeTaskManager />;
            case 'facebook':
                return <FacebookTaskManager />;
            case 'instagram':
                return <InstagramTaskManager />;
            case 'twitter':
                return <TwitterTaskManager />;
            case 'tiktok':
                return <TikTokTaskManager />;
            case 'app_download':
                return <AppDownloadTaskManager />;
            case 'other':
                return <OtherTaskManager />;
            default:
                return <Dashboard setActiveTab={setActiveTab} />;
        }
    }

    return (
        <div>
            <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            
            {isTaskTab && (
                <div className="mt-6 bg-white dark:bg-[#161B22] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Task Managers</h3>
                    <div className="flex flex-wrap gap-2">
                        {taskTypes.map(task => (
                            <button
                                key={task.id}
                                onClick={() => setActiveTab(task.id as AdminTab)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                    activeTab === task.id 
                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800' 
                                        : 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                {task.icon}
                                {task.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-6">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminDashboard;
