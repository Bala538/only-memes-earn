
import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import HistoryIcon from '../icons/HistoryIcon';
import TelegramIcon from '../icons/TelegramIcon';
import { YouTubeIcon } from '../icons/YouTubeIcon';
import FacebookIcon from '../icons/FacebookIcon';
import InstagramIcon from '../icons/InstagramIcon';
import TwitterIcon from '../icons/TwitterIcon';
import TikTokIcon from '../icons/TikTokIcon';
import GameControllerIcon from '../icons/GameControllerIcon';
import PhotoIcon from '../icons/PhotoIcon';
import GiftIcon from '../icons/GiftIcon';
import TokenIcon from '../icons/TokenIcon';
import PickaxeIcon from '../icons/PickaxeIcon';
import AppStoreIcon from '../icons/AppStoreIcon';
import ParachuteIcon from '../icons/ParachuteIcon';
import DownloadIcon from '../icons/DownloadIcon';
import DashboardIcon from '../icons/DashboardIcon';
import UsersIcon from '../icons/UsersIcon';
import VideoIcon from '../icons/VideoIcon';
import ExchangeIcon from '../icons/ExchangeIcon';


export type AdminTab = 'dashboard' | 'markets' | 'ads' | 'users' | 'proofs' | 'withdrawals' | 'deposits' | 'tokens' | 'games' | 'mine' | 'banners' | 'promo' | 'airdrop' | 'settings' | 'youtube' | 'telegram' | 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'app_download' | 'other';

interface AdminTabsProps {
    activeTab: AdminTab;
    setActiveTab: (tab: AdminTab) => void;
}

