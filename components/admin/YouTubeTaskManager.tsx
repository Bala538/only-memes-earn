
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { YouTubeTask, Token, UserData, Proof, VerificationMethod } from '../../types';
import TokenIcon from '../icons/TokenIcon';
import { YouTubeIcon } from '../icons/YouTubeIcon';
import ConfirmationModal from '../ConfirmationModal';

const YouTubeTaskManager: React.FC = () => {
    const { state, addYouTubeTask, updateYouTubeTask, removeYouTubeTask } = useContext(AppContext);
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [reward, setReward] = useState('');
    const [rewardToken, setRewardToken] = useState<Token>('BabyDoge');
    const [timerInSeconds, setTimerInSeconds] = useState('0');
    const [limit, setLimit] = useState('');
    const [dailyLimit, setDailyLimit] = useState('');
    const [endTime, setEndTime] = useState('');
    const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('timer');
    const [correctCode, setCorrectCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleEdit = (task: YouTubeTask) => {
        setTitle(task.title);
        setDescription(task.description);
        setYoutubeUrl(task.youtubeUrl);
        setReward(task.reward.toString());
        setRewardToken(task.rewardToken);
        setTimerInSeconds(task.timerInSeconds ? task.timerInSeconds.toString() : '0');
        setLimit(task.limit ? task.limit.toString() : '');
        setDailyLimit(task.dailyLimit ? task.dailyLimit.toString() : '');
        setVerificationMethod(task.verificationMethod || 'timer');
        setCorrectCode(task.correctCode || '');
        if (task.endTime) {
            try {
                const date = new Date(task.endTime);
                const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                setEndTime(localIso);
            } catch (e) { setEndTime(''); }
        } else setEndTime('');
        setEditingId(task.id);
    };

    const handleCancelEdit = () => {
        setTitle(''); setDescription(''); setYoutubeUrl(''); setReward('');
        setRewardToken('BabyDoge'); setTimerInSeconds('0'); setLimit(''); setDailyLimit('');
        setEndTime(''); setVerificationMethod('timer'); setCorrectCode('');
        setEditingId(null); setError('');
    };

    const handleSubmit = async () => {
        if (!title || !youtubeUrl || !reward) {
            setError('Title, URL, and Reward are required.');
            return;
        }
        if ((verificationMethod === 'code' || verificationMethod === 'both') && !correctCode.trim()) {
            setError('Secret Code is required for auto-approval.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const taskData: YouTubeTask = {
                id: editingId || new Date().getTime().toString(),
                title, description, youtubeUrl, reward: parseFloat(reward), rewardToken,
                verificationMethod, correctCode: (verificationMethod === 'code' || verificationMethod === 'both') ? correctCode.trim() : undefined,
                timerInSeconds: parseInt(timerInSeconds) || 0,
                limit: limit ? parseInt(limit) : undefined,
                dailyLimit: dailyLimit ? parseInt(dailyLimit) : undefined,
                endTime: endTime ? new Date(endTime).toISOString() : undefined,
                claimCount: editingId ? (state.youtubeTasks.find(t => t.id === editingId)?.claimCount || 0) : 0,
                dailyClaimCount: editingId ? (state.youtubeTasks.find(t => t.id === editingId)?.dailyClaimCount || 0) : 0
            };
            if (editingId) await updateYouTubeTask(taskData);
            else await addYouTubeTask(taskData);
            handleCancelEdit();
        } catch (err: any) {
            setError(err.message || 'Error saving task.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={() => { removeYouTubeTask(itemToDelete!); setItemToDelete(null); }} title="Remove YouTube Task" message="Are you sure?" />
            <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl border border-gray-200 dark:border-red-900/30">
                <h2 className="text-2xl font-bold mb-4 text-red-500 border-b-2 border-red-500 pb-2 flex items-center space-x-2"><YouTubeIcon className="w-7 h-7" /><span>YouTube Manager</span></h2>
                <div className="space-y-4">
                    <input type="text" placeholder="Task Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-red-500" />
                    <textarea placeholder="Task Description (Optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-red-500" rows={2} />
                    <input type="text" placeholder="YouTube Video URL" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-red-500" />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Timer (sec)</label>
                            <input type="number" value={timerInSeconds} onChange={(e) => setTimerInSeconds(e.target.value)} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Reward</label>
                            <div className="flex">
                                <input type="number" value={reward} onChange={(e) => setReward(e.target.value)} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-l-md border border-gray-200 dark:border-gray-600 border-r-0" />
                                <select value={rewardToken} onChange={(e) => setRewardToken(e.target.value as Token)} className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-r-md border border-gray-200 dark:border-gray-600 border-l-0 text-xs">
                                    {state.availableTokens.map(token => <option key={token} value={token}>{state.tokenConfigs[token]?.name || token}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Global Limit</label>
                            <input type="number" placeholder="Unlimited" value={limit} onChange={(e) => setLimit(e.target.value)} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Daily Global Limit</label>
                            <input type="number" placeholder="Unlimited" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Expiration Date (Optional)</label>
                        <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600" />
                    </div>

                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Verification & Auto-Pay</label>
                        <select value={verificationMethod} onChange={(e) => setVerificationMethod(e.target.value as VerificationMethod)} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-red-500">
                            <option value="timer">Timer (Auto Claim)</option>
                            <option value="code">Auto-Approve (Code Only)</option>
                            <option value="screenshot">Manual (Screenshot Only)</option>
                            <option value="both">Both (Code + Screenshot)</option>
                        </select>
                        {(verificationMethod === 'code' || verificationMethod === 'both') && (
                            <input type="text" placeholder="Correct Code for auto-approval" value={correctCode} onChange={(e) => setCorrectCode(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded border border-gray-200 dark:border-gray-700 font-mono text-sm" />
                        )}
                    </div>

                    {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
                    <button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg transition shadow-lg shadow-red-900/20">{isSubmitting ? 'Saving...' : (editingId ? 'Update Task' : 'Add YouTube Task')}</button>
                </div>
            </div>
            <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl lg:max-h-[calc(100vh-15rem)]">
                <h3 className="text-xl font-bold mb-4 text-gray-300 border-b border-gray-600 pb-2">All YouTube Tasks</h3>
                <input 
                    type="text" 
                    placeholder="Search tasks..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-md border border-gray-200 dark:border-gray-600 mb-4 text-sm"
                />
                <div className="space-y-3 overflow-y-auto h-full pr-2">
                    {state.youtubeTasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())).map(task => (
                        <div key={task.id} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg flex justify-between items-center border border-gray-200 dark:border-gray-700">
                            <div className="min-w-0">
                                <h4 className="font-semibold text-gray-900 dark:text-white truncate">{task.title}</h4>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    <span className="text-[10px] bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded uppercase font-bold">{task.reward} {state.tokenConfigs[task.rewardToken]?.name || task.rewardToken}</span>
                                    <span className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded uppercase font-bold">{task.timerInSeconds}s Wait</span>
                                    {task.verificationMethod === 'code' && <span className="text-[10px] bg-green-900/50 text-green-300 px-1.5 py-0.5 rounded">Code</span>}
                                    {task.verificationMethod === 'timer' && <span className="text-[10px] bg-yellow-900/50 text-yellow-300 px-1.5 py-0.5 rounded">Timer</span>}
                                    {(task.verificationMethod === 'screenshot' || task.verificationMethod === 'both') && <span className="text-[10px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded">Proof</span>}
                                    {task.limit && <span className="text-[10px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded">L: {task.claimCount || 0}/{task.limit}</span>}
                                    {task.endTime && new Date(task.endTime) < new Date() && <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">EXPIRED</span>}
                                </div>
                            </div>
                            <div className="flex space-x-2 shrink-0">
                                <button onClick={() => handleEdit(task)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded text-sm transition">Edit</button>
                                <button onClick={() => { setItemToDelete(task.id); setIsDeleteModalOpen(true); }} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded text-sm transition">Del</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default YouTubeTaskManager;
