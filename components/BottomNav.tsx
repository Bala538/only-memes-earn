
import React from 'react';
import HomeIcon from './icons/HomeIcon';
import ProfileIcon from './icons/ProfileIcon';
import VideoIcon from './icons/VideoIcon';
import ExchangeIcon from './icons/ExchangeIcon';
import GameControllerIcon from './icons/GameControllerIcon';
import { ActiveTab } from '../types';

interface BottomNavProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
}

const NavItem: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-full py-1 transition-colors duration-200 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
            <div className={`p-1 rounded-md ${isActive ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}>
                {React.cloneElement(icon as React.ReactElement, { 
                    className: `w-6 h-6 ${isActive ? 'stroke-[2px]' : 'stroke-1.5'}` 
                })}
            </div>
            <span className="text-[10px] font-medium mt-0.5">
                {label}
            </span>
        </button>
    );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#161B22] border-t border-gray-200 dark:border-gray-800 shadow-lg pb-safe">
            <div className="max-w-screen-md mx-auto px-2 py-2 flex justify-between items-center">
                <NavItem
                    label="Home"
                    icon={<HomeIcon />}
                    isActive={activeTab === 'home'}
                    onClick={() => setActiveTab('home')}
                />
                <NavItem
                    label="Videos"
                    icon={<VideoIcon />}
                    isActive={activeTab === 'tasks'}
                    onClick={() => setActiveTab('tasks')}
                />
                 <NavItem
                    label="Games"
                    icon={<GameControllerIcon />}
                    isActive={activeTab === 'games'}
                    onClick={() => setActiveTab('games')}
                />
                <NavItem
                    label="Exchange"
                    icon={<ExchangeIcon />}
                    isActive={activeTab === 'exchange'}
                    onClick={() => setActiveTab('exchange')}
                />
                 <NavItem
                    label="Profile"
                    icon={<ProfileIcon />}
                    isActive={activeTab === 'profile'}
                    onClick={() => setActiveTab('profile')}
                />
            </div>
        </div>
    );
};

export default BottomNav;
