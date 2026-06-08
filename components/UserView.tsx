
import React, { useState } from 'react';
import { Video, ActiveTab } from '../types';
import WithdrawView from './WithdrawView';
import ProfileView from './ProfileView';
import BottomNav from './BottomNav';
import HomeView from './HomeView';
import VideosView from './VideosView';
import GamesView from './GamesView';
import ReferralView from './ReferralView';
import MarketsView from './MarketsView';

interface UserViewProps {
    onVideoSelect: (video: Video) => void;
}

const UserView: React.FC<UserViewProps> = ({ onVideoSelect }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('home');
    
    const renderContent = () => {
        switch(activeTab) {
            case 'home':
                return <HomeView onVideoSelect={onVideoSelect} setActiveTab={setActiveTab} />;
            case 'tasks':
                return <VideosView onVideoSelect={onVideoSelect} />;
            case 'games':
                return <GamesView />;
            case 'profile':
                return <ProfileView />;
            case 'exchange':
                return <WithdrawView />;
            case 'referral':
                return <ReferralView />;
            case 'markets':
                return <MarketsView />;
            default:
                return <HomeView onVideoSelect={onVideoSelect} setActiveTab={setActiveTab} />;
        }
    }

    return (
        <div className="pb-20"> {/* Padding for the bottom nav */}
            {renderContent()}
            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
    );
};

export default UserView;