const TabItem: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    isSpecial?: boolean;
    tooltip: string;
}> = ({ label, icon, isActive, onClick, isSpecial, tooltip }) => {
    const baseClasses = "flex items-center space-x-2 py-2 px-4 font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none whitespace-nowrap select-none";
    const activeClasses = "bg-white dark:bg-[#161B22] text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400";
    const inactiveClasses = "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white";
    const specialClasses = isSpecial ? "text-blue-400" : "";

    return (
        <Tooltip.Root delayDuration={300}>
            <Tooltip.Trigger asChild>
                <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${specialClasses}`}>
                    {icon}
                    <span className="hidden sm:inline">{label}</span>
                </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
                <Tooltip.Content 
                    className="z-50 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-gray-800 rounded shadow-lg border border-gray-700 dark:border-gray-600 animate-in fade-in zoom-in-95 duration-200"
                    sideOffset={5}
                    side="bottom"
                >
                    {tooltip}
                    <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-800" />
                </Tooltip.Content>
            </Tooltip.Portal>
        </Tooltip.Root>
    )
};

const AdminTabs: React.FC<AdminTabsProps> = ({ activeTab, setActiveTab }) => {
    return (
        <Tooltip.Provider>
            <nav className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto pb-px scrollbar-hide sticky top-0 bg-white dark:bg-[#0D1117] z-30 px-2">
                <TabItem 
                    label="Dashboard" 
                    icon={<DashboardIcon className="w-5 h-5"/>} 
                    isActive={activeTab === 'dashboard'} 
                    onClick={() => setActiveTab('dashboard')} 
                    tooltip="Overview of key metrics and recent activity"
                />
                <TabItem 
                    label="Markets" 
                    icon={<ExchangeIcon className="w-5 h-5"/>} 
                    isActive={activeTab === 'markets'} 
                    onClick={() => setActiveTab('markets')} 
                    tooltip="Manage market pairs"
                />
                <TabItem 
                    label="Games" 
                    icon={<GameControllerIcon className="w-5 h-5"/>} 
                    isActive={activeTab === 'games'} 
                    onClick={() => setActiveTab('games')} 
                    tooltip="Configure games and play-to-earn settings"
                />
                <TabItem 
                    label="YouTube" 
                    icon={<YouTubeIcon className="w-5 h-5"/>} 
                    isActive={activeTab === 'youtube'} 
                    onClick={() => setActiveTab('youtube')} 
                    tooltip="Manage YouTube subscription tasks"
                />
                <TabItem 
                    label="Telegram" 
                    icon={<TelegramIcon className="w-5 h-5"/>} 
                    isActive={activeTab === 'telegram'} 
                    onClick={() => setActiveTab('telegram')} 
                    tooltip="Manage Telegram channel join tasks"
                />
                <TabItem 
                    label="Facebook" 
                    icon={<FacebookIcon className="w-5 h-5"/>} 
                    isActive={activeTab === 'facebook'} 
                    onClick={() => setActiveTab('facebook')} 
                    tooltip="Manage Facebook page like tasks"
                />
                <TabItem 
                    label="Instagram" 
                    icon={<InstagramIcon className="w-5 h-5"/>} 
                    isActive={activeTab === 'instagram'} 
                    onClick={() => setActiveTab('instagram')} 
                    tooltip="Manage Instagram follow tasks"
                />
                <TabItem 
                    label="Twitter" 
                    icon={<TwitterIcon className="w-5 h-5"/>} 
                    isActive={activeTab === 'twitter'} 
                    onClick={() => setActiveTab('twitter')} 
                    tooltip="Manage Twitter follow tasks"
                />
                <TabItem 
                    label="TikTok" 
                    icon={<TikTokIcon className="w-5 h-5"/>} 
                    isActive={activeTab === 'tiktok'} 
                    onClick={() => setActiveTab('tiktok')} 
                    tooltip="Manage TikTok follow tasks"
                />
                <TabItem 
                    label="Apps" 
                    icon={<AppStoreIcon className="w-5 h-5"/>} 
                    isActive={activeTab === 'app_download'} 
                    onClick={() => setActiveTab('app_download')} 
                    tooltip="Manage app download tasks"
                />
                <TabItem 
                    label="Other" 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" /></svg>} 
                    isActive={activeTab === 'other'} 
                    onClick={() => setActiveTab('other')} 
                    tooltip="Manage other tasks"
                />
                
                <TabItem 
                    label="AdMob Monetize" 
                    isSpecial={true}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-500 animate-pulse"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>} 
                    isActive={activeTab === 'ads'} 
                    onClick={() => setActiveTab('ads')} 
                    tooltip="Configure AdMob settings and ad units"
                />
                
                <TabItem 
                    label="Mine Cards" 
                    icon={<PickaxeIcon className="w-5 h-5"/>} 
                    isActive={activeTab === 'mine'} 
                    onClick={() => setActiveTab('mine')} 
                    tooltip="Manage mining upgrades and cards"
                />
                <TabItem 
                    label="Banners" 
                    icon={<PhotoIcon className="w-5 h-5"/>} 
                    isActive={activeTab === 'banners'} 
                    onClick={() => setActiveTab('banners')} 
                    tooltip="Manage promotional banners"
                />
                <TabItem 
                    label="Promo" 
                    icon={<GiftIcon className="w-5 h-5"/>} 
                    isActive={activeTab === 'promo'} 
                    onClick={() => setActiveTab('promo')} 
                    tooltip="Create and manage promo codes"
                />
                <TabItem 
                    label="Airdrop" 
                    icon={<ParachuteIcon className="w-5 h-5"/>} 
                    isActive={activeTab === 'airdrop'} 
                    onClick={() => setActiveTab('airdrop')} 
                    tooltip="Configure airdrop settings"
                />
                
                <TabItem 
                    label="Users" 
                    icon={<UsersIcon className="w-5 h-5"/>} 
                    isActive={activeTab === 'users'} 
                    onClick={() => setActiveTab('users')} 
                    tooltip="View and manage user accounts"
                />
                <TabItem 
                    label="Proofs" 
                    icon={<CheckCircleIcon className="w-5 h-5"/>} 
                    isActive={activeTab === 'proofs'} 
                    onClick={() => setActiveTab('proofs')} 
                    tooltip="Review and approve task proofs"
                />
                <TabItem 
                    label="Withdrawals" 
                    icon={<HistoryIcon className="w-5 h-5"/>} 
                    isActive={activeTab === 'withdrawals'} 
                    onClick={() => setActiveTab('withdrawals')} 
                    tooltip="Process user withdrawal requests"
                />
                <TabItem 
                    label="Deposits" 
                    icon={<DownloadIcon className="w-5 h-5"/>} 
                    isActive={activeTab === 'deposits'} 
                    onClick={() => setActiveTab('deposits')} 
                    tooltip="View user deposit history"
                />
                <TabItem 
                    label="Tokens" 
                    icon={<TokenIcon token="BabyDoge" className="w-5 h-5"/>} 
                    isActive={activeTab === 'tokens'} 
                    onClick={() => setActiveTab('tokens')} 
                    tooltip="Manage supported cryptocurrencies"
                />
                <TabItem 
                    label="Settings" 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0 .55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107 1.204l-.527-.738a1.125 1.125 0 011.2-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} 
                    isActive={activeTab === 'settings'} 
                    onClick={() => setActiveTab('settings')} 
                    tooltip="Configure general app settings"
                />
            </nav>
        </Tooltip.Provider>
    );
};

export default AdminTabs;
