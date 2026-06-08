
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Video } from '../types';
import TokenIcon from './icons/TokenIcon';
import UploadIcon from './icons/UploadIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ClockIcon from './icons/ClockIcon';
import RewardClaimedModal from './RewardClaimedModal';

interface TaskProofModalProps {
    task: Video;
    onClose: () => void;
}

const TaskProofModal: React.FC<TaskProofModalProps> = ({ task, onClose }) => {
    const { 
        state,
        startTask,
        cancelTask,
        submitYouTubeProof, submitTelegramProof, 
        submitFacebookProof, submitInstagramProof, submitTwitterProof, 
        submitTikTokProof, submitAppDownloadProof, submitOtherProof,
        submitVideoProof,
        uploadProofAttachment, claimTaskReward
    } = useContext(AppContext);
    const { currentUser } = state;

    const [proofFile, setProofFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [secretCode, setSecretCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Get current proof status
    const existingProof = useMemo(() => {
        if (!currentUser) return null;
        switch (task.taskType) {
            case 'video': return currentUser.videoProofs?.[task.id];
            case 'youtube': return currentUser.youtubeTaskProofs?.[task.id];
            case 'telegram': return currentUser.telegramTaskProofs?.[task.id];
            case 'facebook': return currentUser.facebookTaskProofs?.[task.id];
            case 'instagram': return currentUser.instagramTaskProofs?.[task.id];
            case 'twitter': return currentUser.twitterTaskProofs?.[task.id];
            case 'tiktok': return currentUser.tiktokTaskProofs?.[task.id];
            case 'app_download': return currentUser.appDownloadTaskProofs?.[task.id];
            case 'other': return currentUser.otherTaskProofs?.[task.id];
            default: return currentUser.videoProofs?.[task.id];
        }
    }, [currentUser, task.id, task.taskType]);

    const isClaimed = existingProof?.status === 'claimed';
    const isApproved = existingProof?.status === 'approved';
    const isStarted = existingProof?.status === 'started' || existingProof?.status === 'pending' || existingProof?.status === 'processing';
    
    // Cast to access social task properties safely
    const taskAny = task as any;
    const reward = taskAny.reward || (task.rewardPerSecond ? task.rewardPerSecond * 60 : 0);
    const requiredSeconds = task.timerInSeconds || 30;
    
    const verificationMethod = task.verificationMethod || 'timer';
    const needsCode = verificationMethod === 'code' || verificationMethod === 'both';
    const needsScreenshot = verificationMethod === 'screenshot' || verificationMethod === 'both';
    const isTimerOnly = verificationMethod === 'timer';

    const [timeLeft, setTimeLeft] = useState(requiredSeconds);
    const [canClaim, setCanClaim] = useState(false);

    // Function to calculate time remaining
    const calculateTimeLeft = () => {
        if (existingProof?.startedAt) {
            const startTime = new Date(existingProof.startedAt).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);
            const remaining = Math.max(0, requiredSeconds - elapsed);
            return remaining;
        }
        return requiredSeconds;
    };

    // Initial state check
    useEffect(() => {
        if (isStarted && existingProof?.startedAt) {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);
            if (remaining <= 0) setCanClaim(true);
        } else if (isApproved || isClaimed) {
            setTimeLeft(0);
            setCanClaim(true);
        }
    }, [existingProof, isStarted, isApproved, isClaimed, requiredSeconds, calculateTimeLeft]);

    // Visibility change listener to re-sync timer when user returns to app
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isStarted && existingProof?.startedAt && !isApproved && !isClaimed) {
                const remaining = calculateTimeLeft();
                setTimeLeft(remaining);
                if (remaining <= 0) setCanClaim(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isStarted, existingProof, requiredSeconds, isApproved, isClaimed]);

    // Interval Timer countdown
    useEffect(() => {
        if (!isStarted || timeLeft <= 0 || isApproved || isClaimed) return;
        
        const timer = setInterval(() => {
            if (existingProof?.startedAt) {
                // Sync with server start time if available
                const remaining = calculateTimeLeft();
                setTimeLeft(remaining);
                if (remaining <= 0) {
                    setCanClaim(true);
                    clearInterval(timer);
                }
            } else {
                // Fallback client-side decrement
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setCanClaim(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [isStarted, existingProof, requiredSeconds, timeLeft, isApproved, isClaimed]);


    const handleStart = async () => {
        setIsSubmitting(true);
        try {
            await startTask(task.id, task.title, task.taskType || 'video');
            
            // Open Link
            const url = task.url || (task as any).youtubeUrl || (task as any).telegramUrl || (task as any).facebookUrl || (task as any).instagramUrl || (task as any).twitterUrl || (task as any).tiktokUrl || (task as any).downloadUrl;
            if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        } catch (e: any) {
            setUploadError(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClaimClick = () => {
        // Validate timer again just in case
        if (isStarted && existingProof?.startedAt) {
             const remaining = calculateTimeLeft();
             if (remaining > 0) {
                 setUploadError(`Please wait ${remaining} more seconds.`);
                 return;
             }
        }

        if (needsCode && !secretCode.trim()) {
            setUploadError('Please enter the verification code.');
            return;
        }
        if (needsScreenshot && !proofFile) {
            setUploadError('Please upload a screenshot.');
            return;
        }

        setShowConfirmModal(true);
    };

    const handleClaim = async () => {
        setShowConfirmModal(false);
        setIsSubmitting(true);
        setUploadError('');

        try {
            // Handle Screenshot Upload first if needed
            let proofUrl = 'timer_completed';
            if (needsScreenshot && proofFile) {
                setUploadProgress(10);
                const interval = setInterval(() => setUploadProgress(p => Math.min(p + 10, 90)), 200);
                proofUrl = await uploadProofAttachment(proofFile);
                clearInterval(interval);
                setUploadProgress(100);
            }

            // For Timer tasks, we claim directly.
            if (isTimerOnly) {
                await claimTaskReward(task.id, task.taskType || 'video');
                setShowSuccessModal(true);
            } else {
                // Submit Proof logic for Manual Review or Code
                const submitFnMap: any = {
                    'video': submitVideoProof,
                    'youtube': submitYouTubeProof,
                    'telegram': submitTelegramProof,
                    'facebook': submitFacebookProof,
                    'instagram': submitInstagramProof,
                    'twitter': submitTwitterProof,
                    'tiktok': submitTikTokProof,
                    'app_download': submitAppDownloadProof,
                    'other': submitOtherProof
                };
                const submitFn = submitFnMap[task.taskType || 'video'] || submitVideoProof;
                
                await submitFn(task.id, task.title, proofUrl, reward, task.rewardToken, secretCode);
                
                // If it was a code task and correct, it might be auto-approved/claimed instantly
                if (needsCode && task.correctCode && secretCode.trim().toLowerCase() === task.correctCode.trim().toLowerCase()) {
                     setShowSuccessModal(true);
                } else {
                     onClose();
                }
            }

        } catch (e: any) {
            setUploadError(e.message || "Failed to claim reward. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProofFile(e.target.files[0]);
            setPreviewUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleClose = () => {
        if (existingProof?.status === 'started') {
            cancelTask(task.id, task.taskType || 'video');
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={handleClose}>
            {showSuccessModal && (
                <RewardClaimedModal 
                    isOpen={showSuccessModal} 
                    onClose={() => { setShowSuccessModal(false); handleClose(); }} 
                    reward={reward} 
                    token={task.rewardToken} 
                />
            )}
            
            {showConfirmModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={(e) => { e.stopPropagation(); setShowConfirmModal(false); }}>
                    <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirm Claim</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Are you sure you want to submit your proof and claim this reward?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition">Cancel</button>
                            <button onClick={handleClaim} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{task.title}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{task.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {task.endTime && (
                            <div className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded inline-block whitespace-nowrap">
                                Expires: {new Date(task.endTime).toLocaleDateString()}
                            </div>
                        )}
                        {task.limit && task.limit > 0 && (
                            <div className="text-xs font-bold text-purple-500 bg-purple-500/10 px-2 py-1 rounded inline-block whitespace-nowrap">
                                {task.claimCount || 0}/{task.limit} Claims
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Timer Status */}
                    <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${canClaim ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                {canClaim ? <CheckCircleIcon className="w-6 h-6" /> : <ClockIcon className="w-6 h-6" />}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">{canClaim ? 'Status' : 'Time Remaining'}</p>
                                <p className={`text-lg font-mono font-bold ${canClaim ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                    {canClaim ? 'Ready' : `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Reward</p>
                            <div className="flex items-center gap-1 justify-end text-yellow-600 dark:text-yellow-500 font-bold">
                                <TokenIcon token={task.rewardToken} className="w-4 h-4" />
                                <span>{reward.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {uploadError && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm text-center font-semibold">
                            {uploadError}
                        </div>
                    )}

                    {/* Start / Action Section */}
                    {!isStarted && !isApproved && !isClaimed ? (
                        <button 
                            onClick={handleStart}
                            disabled={isSubmitting}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
                        >
                            {isSubmitting ? 'Opening...' : 'Start Task'}
                        </button>
                    ) : (
                        <div className="space-y-4">
                            {/* Inputs for Code/Proof if required */}
                            {needsCode && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Verification Code</label>
                                    <input 
                                        type="text" 
                                        value={secretCode}
                                        onChange={e => setSecretCode(e.target.value)}
                                        placeholder="Enter code from task"
                                        className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            )}

                            {needsScreenshot && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Proof Screenshot</label>
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="h-full object-contain rounded-lg" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <UploadIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Click to upload image</p>
                                            </div>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                    {isSubmitting && needsScreenshot && (
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 mt-2 rounded-full overflow-hidden">
                                            <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button 
                                onClick={handleClaimClick}
                                disabled={!canClaim || isSubmitting || isApproved || isClaimed}
                                className={`w-full py-4 font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] ${
                                    canClaim && !isApproved && !isClaimed
                                    ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {isApproved || isClaimed 
                                    ? 'Completed' 
                                    : isSubmitting 
                                        ? 'Verifying...' 
                                        : canClaim 
                                            ? 'Claim Reward' 
                                            : `Wait ${timeLeft}s`
                                }
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskProofModal;
