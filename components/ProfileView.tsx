
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import UsersIcon from './icons/UsersIcon';
import HistoryIcon from './icons/HistoryIcon';
import { Proof } from '../types';
import VideoIcon from './icons/VideoIcon';
import { YouTubeIcon } from './icons/YouTubeIcon';
import TelegramIcon from './icons/TelegramIcon';
import FacebookIcon from './icons/FacebookIcon';
import InstagramIcon from './icons/InstagramIcon';
import TwitterIcon from './icons/TwitterIcon';
import TikTokIcon from './icons/TikTokIcon';
import AppStoreIcon from './icons/AppStoreIcon';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import SupportIcon from './icons/SupportIcon';
import InfoIcon from './icons/InfoIcon';
import GiftIcon from './icons/GiftIcon';
import ParachuteIcon from './icons/ParachuteIcon';
import { requestNotificationPermission, db, doc, setDoc } from '../firebaseConfig';
import AboutModal from './AboutModal';
import RewardClaimedModal from './RewardClaimedModal';

type TaskType = 'video' | 'youtube' | 'telegram' | 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'app_download' | 'other';

const ProofStatusBadge: React.FC<{ status: Proof['status'] }> = ({ status }) => {
    const statusStyles = {
        pending: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
        processing: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse',
        approved: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        rejected: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        claimed: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
    };
    const safeStatus = status || 'pending';
    const textMap = {
        pending: 'Pending',
        processing: 'Processing',
        approved: 'Completed',
        rejected: 'Rejected',
        claimed: 'Claimed'
    };
    const text = textMap[safeStatus] || safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);
    return (
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${statusStyles[safeStatus] || statusStyles.pending}`}>
            {text}
        </span>
    );
};

const TaskTypeIcon: React.FC<{ type: TaskType }> = ({ type }) => {
    switch (type) {
        case 'video': return <VideoIcon className="w-5 h-5 text-gray-400" />;
        case 'youtube': return <YouTubeIcon className="w-5 h-5 text-red-500" />;
        case 'telegram': return <TelegramIcon className="w-5 h-5 text-blue-500" />;
        case 'facebook': return <FacebookIcon className="w-5 h-5" />;
        case 'instagram': return <InstagramIcon className="w-5 h-5" />;
        case 'twitter': return <TwitterIcon className="w-5 h-5 text-sky-500" />;
        case 'tiktok': return <TikTokIcon className="w-5 h-5 text-gray-900 dark:text-white" />;
        case 'app_download': return <AppStoreIcon className="w-5 h-5 text-green-500" />;
        case 'other': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" /></svg>;
        default: return null;
    }
};

const ProfileView: React.FC = () => {
    const { state, redeemPromoCode, toggleTheme, submitAirdropAddress, updateProfile } = useContext(AppContext);
    const { currentUser, theme, airdropConfig } = state;

    const [promoCode, setPromoCode] = useState('');
    const [promoStatus, setPromoStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [promoMessage, setPromoMessage] = useState('');
    const [rewardModalData, setRewardModalData] = useState<{show: boolean, reward: number, token: any} | null>(null);

    const [showAboutModal, setShowAboutModal] = useState(false);

    const [airdropWallet, setAirdropWallet] = useState('');
    const [isSubmittingWallet, setIsSubmittingWallet] = useState(false);

    const [notificationStatus, setNotificationStatus] = useState<'idle' | 'requesting' | 'enabled' | 'denied'>('idle');

    const handleEnableNotifications = async () => {
        setNotificationStatus('requesting');
        const token = await requestNotificationPermission();
        if (token && currentUser) {
            try {
                const userFCMRef = doc(db, 'users', currentUser.uid, 'fcm', 'token');
                await setDoc(userFCMRef, { token, updatedAt: Date.now() }, { merge: true });
                setNotificationStatus('enabled');
            } catch (err) {
                console.error("Error saving token", err);
                setNotificationStatus('idle');
            }
        } else {
            setNotificationStatus('denied');
        }
    };

    const allProofs = useMemo(() => {
        if (!currentUser) return [];
        type AggregatedProof = Proof & { taskType: TaskType };
        const proofs: AggregatedProof[] = [];
        const processProofs = (proofRecord: Record<string, Proof> | undefined, taskType: TaskType) => {
            if (!proofRecord) return;
            for (const p of Object.values(proofRecord)) {
                proofs.push({ ...p, taskType });
            }
        };
        processProofs(currentUser.videoProofs, 'video');
        processProofs(currentUser.youtubeTaskProofs, 'youtube');
        processProofs(currentUser.telegramTaskProofs, 'telegram');
        processProofs(currentUser.facebookTaskProofs, 'facebook');
        processProofs(currentUser.instagramTaskProofs, 'instagram');
        processProofs(currentUser.twitterTaskProofs, 'twitter');
        processProofs(currentUser.tiktokTaskProofs, 'tiktok');
        processProofs(currentUser.appDownloadTaskProofs, 'app_download');
        processProofs(currentUser.otherTaskProofs, 'other');
        return proofs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }, [currentUser]);

    if (!currentUser) return null;

    const handleRedeemPromo = async () => {
        if (!promoCode.trim()) return;
        setPromoStatus('processing');
        setPromoMessage('');
        try {
            const result = await redeemPromoCode(promoCode.trim());
            setPromoStatus('success');
            setPromoCode('');
            setRewardModalData({ show: true, reward: result.reward, token: result.token });
        } catch (err: any) {
            setPromoStatus('error');
            setPromoMessage(err.message);
        }
    };
    
    const handleAirdropSubmit = async () => {
        if (!airdropWallet.trim()) return;
        setIsSubmittingWallet(true);
        await submitAirdropAddress(airdropWallet.trim());
        setIsSubmittingWallet(false);
    };

    // Referral Stats Data
    const totalReferrals = currentUser.referralStats?.totalReferrals ?? 0;
    const earnedTokens = currentUser.referralStats?.totalEarned || {};
    const hasEarnings = Object.keys(earnedTokens).length > 0;

    const displayEmail = currentUser.email || 'User';
    const displayInitial = (currentUser.displayName || displayEmail).charAt(0).toUpperCase();

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editDisplayName, setEditDisplayName] = useState(currentUser.displayName || '');
    const [editPhotoURL, setEditPhotoURL] = useState(currentUser.photoURL || '');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    const MAX_DIM = 256; 
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > MAX_DIM) {
                            height *= MAX_DIM / width;
                            width = MAX_DIM;
                        }
                    } else {
                        if (height > MAX_DIM) {
                            width *= MAX_DIM / height;
                            height = MAX_DIM;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        setEditPhotoURL(dataUrl);
                    }
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        try {
            await updateProfile(editDisplayName, editPhotoURL);
            setIsEditingProfile(false);
        } catch (error) {
            console.error("Failed to update profile", error);
        } finally {
            setIsSavingProfile(false);
        }
    };

    return (
        <div className="pt-20 pb-32 px-4 max-w-2xl mx-auto space-y-6">
            {rewardModalData && (
                <RewardClaimedModal 
                    isOpen={rewardModalData.show} 
                    onClose={() => setRewardModalData(null)} 
                    reward={rewardModalData.reward} 
                    token={rewardModalData.token} 
                />
            )}
            
            {/* Profile Header */}
            <div className="flex flex-col items-center mb-8 relative">
                {isEditingProfile ? (
                    <div className="w-full max-w-sm bg-white dark:bg-[#161B22] p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Edit Profile</h3>
                        
                        <div className="flex flex-col items-center mb-4">
                            <div className="relative group cursor-pointer">
                                {editPhotoURL ? (
                                    <img src={editPhotoURL} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-purple-500/30" />
                                ) : (
                                    <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-4xl font-bold text-gray-600 dark:text-gray-300 border-4 border-purple-500/30">
                                        {displayInitial}
                                    </div>
                                )}
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                    </svg>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
                                </label>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Click to change photo</p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Display Name</label>
                            <input 
                                type="text" 
                                value={editDisplayName}
                                onChange={(e) => setEditDisplayName(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="Enter display name"
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button 
                                onClick={() => setIsEditingProfile(false)}
                                className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {isSavingProfile ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <button 
                            onClick={() => {
                                setEditDisplayName(currentUser.displayName || '');
                                setEditPhotoURL(currentUser.photoURL || '');
                                setIsEditingProfile(true);
                            }}
                            className="absolute top-0 right-0 p-2 text-gray-400 hover:text-purple-500 transition-colors bg-white dark:bg-[#161B22] rounded-full shadow-sm border border-gray-100 dark:border-gray-700"
                            title="Edit Profile"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                        </button>
                        {currentUser.photoURL ? (
                            <img src={currentUser.photoURL} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-purple-500/30 mb-3 shadow-md" />
                        ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-3 shadow-md border-2 border-white/10">
                                {displayInitial}
                            </div>
                        )}
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentUser.displayName || displayEmail}</h2>
                        {currentUser.displayName && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{displayEmail}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">UID: {currentUser.uid || 'N/A'}</p>
                            <button onClick={() => navigator.clipboard.writeText(currentUser.uid || '')} className="text-gray-400 hover:text-purple-500 transition-colors p-1 bg-gray-100 dark:bg-gray-800 rounded">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Referral Stats Card */}
            <div className="bg-white dark:bg-[#161B22] rounded-md shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <UsersIcon className="w-5 h-5 mr-2 text-gray-400"/> Referral Stats
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalReferrals}</p>
                        <p className="text-sm text-gray-500">Friends Invited</p>
                    </div>
                    <div>
                        {hasEarnings ? (
                            Object.entries(earnedTokens).map(([token, amount]) => (
                                <div key={token}>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{amount.toLocaleString()}</p>
                                    <p className="text-sm text-gray-500">{state.tokenConfigs[token]?.name || token} Earned</p>
                                </div>
                            ))
                        ) : (
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                                <p className="text-sm text-gray-500">Rewards Earned</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Airdrop Section */}
            {airdropConfig.isActive && (
                <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl shadow-lg border border-purple-500/30 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <ParachuteIcon className="w-24 h-24 text-white" />
                    </div>
                    <div className="p-6 relative z-10">
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="bg-white/10 p-2 rounded-md backdrop-blur-sm">
                                <ParachuteIcon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-xl text-white">{airdropConfig.title}</h3>
                        </div>
                        <p className="text-indigo-200 text-sm mb-4 max-w-[85%] leading-relaxed">
                            {airdropConfig.description}
                        </p>
                        {airdropConfig.imageUrl && (
                            <div className="mb-4 rounded-md overflow-hidden border border-white/10 shadow-inner bg-black/20">
                                <img src={airdropConfig.imageUrl} alt="Airdrop" className="w-full h-32 object-cover" />
                            </div>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-block bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10 animate-pulse">
                                {airdropConfig.date ? new Date(airdropConfig.date).toLocaleString() : 'Coming Soon'}
                            </div>
                        </div>

                        {airdropConfig.allowAddressSubmission && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                {currentUser.airdropAddress ? (
                                    <div className="bg-green-500/20 border border-green-500/30 p-3 rounded-md">
                                        <p className="text-green-300 text-xs font-bold mb-1 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mr-1"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                            Address Submitted
                                        </p>
                                        <p className="text-gray-900 dark:text-white font-mono text-xs break-all">{currentUser.airdropAddress}</p>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Enter Wallet Address" 
                                            value={airdropWallet} 
                                            onChange={e => setAirdropWallet(e.target.value)}
                                            className="flex-grow bg-white/10 text-gray-900 dark:text-white placeholder-indigo-300 text-xs p-2 rounded-md border border-white/10 focus:outline-none focus:bg-white/20"
                                        />
                                        <button 
                                            onClick={handleAirdropSubmit}
                                            disabled={isSubmittingWallet || !airdropWallet}
                                            className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold px-3 py-2 rounded-md transition-colors disabled:opacity-50"
                                        >
                                            {isSubmittingWallet ? '...' : 'Submit'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Promo Code Section */}
            <div className="bg-white dark:bg-[#161B22] rounded-md shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-4">
                    <div className="flex items-center space-x-2 mb-3">
                        <GiftIcon className="w-5 h-5 text-pink-500" />
                        <h3 className="font-bold text-gray-900 dark:text-white">Promo Code</h3>
                    </div>
                    <div className="flex space-x-2">
                        <input 
                            type="text" 
                            placeholder="Enter promo code" 
                            value={promoCode} 
                            onChange={e => setPromoCode(e.target.value)}
                            className="flex-grow bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 rounded-md text-sm border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 outline-none"
                        />
                        <button onClick={handleRedeemPromo} disabled={promoStatus === 'processing' || !promoCode} className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed">
                            Claim
                        </button>
                    </div>
                    {promoMessage && <p className={`text-xs mt-2 font-medium ${promoStatus === 'error' ? 'text-red-500' : 'text-green-500'}`}>{promoMessage}</p>}
                </div>
            </div>

            {/* Settings Group */}
            <div className="bg-white dark:bg-[#161B22] rounded-md shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                            {theme === 'dark' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">Dark Mode</span>
                    </div>
                    <button 
                        onClick={toggleTheme}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-purple-600' : 'bg-gray-200'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                </div>
                <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                            </svg>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">Push Notifications</span>
                    </div>
                    {notificationStatus === 'enabled' ? (
                        <span className="text-xs font-bold text-green-500 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">Enabled</span>
                    ) : notificationStatus === 'denied' ? (
                        <span className="text-xs font-bold text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">Denied</span>
                    ) : (
                        <button onClick={handleEnableNotifications} disabled={notificationStatus === 'requesting'} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-sm disabled:bg-gray-400">
                            {notificationStatus === 'requesting' ? '...' : 'Enable'}
                        </button>
                    )}
                </div>
                <a href="mailto:support@example.com" className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"><SupportIcon className="w-5 h-5"/></div>
                        <span className="font-medium text-gray-900 dark:text-white">Support</span>
                    </div>
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </a>
                <button onClick={() => setShowAboutModal(true)} className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"><InfoIcon className="w-5 h-5"/></div>
                        <span className="font-medium text-gray-900 dark:text-white">About</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </button>
            </div>
            {showAboutModal && <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />}


            {/* Proof History */}
            <div className="bg-white dark:bg-[#161B22] rounded-md shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center"><HistoryIcon className="w-5 h-5 mr-2 text-gray-400"/> My Submission History</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {allProofs.length > 0 ? allProofs.map(proof => {
                        const submittedDate = new Date(proof.submittedAt);
                        const displayDate = !isNaN(submittedDate.getTime()) ? submittedDate.toLocaleDateString() : 'Invalid Date';
                        
                        return (
                            <div key={`${proof.taskType}-${proof.submittedAt}-${proof.taskTitle}`} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    <div className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-sm"><TaskTypeIcon type={proof.taskType} /></div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-white line-clamp-1">{proof.taskTitle}</p>
                                        <p className="text-xs text-gray-500">{displayDate}</p>
                                    </div>
                                </div>
                                <ProofStatusBadge status={proof.status} />
                            </div>
                        );
                    }) : (
                        <p className="text-center text-gray-500 text-sm py-4">No tasks submitted yet.</p>
                    )}
                </div>
            </div>

        </div>
    );
};

export default ProfileView;
