
import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Video } from '../types';
import TokenIcon from './icons/TokenIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import HistoryIcon from './icons/HistoryIcon';
import UploadIcon from './icons/UploadIcon';
import RewardClaimedModal from './RewardClaimedModal';
import { getYouTubeId } from '../utils/youtube';

interface VideoPlayerProps {
    video: Video;
    onBack?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
    const { 
        state, submitVideoProof, submitYouTubeProof, uploadProofAttachment, triggerAd, claimTaskReward
    } = useContext(AppContext);
    const { currentUser } = state;
    
    const [timeLeft, setTimeLeft] = useState(video.timerInSeconds || 60);
    const [canClaim, setCanClaim] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [claimError, setClaimError] = useState('');
    const [secretCodeInput, setSecretCodeInput] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState<'submit' | 'claim' | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getProofForTask = () => {
        if (!currentUser) return undefined;
        if (video.taskType === 'youtube') {
            return currentUser.youtubeTaskProofs?.[video.id];
        }
        return currentUser.videoProofs?.[video.id];
    }
    const proof = useMemo(getProofForTask, [currentUser, video.id, video.taskType]);

    const isPending = proof?.status === 'pending' || proof?.status === 'processing';
    const isApproved = proof?.status === 'approved';
    const isClaimed = proof?.status === 'claimed';
    const isRejected = proof?.status === 'rejected';
    const isCompleted = isClaimed; // Only truly completed if claimed

    const verificationMethod = video.verificationMethod || 'timer';
    const needsCode = verificationMethod === 'code';
    const needsScreenshot = verificationMethod === 'screenshot' || verificationMethod === 'both'; 

