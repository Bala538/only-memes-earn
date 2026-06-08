
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import ParachuteIcon from '../icons/ParachuteIcon';
import { UserData } from '../../types';

const USERS_KEY = 'cryptoVidUsers';

const AirdropManager: React.FC = () => {
    const { state, adminUpdateAirdropConfig } = useContext(AppContext);
    const { airdropConfig } = state;

    const [title, setTitle] = useState(airdropConfig.title);
    const [description, setDescription] = useState(airdropConfig.description);
    const [imageUrl, setImageUrl] = useState(airdropConfig.imageUrl);
    const [isActive, setIsActive] = useState(airdropConfig.isActive);
    const [date, setDate] = useState(airdropConfig.date || '');
    const [allowAddressSubmission, setAllowAddressSubmission] = useState(airdropConfig.allowAddressSubmission || false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    
    const [participants, setParticipants] = useState<{email: string, address: string}[]>([]);
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    useEffect(() => {
        const loadParticipants = () => {
            try {
                const usersRaw = localStorage.getItem(USERS_KEY);
                if (usersRaw) {
                    const users: Record<string, UserData> = JSON.parse(usersRaw);
                    const list = Object.values(users)
                        .filter(u => u.airdropAddress)
                        .map(u => ({ email: u.email, address: u.airdropAddress! }));
                    setParticipants(list);
                }
            } catch (e) {
                console.error("Error parsing users", e);
            }
        };
        loadParticipants();
        const interval = setInterval(loadParticipants, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleSave = () => {
        setSaveStatus('saving');
        adminUpdateAirdropConfig({
            title,
            description,
            imageUrl,
            isActive,
            date: date || undefined,
            allowAddressSubmission
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback(text);
        setTimeout(() => setCopyFeedback(null), 2000);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Configuration */}
            <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl">
                <h2 className="text-2xl font-bold mb-6 text-purple-400 border-b-2 border-purple-400 pb-2 flex items-center space-x-2">
                    <ParachuteIcon className="w-7 h-7" />
                    <span>Airdrop Configuration</span>
                </h2>
                
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div>
                            <h3 className="text-gray-900 dark:text-white font-bold">Show Airdrop Section</h3>
                            <p className="text-sm text-gray-400">Toggle visibility in user profile</p>
                        </div>
                        <label className="inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={isActive} 
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div>
                            <h3 className="text-gray-900 dark:text-white font-bold">Enable Address Submission</h3>
                            <p className="text-sm text-gray-400">Allow users to submit their wallet address</p>
                        </div>
                        <label className="inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={allowAddressSubmission} 
                                onChange={(e) => setAllowAddressSubmission(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Launch Date (Optional)</label>
                        <input
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty to show "Coming Soon".</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            placeholder="e.g. Official Airdrop"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none h-24 resize-none"
                            placeholder="e.g. Listing is coming soon..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Image URL (Optional)</label>
                        <input 
                            type="text" 
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            placeholder="https://..."
                        />
                        {imageUrl && (
                            <div className="mt-2 relative h-32 w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleSave} 
                        disabled={saveStatus === 'saving'}
                        className={`w-full py-3 rounded-lg font-bold transition-colors shadow-lg ${saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                    >
                        {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Changes Saved!' : 'Save Settings'}
                    </button>
                </div>
            </div>

            {/* Right Column: Participants List */}
            <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl lg:max-h-[calc(100vh-15rem)] flex flex-col">
                <h2 className="text-xl font-bold mb-4 text-purple-400 border-b border-gray-700 pb-2 flex justify-between items-center">
                    <span>Submitted Addresses</span>
                    <span className="text-sm bg-purple-900/50 text-purple-300 px-2 py-1 rounded-full">{participants.length}</span>
                </h2>
                
                <div className="space-y-3 overflow-y-auto pr-2 flex-grow">
                    {participants.length > 0 ? participants.map((p, idx) => (
                        <div key={idx} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{p.email}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-black/30 p-2 rounded border border-gray-700/50">
                                <span className="text-xs text-gray-300 font-mono break-all flex-grow">{p.address}</span>
                                <button 
                                    onClick={() => handleCopy(p.address)}
                                    className="text-xs text-purple-400 hover:text-purple-300 font-bold whitespace-nowrap"
                                >
                                    {copyFeedback === p.address ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                            <ParachuteIcon className="w-12 h-12 mb-2 opacity-50" />
                            <p>No addresses submitted yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AirdropManager;
