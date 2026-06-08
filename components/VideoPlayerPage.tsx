import React, { useContext, useEffect, useRef, useState } from 'react';
import { Video } from '../types';
import VideoPlayer from './VideoPlayer';
import YouTube from 'react-youtube';
import { getYouTubeId } from '../utils/youtube';
import { AppContext } from '../context/AppContext';

import UploadIcon from './icons/UploadIcon';

interface VideoPlayerPageProps {
    video: Video;
    onBack: () => void;
}

const VideoPlayerPage: React.FC<VideoPlayerPageProps> = ({ video, onBack }) => {
    const { claimTaskReward, startTask, cancelTask, submitYouTubeProof, submitVideoProof, uploadProofAttachment } = useContext(AppContext);
    // Handle potential missing url property for YouTube tasks
    const videoUrl = video.url || (video as any).youtubeUrl || '';
    const youTubeId = getYouTubeId(videoUrl);
    const isShort = videoUrl.includes('shorts/');
    const hasStarted = useRef(false);

    const [isCompleted, setIsCompleted] = useState(false);
    const [code, setCode] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [player, setPlayer] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const lastTimeRef = useRef(0);
    
    // Verification Method Logic
    const verificationMethod = video.verificationMethod || 'timer';
    const needsCode = verificationMethod === 'code' || verificationMethod === 'both';
    const needsScreenshot = verificationMethod === 'screenshot' || verificationMethod === 'both';
    const isTimerOnly = verificationMethod === 'timer';

    // Hidden Timer Logic
    const timerDuration = video.timerInSeconds || 0;
    const [timeLeft, setTimeLeft] = useState(timerDuration);
    const hasTimer = timerDuration > 0;

    useEffect(() => {
        if (!hasTimer) return;
        
        let interval: NodeJS.Timeout;
        if (isPlaying && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsCompleted(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, timeLeft, hasTimer]);

    useEffect(() => {
        if (!hasStarted.current) {
            startTask(video.id, video.title, video.taskType || 'video');
            hasStarted.current = true;
        }
    }, [video.id, video.title, video.taskType, startTask]);

    // Anti-seek logic
    useEffect(() => {
        const interval = setInterval(async () => {
            if (player && isPlaying) {
                try {
                    const currentTime = await player.getCurrentTime();
                    // Allow 3 seconds buffer for normal playback + network hiccups
                    // If current time is significantly ahead of last recorded time, it's a seek
                    if (currentTime > lastTimeRef.current + 3) {
                        player.seekTo(lastTimeRef.current);
                    } else {
                        // Only update lastTime if we are moving forward normally or staying same
                        // If we seek back, we update lastTime to the new (earlier) time
                        lastTimeRef.current = currentTime;
                    }
                } catch (e) {
                    // Ignore player errors
                }
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [player, isPlaying]);

    const opts = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1,
            playsinline: 1,
            controls: 1, 
            disablekb: 0,
            modestbranding: 1,
            rel: 0,
            fs: 1,
            iv_load_policy: 3, // Hide annotations
            origin: window.location.origin
        },
    };

    const onReady = (event: any) => {
        setPlayer(event.target);
        // Attempt to play immediately
        try {
            event.target.playVideo();
        } catch (e) {
            console.warn("Autoplay failed", e);
        }
    };

    const onStateChange = (event: any) => {
        // 1 = playing, 2 = paused, 3 = buffering
        const playing = event.data === 1;
        setIsPlaying(playing);
        
        // If we just started playing (or resumed), sync lastTime to current time
        // to prevent false positives if we paused for a long time
        if (playing && event.target) {
            try {
                lastTimeRef.current = event.target.getCurrentTime();
            } catch (e) {}
        }
    };



    const handleVideoEnd = () => {
        // Only use onEnd if there is NO timer set
        if (!hasTimer) {
            setIsCompleted(true);
            setIsPlaying(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProofFile(e.target.files[0]);
            setPreviewUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleClaimClick = () => {
        if (needsCode && !code.trim()) {
            setError('Please enter the verification code.');
            return;
        }
        if (needsScreenshot && !proofFile) {
            setError('Please upload a screenshot.');
            return;
        }
        setShowConfirmModal(true);
    };

    const handleClaim = async () => {
        setShowConfirmModal(false);
        setIsSubmitting(true);
        setError('');
        try {
            // Determine reward
            let reward = 0;
            if ('reward' in video) {
                 reward = (video as any).reward;
            } else {
                 reward = (video.rewardPerSecond || 0) * 60;
            }

            // Handle Screenshot Upload first if needed
            let proofUrl = 'youtube_watch_completed';
            if (needsScreenshot && proofFile) {
                setUploadProgress(10);
                const interval = setInterval(() => setUploadProgress(p => Math.min(p + 10, 90)), 200);
                proofUrl = await uploadProofAttachment(proofFile);
                clearInterval(interval);
                setUploadProgress(100);
            }

            const taskType = video.taskType || 'youtube';
            if (taskType === 'video') {
                await submitVideoProof(video.id, video.title, proofUrl, reward, video.rewardToken, code);
            } else {
                await submitYouTubeProof(video.id, video.title, proofUrl, reward, video.rewardToken, code);
            }

            // If it's a timer task (or no specific method), we also need to trigger the claim
            // If it was a code task, submitYouTubeProof handles the claim if code matches
            if (isTimerOnly) {
                await claimTaskReward(video.id, taskType, true);
            }
            
            onBack();
        } catch (e: any) {
            setError(e.message || 'Failed to claim reward');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        cancelTask(video.id, video.taskType || 'youtube');
        onBack();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117] flex flex-col">
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
            <header className="p-4 flex items-center bg-white dark:bg-[#161B22] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
                <button onClick={handleBack} className="text-gray-600 dark:text-gray-300 font-semibold text-sm flex items-center hover:text-gray-900 dark:hover:text-white transition group">
                    <span className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-md mr-2 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </span>
                    Back to Feed
                </button>
            </header>
            <main className="flex-grow flex flex-col items-center justify-center p-0 sm:p-6">
                <div className={`w-full ${isShort ? 'max-w-sm' : 'max-w-4xl'} w-full transition-all duration-300`}>
                    <div className={`bg-black sm:rounded-xl overflow-hidden shadow-2xl border-y sm:border border-gray-800 ${isShort ? 'aspect-[9/16]' : 'aspect-video'} relative group`}>
                        {youTubeId ? (
                            <YouTube 
                                videoId={youTubeId} 
                                className="w-full h-full" 
                                opts={opts}
                                onReady={onReady}
                                onStateChange={onStateChange}
                                onEnd={handleVideoEnd} 
                            />
                        ) : (
                            <VideoPlayer video={{...video, url: videoUrl}} />
                        )}
                    </div>
                    
                    <div className="p-4 space-y-4">
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{video.title}</h1>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {video.endTime && (
                                    <div className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded w-max whitespace-nowrap">
                                        Expires: {new Date(video.endTime).toLocaleDateString()}
                                    </div>
                                )}
                                {video.limit && video.limit > 0 && (
                                    <div className="text-xs font-bold text-purple-500 bg-purple-500/10 px-2 py-1 rounded w-max whitespace-nowrap">
                                        {video.claimCount || 0}/{video.limit} Claims
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="bg-white dark:bg-[#161B22] p-4 rounded-xl border border-gray-200 dark:border-gray-800 animate-fade-in shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className={`text-lg font-bold ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-200'}`}>
                                        {isCompleted ? 'Video Completed!' : 'Watch to Earn'}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        {isCompleted 
                                            ? (isTimerOnly ? 'You can now claim your reward.' : 'Complete verification to claim.') 
                                            : 'Watch the video to unlock the reward.'}
                                    </p>
                                </div>
                                {!isCompleted && hasTimer && (
                                    <div className="flex items-center space-x-2">
                                        {isPlaying && (
                                            <span className="relative flex h-3 w-3">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                            </span>
                                        )}
                                        <span className={`text-xs font-bold uppercase tracking-widest ${isPlaying ? 'text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-4">
                                {needsCode && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Verification Code</label>
                                        <input 
                                            type="text" 
                                            placeholder="Enter Secret Code" 
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-[#0D1117] border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none transition"
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
                                                    <UploadIcon className="w-8 h-8 text-gray-400 mb-2" />
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
                                
                                {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
                                
                                <button 
                                    onClick={handleClaimClick}
                                    disabled={isSubmitting || !isCompleted}
                                    className={`w-full font-bold py-3 rounded-lg shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed ${
                                        isCompleted 
                                        ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20' 
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 opacity-50'
                                    }`}
                                >
                                    {isSubmitting ? 'Claiming...' : isCompleted ? 'Claim Reward' : 'Locked'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default VideoPlayerPage;