    useEffect(() => {
        if (!isCompleted && !isApproved && !isPending && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setCanClaim(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
        if (isCompleted || isPending || isApproved) {
            setCanClaim(true); 
            setTimeLeft(0);
        }
    }, [isCompleted, isPending, isApproved, timeLeft]);

    const isPlayableVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

    const youtubeId = getYouTubeId(video.url);
    const isVideoFile = isPlayableVideo(video.url);
    const displayReward = video.rewardPerSecond * 60;

    const handleUploadTrigger = () => {
        if (!canClaim || isCompleted || isPending || isApproved) return;
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setClaimError('Please upload an image file.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setClaimError('File size too large (Max 10MB).');
            return;
        }
        setIsSubmitting(true);
        setClaimError('');
        setUploadProgress(0);

        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 95) return 95;
                return prev + Math.floor(Math.random() * 10) + 2;
            });
        }, 200);

        let url = '';
        try {
            url = await uploadProofAttachment(file);
            clearInterval(progressInterval);
            setUploadProgress(100);
        } catch (error: any) {
            clearInterval(progressInterval);
            setClaimError(error.message || 'Failed to upload proof.');
            setIsSubmitting(false);
            return;
        }

        // Show Ad before final submission
        await triggerAd('interstitial');

        try {
            const isAutoApprove = verificationMethod === 'timer' || 
                (needsCode && video.correctCode && secretCodeInput.trim().toLowerCase() === video.correctCode.trim().toLowerCase());
            const statusToSubmit = isAutoApprove ? 'approved' : 'pending';

            if (video.taskType === 'youtube') {
                await submitYouTubeProof(video.id, video.title, url, displayReward, video.rewardToken, secretCodeInput, statusToSubmit);
            } else {
                await submitVideoProof(video.id, video.title, url, displayReward, video.rewardToken, secretCodeInput, statusToSubmit);
            }
            
            // Check if it was auto-approved immediately (code match or timer)
            if (isAutoApprove) {
                await claimTaskReward(video.id, video.taskType || 'video', displayReward, video.rewardToken, video.title);
                setShowSuccessModal(true);
            }
        } catch (error: any) {
            setClaimError(error.message || 'Failed to submit proof.');
        } finally {
            setIsSubmitting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmitClick = () => {
        if (needsCode && !secretCodeInput.trim()) {
            setClaimError('Please enter the secret code.');
            return;
        }
        
        if (needsCode && video.correctCode && secretCodeInput.trim().toLowerCase() !== video.correctCode.trim().toLowerCase()) {
            setClaimError('Incorrect code. Please try again.');
            return;
        }
        setShowConfirmModal('submit');
    };

    const handleSubmit = async () => {
        setShowConfirmModal(null);
        setIsSubmitting(true);
        setClaimError('');
        
        await triggerAd('interstitial');

        try {
            const proofData = verificationMethod === 'timer' ? 'timer_completed' : 'code_only';
            const isAutoApprove = verificationMethod === 'timer' || 
                (needsCode && video.correctCode && secretCodeInput.trim().toLowerCase() === video.correctCode.trim().toLowerCase());
            const statusToSubmit = isAutoApprove ? 'approved' : 'pending';
            
            if (video.taskType === 'youtube') {
                await submitYouTubeProof(video.id, video.title, proofData, displayReward, video.rewardToken, secretCodeInput, statusToSubmit);
            } else {
                await submitVideoProof(video.id, video.title, proofData, displayReward, video.rewardToken, secretCodeInput, statusToSubmit);
            }

            if (isAutoApprove) {
                await claimTaskReward(video.id, video.taskType || 'video', displayReward, video.rewardToken, video.title);
            }
            setShowSuccessModal(true);
        } catch (error: any) {
            setClaimError(error.message || 'Failed to submit.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClaimRewardClick = () => {
        setShowConfirmModal('claim');
    };

    const handleClaimReward = async () => {
        setShowConfirmModal(null);
        setIsClaiming(true);
        try {
            await claimTaskReward(video.id, video.taskType || 'video', displayReward, video.rewardToken, video.title);
            setShowSuccessModal(true);
        } catch (error: any) {
            setClaimError(error.message || 'Failed to claim reward.');
        } finally {
            setIsClaiming(false);
        }
    };

    return (
        <div className="bg-white dark:bg-[#161B22] text-gray-900 dark:text-white p-6 rounded-xl max-w-md mx-auto shadow-2xl border border-gray-200 dark:border-gray-800 relative overflow-hidden">
            {showConfirmModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={(e) => { e.stopPropagation(); setShowConfirmModal(null); }}>
                    <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirm Claim</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                            {showConfirmModal === 'submit' 
                                ? ((needsScreenshot || needsCode) ? "Are you sure you want to submit your proof and claim this reward?" : "Are you sure you want to claim this reward?") 
                                : "Are you sure you want to collect your reward?"}
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirmModal(null)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition">Cancel</button>
                            <button onClick={showConfirmModal === 'submit' ? handleSubmit : handleClaimReward} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
            {needsScreenshot && (
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*" 
                />
            )}

            {showSuccessModal && (
                <RewardClaimedModal 
                    isOpen={showSuccessModal} 
                    onClose={() => setShowSuccessModal(false)} 
                    reward={displayReward} 
                    token={video.rewardToken} 
                />
            )}

            <div className="flex flex-col items-center mb-6">
                <h2 className="text-lg font-bold truncate max-w-sm text-center">{video.title}</h2>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    {video.endTime && (
                        <div className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded whitespace-nowrap">
                            Expires: {new Date(video.endTime).toLocaleDateString()}
                        </div>
                    )}
                    {video.limit && video.limit > 0 && (
                        <div className="text-xs font-bold text-purple-500 bg-purple-500/10 px-2 py-1 rounded whitespace-nowrap">
                            {video.claimCount || 0}/{video.limit} Claims
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-lg overflow-hidden bg-black aspect-video mb-6 border border-gray-200 dark:border-gray-800 relative shadow-lg">
                {youtubeId ? (
                    <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&playsinline=1`} title={video.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                ) : isVideoFile ? (
                    <video src={video.url} controls controlsList="nodownload" className="w-full h-full object-contain" autoPlay playsInline />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-900 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{video.description || 'Watch the video to earn.'}</p>
                        <p className="text-xs text-gray-500 break-all">URL: {video.url}</p>
                    </div>
                )}
            </div>

            <div className={`relative overflow-hidden rounded-2xl p-6 mb-6 transition-all duration-700 transform ${
                isCompleted 
                ? 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
                : isApproved
                    ? 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border-yellow-500/40 animate-pulse'
                    : isPending
                        ? 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-500/40'
                        : canClaim 
                            ? 'bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                            : 'bg-gray-50 dark:bg-[#1F2937] border-gray-200 dark:border-gray-700'
            } border`}>
                <div className="absolute -top-4 -right-4 p-0 opacity-10 transform rotate-12 scale-150 pointer-events-none">
                    <TokenIcon token={video.rewardToken} className="w-32 h-32" />
                </div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-2 ${
                        isCompleted ? 'text-green-400' : isApproved ? 'text-yellow-400' : isPending ? 'text-blue-400' : canClaim ? 'text-purple-400 animate-pulse' : 'text-gray-400'
                    }`}>
                        {isCompleted ? 'Reward Claimed' : isApproved ? 'Ready to Claim' : isPending ? (proof?.status === 'processing' ? 'Verification In Progress' : 'Verification Pending') : 'Total Reward'}
                    </p>
                    
                    <div className="flex items-center justify-center gap-3">
                        <TokenIcon token={video.rewardToken} className={`w-10 h-10 ${isCompleted ? 'animate-bounce' : ''}`} />
                        <span className={`text-4xl font-black tracking-tight ${
                            isCompleted ? 'text-green-400' : 'text-gray-900 dark:text-white'
                        }`}>
                            {displayReward.toLocaleString()}
                        </span>
                        <span className={`text-xl font-bold mt-2 ${isCompleted ? 'text-green-500/70' : 'text-gray-500'}`}>
                            {state.tokenConfigs[video.rewardToken]?.name || video.rewardToken}
                        </span>
                    </div>

                    {isCompleted ? (
                        <div className="mt-3 flex items-center text-green-600 dark:text-green-400 text-sm font-bold bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full border border-green-500/30">
                            <CheckCircleIcon className="w-4 h-4 mr-1.5" />
                            Sent to Wallet
                        </div>
                    ) : isApproved ? (
                        <div className="mt-3 text-xs font-bold text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/30">
                            Approved by Admin
                        </div>
                    ) : isPending ? (
                        <div className="mt-3 flex items-center text-blue-600 dark:text-blue-400 text-sm font-bold bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-500/30">
                            <HistoryIcon className="w-4 h-4 mr-1.5 animate-spin" />
                            {proof?.status === 'processing' ? 'Reviewing...' : 'Pending...'}
                        </div>
                    ) : canClaim ? (
                        <div className="mt-3 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10 px-3 py-1 rounded-full animate-pulse">
                            Watch Complete! {needsCode ? 'Enter Code' : 'Submit Now'}
                        </div>
                    ) : (
                        <div className="mt-3 w-full bg-gray-200 dark:bg-gray-800/50 rounded-full h-1.5 overflow-hidden max-w-[120px]">
                            <div 
                                className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                                style={{ width: `${Math.min(100, (((video.timerInSeconds || 60) - timeLeft) / (video.timerInSeconds || 60)) * 100)}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="text-center">
                {!isCompleted && !isPending && !isApproved && (
                    <>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase">Timer</span>
                                <span className={`text-sm font-mono font-bold ${canClaim ? 'text-green-500 dark:text-green-400' : 'text-orange-500 dark:text-orange-400'}`}>
                                    {canClaim ? '00:00' : `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`}
                                </span>
                            </div>
                            {!canClaim && (
                                <p className="text-[10px] text-gray-500 text-left">Watch for {timeLeft}s more to unlock</p>
                            )}
                        </div>

                        {canClaim && needsCode && (
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 text-left pl-1">Secret Code</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter the code found in video"
                                    value={secretCodeInput}
                                    onChange={(e) => setSecretCodeInput(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600 font-bold"
                                />
                                <p className="text-[10px] text-gray-500 mt-1 text-left pl-1">Hint: Watch the video carefully to find the secret code.</p>
                            </div>
                        )}

                        {claimError && <p className="text-xs text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/20 p-2 rounded mb-2 border border-red-500/20 font-bold">{claimError}</p>}
                        {isRejected && <p className="text-xs text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/20 p-2 rounded mb-2 border border-red-500/20">Previous submission rejected. Try again.</p>}

                        {needsScreenshot ? (
                            <button 
                                onClick={handleUploadTrigger} 
                                disabled={!canClaim || isSubmitting} 
                                className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group
                                    ${canClaim 
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30' 
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
                            >
                                {isSubmitting ? (
                                    <div className="w-full px-4">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>Uploading...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full bg-blue-800 rounded-full h-2 overflow-hidden">
                                            <div className="h-full bg-white transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                    </div>
                                ) : canClaim ? (
                                    <>
                                        <UploadIcon className="w-5 h-5" />
                                        <span>Submit Verification</span>
                                    </>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
                                        Locked ({timeLeft}s)
                                    </span>
                                )}
                            </button>
                        ) : (
                            <button 
                                onClick={handleSubmitClick} 
                                disabled={!canClaim || isSubmitting} 
                                className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed
                                    ${canClaim 
                                        ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/30' 
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
                            >
                                {isSubmitting ? 'Verifying...' : canClaim ? 'Claim Reward' : `Locked (${timeLeft}s)`}
                            </button>
                        )}
                    </>
                )}

                {isApproved && (
                    <div className="mt-4">
                        <button 
                            onClick={handleClaimRewardClick} 
                            disabled={isClaiming}
                            className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg rounded-xl shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 animate-pulse transition-all transform active:scale-[0.98]"
                        >
                            {isClaiming ? 'Claiming...' : 'CLAIM REWARD'}
                        </button>
                        <p className="text-[10px] text-gray-500 mt-2">Admin approved your proof. Click to collect.</p>
                    </div>
                )}

                {(isCompleted || isPending) && !isApproved && (
                    <div className="mt-4">
                        {isPending ? (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4 flex items-center justify-center gap-3">
                                <HistoryIcon className="w-6 h-6 text-blue-500 animate-spin" />
                                <div className="text-left">
                                    <p className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                                        {proof?.status === 'processing' ? 'Under Review' : 'Proof Submitted'}
                                    </p>
                                    <p className="text-xs text-blue-500/70">
                                        Waiting for admin approval...
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <button disabled className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-green-600 dark:text-green-500 font-bold rounded-xl border border-green-200 dark:border-green-500/20 flex items-center justify-center gap-2 cursor-default">
                                <CheckCircleIcon className="w-5 h-5" />
                                Reward Claimed
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoPlayer;
