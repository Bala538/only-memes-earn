import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Game, Token, SwapOption, DepositMethod } from '../../types';
import GameControllerIcon from '../icons/GameControllerIcon';
import ConfirmationModal from '../ConfirmationModal';

const GameManager: React.FC = () => {
    const { state, addGame, updateGame, removeGame } = useContext(AppContext);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [gameUrl, setGameUrl] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [reward, setReward] = useState('');
    const [rewardToken, setRewardToken] = useState<Token>('BabyDoge');
    const [timerSeconds, setTimerSeconds] = useState('60');
    // Advanced Config
    const [maxEnergy, setMaxEnergy] = useState('');
    const [earningLimit, setEarningLimit] = useState('');
    
    // New Feature Configs
    const [swapOptions, setSwapOptions] = useState<SwapOption[]>([]);
    const [depositEnabled, setDepositEnabled] = useState(false);
    const [depositMethods, setDepositMethods] = useState<DepositMethod[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // Helpers for dynamic arrays
    const addSwapOption = () => {
        setSwapOptions([...swapOptions, { token: state.availableTokens[0], rate: 10, enabled: true }]);
    };
    const updateSwapOption = (index: number, field: keyof SwapOption, value: any) => {
        const newOptions = [...swapOptions];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setSwapOptions(newOptions);
    };
    const removeSwapOption = (index: number) => {
        setSwapOptions(swapOptions.filter((_, i) => i !== index));
    };

    const addDepositMethod = () => {
        setDepositMethods([...depositMethods, { label: '', value: '' }]);
    };
    const updateDepositMethod = (index: number, field: keyof DepositMethod, value: any) => {
        const newMethods = [...depositMethods];
        newMethods[index] = { ...newMethods[index], [field]: value };
        setDepositMethods(newMethods);
    };
    const removeDepositMethod = (index: number) => {
        setDepositMethods(depositMethods.filter((_, i) => i !== index));
    };

    const handleEdit = (game: Game) => {
        setTitle(game.title);
        setDescription(game.description);
        setGameUrl(game.gameUrl);
        setImageUrl(game.imageUrl);
        setReward(game.reward.toString());
        setRewardToken(game.rewardToken);
        setTimerSeconds(game.timerSeconds.toString());
        setMaxEnergy(game.maxEnergy ? game.maxEnergy.toString() : '');
        setEarningLimit(game.earningLimit ? game.earningLimit.toString() : '');
        
        setSwapOptions(game.swapOptions || []);
        setDepositEnabled(game.depositConfig?.enabled || false);
        setDepositMethods(game.depositConfig?.methods || []);

        setEditingId(game.id);
        setError('');
    };

    const handleCancelEdit = () => {
        setTitle('');
        setDescription('');
        setGameUrl('');
        setImageUrl('');
        setReward('');
        setRewardToken('BabyDoge');
        setTimerSeconds('60');
        setMaxEnergy('');
        setEarningLimit('');
        setSwapOptions([]);
        setDepositEnabled(false);
        setDepositMethods([]);
        setEditingId(null);
        setError('');
    };

    const handleSubmit = async () => {
        if (!title || !description || !gameUrl || !reward || !timerSeconds) {
            setError('Please fill in all required fields.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const newGame: Game = {
                id: editingId || new Date().toISOString(),
                title,
                description,
                gameUrl,
                imageUrl,
                reward: parseFloat(reward),
                rewardToken,
                timerSeconds: parseInt(timerSeconds),
                maxEnergy: maxEnergy ? parseInt(maxEnergy) : undefined,
                earningLimit: earningLimit ? parseInt(earningLimit) : undefined,
                swapOptions: swapOptions,
                depositConfig: {
                    enabled: depositEnabled,
                    methods: depositMethods
                }
            };

            if (editingId) {
                await updateGame(newGame);
            } else {
                await addGame(newGame);
            }
            handleCancelEdit();
        } catch (err: any) {
            console.error("Failed to save game:", err);
            if (err instanceof Error) {
                setError(`Error: ${err.message}`);
            } else {
                setError('An unknown error occurred while saving the game.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveClick = (id: string) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmRemove = () => {
        if (itemToDelete) {
            removeGame(itemToDelete);
            setItemToDelete(null);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmRemove}
                title="Remove Game"
                message="Are you sure you want to remove this game? This action cannot be undone."
            />
            <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl">
                <h2 className="text-2xl font-bold mb-4 text-indigo-400 border-b-2 border-indigo-400 pb-2 flex items-center space-x-2">
                    <GameControllerIcon className="w-7 h-7" />
                    <span>{editingId ? 'Edit Game' : 'Add New Game'}</span>
                </h2>
                <div className="space-y-4">
                    {editingId && (
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-400">Editing: {title}</span>
                            <button onClick={handleCancelEdit} className="text-sm text-indigo-400 hover:text-indigo-300">Cancel Edit</button>
                        </div>
                    )}
                    <input
                        type="text"
                        placeholder="Game Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <textarea
                        placeholder="Game Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none"
                    />
                    <input
                        type="text"
                        placeholder="Game URL (Embed/Iframe URL or 'local:tap-to-earn')"
                        value={gameUrl}
                        onChange={(e) => setGameUrl(e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <input
                        type="text"
                        placeholder="Thumbnail Image URL (Optional)"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-gray-400 mb-1">Play Timer (sec)</label>
                            <input 
                                type="number" 
                                placeholder="Seconds" 
                                value={timerSeconds} 
                                onChange={(e) => setTimerSeconds(e.target.value)} 
                                className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                            />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-400 mb-1">Reward Amount</label>
                            <input 
                                type="number" 
                                placeholder="Reward" 
                                value={reward} 
                                onChange={(e) => setReward(e.target.value)} 
                                className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                            />
                        </div>
                    </div>
                    <select value={rewardToken} onChange={(e) => setRewardToken(e.target.value as Token)} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                        {state.availableTokens.map(token => <option key={token} value={token}>{state.tokenConfigs[token]?.name || token}</option>)}
                    </select>

                    {/* Advanced Config Section */}
                    <div className="border-t border-gray-600 pt-4 mt-4">
                        <h3 className="text-sm font-bold text-indigo-300 mb-2">Advanced Config</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Max Energy (Tap Game)</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g., 10000" 
                                    value={maxEnergy} 
                                    onChange={(e) => setMaxEnergy(e.target.value)} 
                                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Earning Limit</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g., 50000" 
                                    value={earningLimit} 
                                    onChange={(e) => setEarningLimit(e.target.value)} 
                                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" 
                                />
                            </div>
                        </div>

                        {/* Swap Options Configuration */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-medium text-gray-400">Swap Options</label>
                                <button type="button" onClick={addSwapOption} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-500">+ Add Token</button>
                            </div>
                            {swapOptions.map((opt, idx) => (
                                <div key={idx} className="flex gap-2 mb-2 items-center bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                    <select 
                                        value={opt.token} 
                                        onChange={(e) => updateSwapOption(idx, 'token', e.target.value)}
                                        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs p-1 rounded border border-gray-200 dark:border-gray-600 flex-1"
                                    >
                                        {state.availableTokens.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <input 
                                        type="number" 
                                        placeholder="Rate" 
                                        value={opt.rate} 
                                        onChange={(e) => updateSwapOption(idx, 'rate', parseFloat(e.target.value))} 
                                        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs p-1 rounded border border-gray-200 dark:border-gray-600 w-20"
                                    />
                                    <label className="flex items-center space-x-1 cursor-pointer">
                                        <input type="checkbox" checked={opt.enabled} onChange={(e) => updateSwapOption(idx, 'enabled', e.target.checked)} className="rounded bg-gray-700 border-gray-600 text-indigo-500" />
                                        <span className="text-[10px] text-gray-400">On</span>
                                    </label>
                                    <button type="button" onClick={() => removeSwapOption(idx)} className="text-red-400 hover:text-red-300">
                                        &times;
                                    </button>
                                </div>
                            ))}
                            {swapOptions.length === 0 && <p className="text-xs text-gray-500 italic">No swap options configured.</p>}
                        </div>

                        {/* Deposit Configuration */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" checked={depositEnabled} onChange={(e) => setDepositEnabled(e.target.checked)} className="rounded bg-gray-700 border-gray-600 text-indigo-500" />
                                    <span className="text-xs font-medium text-gray-400 font-bold">Enable Deposits</span>
                                </label>
                                {depositEnabled && <button type="button" onClick={addDepositMethod} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-500">+ Add Method</button>}
                            </div>
                            
                            {depositEnabled && (
                                <div className="space-y-2">
                                    {depositMethods.map((method, idx) => (
                                        <div key={idx} className="bg-gray-100 dark:bg-gray-800 p-2 rounded flex flex-col gap-2 relative border border-gray-200 dark:border-gray-700">
                                            <button type="button" onClick={() => removeDepositMethod(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-300 text-xs font-bold">Remove</button>
                                            <input 
                                                type="text" 
                                                placeholder="Label (e.g. BEP20 Address)" 
                                                value={method.label} 
                                                onChange={(e) => updateDepositMethod(idx, 'label', e.target.value)}
                                                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs p-1 rounded border border-gray-200 dark:border-gray-600 w-full"
                                            />
                                            <input 
                                                type="text" 
                                                placeholder="Value (e.g. 0x123...)" 
                                                value={method.value} 
                                                onChange={(e) => updateDepositMethod(idx, 'value', e.target.value)}
                                                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs p-1 rounded border border-gray-200 dark:border-gray-600 w-full font-mono"
                                            />
                                        </div>
                                    ))}
                                    {depositMethods.length === 0 && <p className="text-xs text-gray-500 italic">No deposit methods configured.</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-gray-500 flex items-center justify-center"
                    >
                         {isSubmitting ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Game' : 'Add Game')}
                    </button>
                </div>
            </div>
            <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl lg:max-h-[calc(100vh-15rem)]">
                <h2 className="text-2xl font-bold mb-4 text-indigo-400 border-b-2 border-indigo-400 pb-2">Manage Games</h2>
                <div className="space-y-3 overflow-y-auto h-full pr-2">
                    {state.games.map(game => (
                        <div key={game.id} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">{game.title}</h3>
                                <p className="text-sm text-gray-400 line-clamp-1">{game.description}</p>
                                <p className="text-xs text-yellow-400 font-mono mt-1">
                                    {game.reward} {state.tokenConfigs[game.rewardToken]?.name || game.rewardToken} • {game.timerSeconds}s
                                </p>
                                <div className="flex gap-2 mt-1">
                                    {game.swapOptions && game.swapOptions.length > 0 && <span className="text-[10px] bg-indigo-900 text-indigo-300 px-1 rounded">Swaps: {game.swapOptions.length}</span>}
                                    {game.depositConfig?.enabled && <span className="text-[10px] bg-green-900 text-green-300 px-1 rounded">Deposits ON</span>}
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleEdit(game)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-md transition duration-300 text-sm"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleRemoveClick(game.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md transition duration-300 text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                    {state.games.length === 0 && <p className="text-gray-500 text-center mt-4">No games added yet.</p>}
                </div>
            </div>
        </div>
    );
};

export default GameManager;