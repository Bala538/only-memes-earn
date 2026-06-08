
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from './context/AppContext';
import { AppProvider } from './context/AppProvider';
import Header from './components/Header';
import UserView from './components/UserView';
import AdminDashboard from './components/AdminDashboard';
import { Video } from './types';
import VideoPlayerPage from './components/VideoPlayerPage';
import ImagePreviewModal from './components/ImagePreviewModal';
import AuthView from './components/AuthView';
import MaintenanceView from './components/MaintenanceView';
import { GamePlayer } from './components/GamePlayer';
import TaskProofModal from './components/TaskProofModal';
import AdModal from './components/AdModal';
import InstallPWA from './components/InstallPWA';

import LoadingScreen from './components/LoadingScreen';

import ErrorBoundary from './components/ErrorBoundary';

const AppContent: React.FC = () => {
    const { state, dispatch, closeGame, logout } = useContext(AppContext);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [selectedSocialTask, setSelectedSocialTask] = useState<Video | null>(null);
    const [bypassMaintenance, setBypassMaintenance] = useState(false);

    if (state.loading) {
        return <LoadingScreen />;
    }

    const handleTaskSelect = (task: Video) => {
        // Route to different components based on task type
        // Treat undefined taskType as 'video' (standard admin uploaded videos)
        if (!task.taskType || task.taskType === 'video' || task.taskType === 'youtube') {
            setSelectedVideo(task);
        } else {
            setSelectedSocialTask(task);
        }
    };
    
    const handleClosePlayer = () => setSelectedVideo(null);
    const handleCloseSocialModal = () => setSelectedSocialTask(null);
    
    const handleCloseImagePreview = () => {
        dispatch({ type: 'HIDE_IMAGE_PREVIEW' });
    }

    const isMaintenance = state.authConfig?.maintenanceMode;
    const isAdmin = state.currentUser?.isAdmin;

    if (isMaintenance && !isAdmin) {
        if (!state.currentUser && bypassMaintenance) {
            return <AuthView />;
        }
        return <MaintenanceView 
            message={state.authConfig?.maintenanceMessage} 
            onAdminLogin={() => {
                if (state.currentUser) {
                    logout();
                }
                setBypassMaintenance(true);
            }} 
            showAdminButton={!state.currentUser}
            onLogout={logout}
        />;
    }

    if (!state.currentUser) {
        return <AuthView />;
    }

    let content;

    if (state.isAdminView) {
        content = (
             <div className="min-h-screen bg-gray-100 dark:bg-[#0D1117] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
                <Header />
                <main className="p-4 pt-20">
                    <AdminDashboard />
                </main>
            </div>
        );
    } else if (state.playingGame) {
        content = <GamePlayer game={state.playingGame} onBack={closeGame} />;
    } else if (selectedVideo) {
        content = <VideoPlayerPage video={selectedVideo} onBack={handleClosePlayer} />;
    } else {
        content = (
            <div className="min-h-screen bg-gray-100 dark:bg-[#0D1117] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
                <Header />
                <main>
                    <ErrorBoundary>
                        <UserView onVideoSelect={handleTaskSelect} />
                    </ErrorBoundary>
                </main>
            </div>
        );
    }

    return (
        <>
            {content}
            {selectedSocialTask && (
                <TaskProofModal task={selectedSocialTask} onClose={handleCloseSocialModal} />
            )}
            {state.imagePreview.visible && (
                <ImagePreviewModal imageUrl={state.imagePreview.imageUrl} onClose={handleCloseImagePreview} />
            )}
            <AdModal />
            <InstallPWA />
        </>
    );
};

import { App as CapApp } from '@capacitor/app';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import OfflinePage from './components/OfflinePage';

const App: React.FC = () => {
    const isOnline = useOnlineStatus();

    React.useEffect(() => {
        CapApp.addListener('backButton', ({ canGoBack }) => {
            if (!canGoBack) {
                CapApp.exitApp();
            } else {
                window.history.back();
            }
        });
    }, []);

    return (
        <AppProvider>
            {isOnline ? <AppContent /> : <OfflinePage />}
        </AppProvider>
    );
};

export default App;
