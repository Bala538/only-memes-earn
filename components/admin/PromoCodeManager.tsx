import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { PromoCode, Token } from '../../types';
import GiftIcon from '../icons/GiftIcon';
import UsersIcon from '../icons/UsersIcon';
import ConfirmationModal from '../ConfirmationModal';

const PromoCodeManager: React.FC = () => {
    const { state, addPromoCode, removePromoCode, adminUpdateReferralConfig } = useContext(AppContext);
    const [code, setCode] = useState('');
    const [reward, setReward] = useState('');
    const [rewardToken, setRewardToken] = useState<Token>('BabyDoge');
    const [maxUses, setMaxUses] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    
    // Referral Config State
    const [referralAmount, setReferralAmount] = useState(state.referralConfig.amount.toString());
    const [referralToken, setReferralToken] = useState<Token>(state.referralConfig.token);
    const [referralEnabled, setReferralEnabled] = useState(state.referralConfig.enabled);
    const [referralSaveStatus, setReferralSaveStatus] = useState<'idle' | 'saved'>('idle');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const generateRandomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCode(result);
    };

    const handleSaveReferralConfig = () => {
        const amount = parseFloat(referralAmount);
        if (isNaN(amount) || amount < 0) {
            alert("Please enter a valid referral reward amount.");
            return;
        }
        adminUpdateReferralConfig({
            amount,
            token: referralToken,
            enabled: referralEnabled
        });
        setReferralSaveStatus('saved');
        setTimeout(() => setReferralSaveStatus('idle'), 2000);
    };

    const handleSubmit = async () => {
        if (!code || !reward) {
            setError('Code and Reward are required.');
            return;
        }
        
        const rewardAmount = parseFloat(reward);
        if (isNaN(rewardAmount) || rewardAmount <= 0) {
            setError('Invalid reward amount.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const newCode: PromoCode = {
                id: new Date().toISOString(),
                code: code.trim(),
                reward: rewardAmount,
                rewardToken,
                maxUses: maxUses ? parseInt(maxUses) : undefined,
                currentUses: 0,
                expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined
            };

            await addPromoCode(newCode);
            
            // Reset form
            setCode('');
            setReward('');
            setRewardToken('BabyDoge');
            setMaxUses('');
            setExpiryDate('');
        } catch (err: any) {
            console.error("Failed to save promo code:", err);
            if (err instanceof Error) {
                setError(`Error: ${err.message}`);
            } else {
                setError('An unknown error occurred while saving the promo code.');
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
            removePromoCode(itemToDelete);
            setItemToDelete(null);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmRemove}
                title="Remove Promo Code"
                message="Are you sure you want to remove this promo code? Users will no longer be able to redeem it."
            />
            
            <div className="space-y-8">
                {/* Referral Configuration Card */}
                <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl border border-gray-200 dark:border-blue-500/30">
                    <h2 className="text-2xl font-bold mb-4 text-blue-400 flex items-center space-x-2">
                        <UsersIcon className="w-7 h-7" />
                        <span>Referral Configuration</span>
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm text-gray-300">Enable Referral Rewards</label>
                            <label className="inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={referralEnabled} 
                                    onChange={(e) => setReferralEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Reward Per Invite</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={referralAmount}
                                    onChange={(e) => setReferralAmount(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="e.g. 50"
                                />
                                <select 
                                    value={referralToken} 
                                    onChange={(e) => setReferralToken(e.target.value as Token)} 
                                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none w-32"
                                >
                                    {state.availableTokens.map(token => <option key={token} value={token}>{state.tokenConfigs[token]?.name || token}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleSaveReferralConfig} 
                            className={`w-full py-3 rounded-lg font-bold transition-colors shadow-lg ${referralSaveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        >
                            {referralSaveStatus === 'saved' ? 'Saved Successfully!' : 'Save Referral Settings'}
                        </button>
                    </div>
                </div>

                {/* Promo Code Creation Card */}
                <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl">
                    <h2 className="text-2xl font-bold mb-4 text-pink-400 border-b-2 border-pink-400 pb-2 flex items-center space-x-2">
                        <GiftIcon className="w-7 h-7" />
                        <span>Create Promo Code</span>
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Promo Code</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="e.g., WELCOME2024"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                                />
                                <button onClick={generateRandomCode} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white px-3 rounded-md text-sm">
                                    Generate
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Reward Amount</label>
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    value={reward}
                                    onChange={(e) => setReward(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Token</label>
                                <select 
                                    value={rewardToken} 
                                    onChange={(e) => setRewardToken(e.target.value as Token)} 
                                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                                >
                                    {state.availableTokens.map(token => <option key={token} value={token}>{state.tokenConfigs[token]?.name || token}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Max Uses (Optional)</label>
                                <input
                                    type="number"
                                    placeholder="Unlimited"
                                    value={maxUses}
                                    onChange={(e) => setMaxUses(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Expiry Date (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-gray-500 flex items-center justify-center"
                        >
                             {isSubmitting ? 'Creating...' : 'Create Promo Code'}
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl lg:max-h-[calc(100vh-15rem)]">
                <h2 className="text-2xl font-bold mb-4 text-pink-400 border-b-2 border-pink-400 pb-2">All Codes</h2>
                <div className="space-y-4 overflow-y-auto h-full pr-2">
                    {state.promoCodes.map(item => (
                        <div key={item.id} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white font-mono">{item.code}</h3>
                                    <span className="text-xs bg-pink-900/50 text-pink-300 px-2 py-0.5 rounded-full border border-pink-800">
                                        {item.reward.toLocaleString()} {state.tokenConfigs[item.rewardToken]?.name || item.rewardToken}
                                    </span>
                                    {item.expiryDate && new Date(item.expiryDate) < new Date() && (
                                        <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">EXPIRED</span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-400 mt-1 space-y-0.5">
                                    <p>Uses: <span className="text-gray-300">{item.currentUses}</span> {item.maxUses ? `/ ${item.maxUses}` : '(Unlimited)'}</p>
                                    {item.expiryDate && <p>Expires: {new Date(item.expiryDate).toLocaleString()}</p>}
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemoveClick(item.id)}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded transition"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    {state.promoCodes.length === 0 && <p className="text-gray-500 text-center mt-4">No active promo codes.</p>}
                </div>
            </div>
        </div>
    );
};

export default PromoCodeManager;