
import { useState, useContext, ChangeEvent } from 'react';
import { AppContext } from '../../context/AppContext';
import TokenIcon from '../icons/TokenIcon';
import ConfirmationModal from '../ConfirmationModal';
import UploadIcon from '../icons/UploadIcon';

const TokenManager: React.FC = () => {
    const { state, addToken, removeToken, updateTokenLogo, updateTokenName } = useContext(AppContext);
    const [newTokenSymbol, setNewTokenSymbol] = useState('');
    const [newTokenName, setNewTokenName] = useState('');
    const [error, setError] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [tokenToDelete, setTokenToDelete] = useState<string | null>(null);

    // Edit Mode State
    const [editingToken, setEditingToken] = useState<string | null>(null);
    const [tempLogoUrl, setTempLogoUrl] = useState<string | null>(null);
    const [tempName, setTempName] = useState<string>('');

    const handleAddToken = () => {
        if (!newTokenSymbol.trim()) {
            setError('Token symbol is required.');
            return;
        }
        if (state.availableTokens.includes(newTokenSymbol.trim())) {
            setError('Token already exists.');
            return;
        }
        addToken(newTokenSymbol.trim(), newTokenName.trim() || newTokenSymbol.trim());
        setNewTokenSymbol('');
        setNewTokenName('');
        setError('');
    };

    const handleRemoveClick = (token: string) => {
        setTokenToDelete(token);
        setIsDeleteModalOpen(true);
    };

    const confirmRemove = () => {
        if (tokenToDelete) {
            removeToken(tokenToDelete);
            setTokenToDelete(null);
        }
    };

    const resizeImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 256;
                    canvas.height = 256;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Canvas context not available'));
                        return;
                    }
                    ctx.clearRect(0, 0, 256, 256);
                    
                    const scale = Math.min(256 / img.width, 256 / img.height);
                    const w = img.width * scale;
                    const h = img.height * scale;
                    const x = (256 - w) / 2;
                    const y = (256 - h) / 2;
                    
                    ctx.drawImage(img, x, y, w, h);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file.');
                return;
            }
            
            const resizedUrl = await resizeImage(file);
            setTempLogoUrl(resizedUrl);
        } catch (err) {
            console.error("Error processing image", err);
            alert("Failed to process image.");
        }
    };

    const startEditing = (token: string) => {
        setEditingToken(token);
        setTempLogoUrl(state.tokenLogos[token] || null);
        setTempName(state.tokenConfigs[token]?.name || token);
    };

    const saveChanges = (token: string) => {
        if (tempLogoUrl !== null) {
            updateTokenLogo(token, tempLogoUrl);
        }
        if (tempName.trim()) {
            updateTokenName(token, tempName.trim());
        }
        setEditingToken(null);
        setTempLogoUrl(null);
        setTempName('');
    };

    const resetToDefault = (token: string) => {
        updateTokenLogo(token, '');
        setEditingToken(null);
        setTempLogoUrl(null);
        setTempName('');
    };

    const cancelEdit = () => {
        setEditingToken(null);
        setTempLogoUrl(null);
        setTempName('');
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmRemove}
                title="Remove Token"
                message={`Are you sure you want to remove ${tokenToDelete}? Users will no longer see it in their wallet or be able to earn it.`}
            />
            <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl">
                <h2 className="text-2xl font-bold mb-4 text-yellow-400 border-b-2 border-yellow-400 pb-2 flex items-center space-x-2">
                    <TokenIcon token="BabyDoge" className="w-7 h-7" />
                    <span>Manage Tokens</span>
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Add New Token</label>
                        <div className="flex flex-col gap-2">
                            <input
                                type="text"
                                placeholder="Symbol (e.g. DOGE)"
                                value={newTokenSymbol}
                                onChange={(e) => setNewTokenSymbol(e.target.value)}
                                className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                            />
                            <input
                                type="text"
                                placeholder="Name (e.g. Dogecoin)"
                                value={newTokenName}
                                onChange={(e) => setNewTokenName(e.target.value)}
                                className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                            />
                            <button 
                                onClick={handleAddToken} 
                                className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-4 py-3 rounded-md transition whitespace-nowrap mt-2"
                            >
                                Add Token
                            </button>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </div>
                    <p className="text-xs text-gray-500">Adding a token will make it available for withdrawals, rewards, and games. Use the exact symbol (case-sensitive recommended).</p>
                </div>
            </div>

            <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl lg:max-h-[calc(100vh-15rem)] flex flex-col">
                <h2 className="text-2xl font-bold mb-4 text-yellow-400 border-b-2 border-yellow-400 pb-2">Available Tokens</h2>
                <div className="space-y-3 overflow-y-auto pr-2 flex-grow">
                    {state.availableTokens.map(token => (
                        <div key={token} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center space-x-3">
                                    <TokenIcon token={token} className="w-10 h-10 bg-gray-100 dark:bg-gray-900 rounded-full p-1" />
                                    <div>
                                        <div className="text-gray-900 dark:text-white font-bold text-lg">{token}</div>
                                        {state.tokenConfigs[token]?.name && state.tokenConfigs[token].name !== token && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{state.tokenConfigs[token].name}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    {editingToken !== token && (
                                        <>
                                            <button 
                                                onClick={() => startEditing(token)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded transition"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleRemoveClick(token)}
                                                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1.5 px-3 rounded transition"
                                            >
                                                Remove
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            {editingToken === token && (
                                <div className="mt-3 bg-gray-100 dark:bg-gray-900/50 p-3 rounded border border-gray-300 dark:border-gray-600 animate-fade-in">
                                    <div className="mb-4">
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Token Name</label>
                                        <input
                                            type="text"
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            placeholder="e.g. Bitcoin"
                                            className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-yellow-500 focus:outline-none text-sm"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-16 h-16 bg-black rounded-full border border-gray-500 flex items-center justify-center overflow-hidden relative">
                                            {tempLogoUrl ? (
                                                <img src={tempLogoUrl} alt="Preview" className="w-full h-full object-contain" />
                                            ) : (
                                                <TokenIcon token={token} className="w-12 h-12 opacity-50" />
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <label className="flex items-center justify-center w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-xs font-bold rounded cursor-pointer transition">
                                                <UploadIcon className="w-4 h-4 mr-2" />
                                                Upload New Logo (PNG)
                                                <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleLogoUpload} />
                                            </label>
                                            <p className="text-[10px] text-gray-500 mt-1 text-center">Auto-resized to 256x256px</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => resetToDefault(token)}
                                            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs font-bold px-3 py-1.5"
                                        >
                                            Reset to Default
                                        </button>
                                        <button 
                                            onClick={cancelEdit}
                                            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-xs font-bold px-3 py-1.5 rounded"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={() => saveChanges(token)}
                                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-1.5 rounded shadow-lg"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {state.availableTokens.length === 0 && <p className="text-gray-500 text-center mt-4">No tokens configured.</p>}
                </div>
            </div>
        </div>
    );
};

export default TokenManager;
