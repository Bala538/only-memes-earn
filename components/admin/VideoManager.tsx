
import React, { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Video, Token, VerificationMethod } from '../../types';
import VideoIcon from '../icons/VideoIcon';
import UploadIcon from '../icons/UploadIcon';
import ConfirmationModal from '../ConfirmationModal';

const VideoManager: React.FC = () => {
    const { state, addVideo, removeVideo } = useContext(AppContext);
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
    const [videoUrl, setVideoUrl] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [reward, setReward] = useState(''); 
    const [rewardToken, setRewardToken] = useState<Token>('BabyDoge');
    const [timerInSeconds, setTimerInSeconds] = useState('60');
    const [limit, setLimit] = useState('');
    const [dailyLimit, setDailyLimit] = useState('');
    const [endTime, setEndTime] = useState('');
    const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('timer'); // Default to timer
    const [correctCode, setCorrectCode] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setVideoFile(e.target.files[0]);
            setVideoUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleSubmit = async () => {
        if (!title || !videoUrl || !reward) {
            setError('Title, Video Source, and Reward are required.');
            return;
        }
        if ((verificationMethod === 'code' || verificationMethod === 'both') && !correctCode.trim()) {
            setError('Please provide the correct code for verification.');
            return;
        }

        const rewardAmount = parseFloat(reward);
        if (isNaN(rewardAmount) || rewardAmount <= 0) {
            setError('Please enter a valid reward amount.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const rewardPerSecond = rewardAmount / 60;
            const newVideo: Video = {
                id: Date.now().toString(),
                title,
                description,
                url: videoUrl,
                rewardToken,
                rewardPerSecond,
                timerInSeconds: parseInt(timerInSeconds) || 60,
                limit: limit ? parseInt(limit) : undefined,
                dailyLimit: dailyLimit ? parseInt(dailyLimit) : undefined,
                endTime: endTime ? new Date(endTime).toISOString() : undefined,
                taskType: 'video',
                verificationMethod,
                correctCode: (verificationMethod === 'code' || verificationMethod === 'both') ? correctCode.trim() : undefined,
                claimCount: 0,
                dailyClaimCount: 0
            };

            await addVideo(newVideo);
            setTitle('');
            setDescription('');
            setVideoUrl('');
            setVideoFile(null);
            setReward('');
            setRewardToken('BabyDoge');
            setTimerInSeconds('60');
            setLimit('');
            setDailyLimit('');
            setEndTime('');
            setVerificationMethod('timer'); // Reset to timer
            setCorrectCode('');
        } catch (err: any) {
            setError("Failed to add video.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmRemove = () => {
        if (itemToDelete) {
            removeVideo(itemToDelete);
            setItemToDelete(null);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmRemove}
                title="Remove Video"
                message="Are you sure you want to remove this video? This action cannot be undone."
            />
            
            <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl h-fit border border-gray-200 dark:border-purple-900/30">
                <h2 className="text-2xl font-bold mb-4 text-purple-400 border-b-2 border-purple-400 pb-2 flex items-center space-x-2">
                    <VideoIcon className="w-7 h-7" />
                    <span>Upload Video (Admin Only)</span>
                </h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Video Title</label>
                        <input type="text" placeholder="Video Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Video Description (Optional)</label>
                        <textarea placeholder="Video Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500" rows={2} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Timer (sec)</label>
                            <input type="number" value={timerInSeconds} onChange={(e) => setTimerInSeconds(e.target.value)} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Total Reward (60s)</label>
                            <div className="flex">
                                <input type="number" value={reward} onChange={(e) => setReward(e.target.value)} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-l-md border border-gray-200 dark:border-gray-600 border-r-0 focus:ring-2 focus:ring-purple-500" />
                                <select value={rewardToken} onChange={(e) => setRewardToken(e.target.value as Token)} className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-r-md border border-gray-200 dark:border-gray-600 border-l-0 text-xs">
                                    {state.availableTokens.map(token => <option key={token} value={token}>{state.tokenConfigs[token]?.name || token}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Global User Limit</label>
                            <input type="number" placeholder="None" value={limit} onChange={(e) => setLimit(e.target.value)} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Daily Global Limit</label>
                            <input type="number" placeholder="None" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Expiration Date (Optional)</label>
                        <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Video Source</label>
                        <div className="flex gap-4 mb-3">
                            <button onClick={() => setUploadMode('url')} className={`flex-1 py-2 rounded border ${uploadMode === 'url' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>External Link</button>
                            <button onClick={() => setUploadMode('file')} className={`flex-1 py-2 rounded border ${uploadMode === 'file' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>Upload File</button>
                        </div>
                        {uploadMode === 'url' ? (
                            <input type="text" placeholder="https://..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500" />
                        ) : (
                            <div className="border-2 border-dashed border-gray-600 rounded-md p-6 flex flex-col items-center justify-center text-gray-400 hover:border-purple-500 transition-all cursor-pointer relative">
                                <input type="file" accept="video/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <UploadIcon className="w-10 h-10 mb-2" />
                                <span className="text-sm font-semibold">{videoFile ? videoFile.name : "Select Video File"}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <label className="block text-sm font-bold text-purple-400 mb-2 uppercase tracking-wider">Verification</label>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Required Method</label>
                                <select 
                                    value={verificationMethod} 
                                    onChange={(e) => setVerificationMethod(e.target.value as VerificationMethod)}
                                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="timer">Timer (Auto Claim)</option>
                                    <option value="code">Secret Code (Auto Approval)</option>
                                    <option value="screenshot">Screenshot (Manual Review)</option>
                                    <option value="both">Both (Code + Screenshot)</option>
                                </select>
                                {verificationMethod === 'timer' && (
                                    <p className="text-xs text-yellow-500 mt-1">⚠️ Timer tasks pay automatically. No proof required.</p>
                                )}
                                {verificationMethod === 'screenshot' && (
                                    <p className="text-xs text-green-500 mt-1">✅ Requires admin approval before payment.</p>
                                )}
                            </div>
                            {(verificationMethod === 'code' || verificationMethod === 'both') && (
                                <div className="animate-fade-in">
                                    <label className="block text-xs text-gray-400 mb-1 font-bold">The Correct Secret Code</label>
                                    <input 
                                        type="text" 
                                        placeholder="Secret word found in video"
                                        value={correctCode}
                                        onChange={(e) => setCorrectCode(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-500 font-mono"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">If user enters this exactly, reward is sent instantly (for Code only).</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
                    
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-gray-500 shadow-lg shadow-purple-900/20"
                    >
                        {isSubmitting ? "Processing..." : "Publish Video Task"}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl lg:max-h-[calc(100vh-15rem)]">
                <h2 className="text-2xl font-bold mb-4 text-purple-400 border-b-2 border-purple-400 pb-2">All Video Tasks</h2>
                <div className="space-y-4 overflow-y-auto h-full pr-2">
                    {state.videos.map(video => (
                        <div key={video.id} className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row">
                            <div className="w-full md:w-32 h-24 bg-black flex-shrink-0 relative">
                                <video src={video.url} className="w-full h-full object-cover opacity-50" />
                                <div className="absolute inset-0 flex items-center justify-center"><VideoIcon className="w-8 h-8 text-gray-400" /></div>
                            </div>
                            <div className="p-4 flex-grow flex flex-col justify-between">
                                <div className="min-w-0">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{video.title}</h3>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800 uppercase font-bold">{(video.rewardPerSecond * 60).toLocaleString()} {state.tokenConfigs[video.rewardToken]?.name || video.rewardToken}</span>
                                        <span className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700 uppercase font-bold">{video.timerInSeconds}s</span>
                                        {video.limit && <span className="text-[10px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800 uppercase font-bold">L: {video.claimCount}/{video.limit}</span>}
                                        {video.verificationMethod === 'code' && <span className="text-[10px] bg-green-900/50 text-green-300 px-1.5 py-0.5 rounded">Code</span>}
                                        {video.verificationMethod === 'timer' && <span className="text-[10px] bg-yellow-900/50 text-yellow-300 px-1.5 py-0.5 rounded">Timer</span>}
                                        {(video.verificationMethod === 'screenshot' || video.verificationMethod === 'both') && <span className="text-[10px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded">Proof</span>}
                                        {video.endTime && new Date(video.endTime) < new Date() && <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">EXPIRED</span>}
                                    </div>
                                </div>
                                <div className="flex justify-end mt-2">
                                    <button onClick={() => { setItemToDelete(video.id); setIsDeleteModalOpen(true); }} className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded transition">Remove</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VideoManager;
