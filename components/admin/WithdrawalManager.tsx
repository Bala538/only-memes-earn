
import React, { useState, useEffect, useContext, useMemo, ChangeEvent } from 'react';
import { AppContext } from '../../context/AppContext';
import { Withdrawal, UserData, Token, WithdrawalSetting } from '../../types';
import HistoryIcon from '../icons/HistoryIcon';
import TokenIcon from '../icons/TokenIcon';
import UsersIcon from '../icons/UsersIcon';
import UploadIcon from '../icons/UploadIcon';

interface AggregatedWithdrawal extends Withdrawal {
    userEmail: string;
    userDisplayName?: string;
    userPhotoURL?: string;
}

const StatusBadge: React.FC<{ status: Withdrawal['status'] }> = ({ status }) => {
    const statusStyles = {
        pending: 'bg-yellow-500/20 text-yellow-400',
        processing: 'bg-blue-500/20 text-blue-400',
        completed: 'bg-green-500/20 text-green-400',
        rejected: 'bg-red-500/20 text-red-400'
    };
    const safeStatus = status || 'pending';
    const text = safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[safeStatus] || statusStyles.pending}`}>
            {text}
        </span>
    );
};

const WithdrawalStatusChanger: React.FC<{ withdrawal: AggregatedWithdrawal }> = ({ withdrawal }) => {
    const { adminUpdateWithdrawalStatus } = useContext(AppContext);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = (newStatus: Withdrawal['status']) => {
        setIsUpdating(true);
        adminUpdateWithdrawalStatus(withdrawal.userEmail, withdrawal.id, newStatus);
        setTimeout(() => setIsUpdating(false), 1000); 
    };

    if (withdrawal.status === 'completed' || withdrawal.status === 'rejected') {
        return null;
    }

    return (
        <div className="flex space-x-2">
            <button
                onClick={() => handleUpdate('rejected')}
                disabled={isUpdating}
                className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-md transition duration-300 disabled:bg-gray-500"
            >
                {isUpdating ? '...' : 'Reject'}
            </button>
            {withdrawal.status === 'pending' && (
                <button
                    onClick={() => handleUpdate('processing')}
                    disabled={isUpdating}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md transition duration-300 disabled:bg-gray-500"
                >
                    {isUpdating ? '...' : 'Processing'}
                </button>
            )}
            <button
                onClick={() => handleUpdate('completed')}
                disabled={isUpdating}
                className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-md transition duration-300 disabled:bg-gray-500"
            >
                {isUpdating ? '...' : 'Completed'}
            </button>
        </div>
    );
};

const WithdrawalManager: React.FC = () => {
    const { state, adminUpdateWithdrawalSettings } = useContext(AppContext);
    const { allUsers } = state;
    const [allWithdrawals, setAllWithdrawals] = useState<AggregatedWithdrawal[]>([]);
    const [groupBy, setGroupBy] = useState<'user' | 'recipient'>('user');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Config State
    const [settings, setSettings] = useState<Record<Token, WithdrawalSetting>>(state.withdrawalSettings);
    const [showSettings, setShowSettings] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    useEffect(() => {
        setSettings(state.withdrawalSettings);
    }, [state.withdrawalSettings]);

    useEffect(() => {
        const withdrawals: AggregatedWithdrawal[] = [];
        allUsers.forEach(user => {
            if (user.withdrawals && user.withdrawals.length > 0) {
                user.withdrawals.forEach(withdrawal => {
                    withdrawals.push({
                        ...withdrawal,
                        userEmail: user.email,
                        userDisplayName: user.displayName,
                        userPhotoURL: user.photoURL,
                    });
                });
            }
        });

        withdrawals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAllWithdrawals(withdrawals);
    }, [allUsers]);

    const handleSettingChange = (token: Token, field: keyof WithdrawalSetting, value: any) => {
        setSettings(prev => ({
            ...prev,
            [token]: {
                ...prev[token],
                [field]: value
            }
        }));
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, token: Token) => {
        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            handleSettingChange(token, 'depositQrCodeUrl', objectUrl);
        }
    };

    const handleSaveSettings = () => {
        setSaveStatus('saving');
        adminUpdateWithdrawalSettings(settings);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    };

    const filteredWithdrawals = useMemo(() => {
        if (!searchQuery.trim()) return allWithdrawals;
        const lowerQuery = searchQuery.toLowerCase();
        return allWithdrawals.filter(w => 
            w.userEmail.toLowerCase().includes(lowerQuery) ||
            w.recipientAddress.toLowerCase().includes(lowerQuery) ||
            w.id.toLowerCase().includes(lowerQuery)
        );
    }, [allWithdrawals, searchQuery]);

    const groupedByUser = useMemo(() => {
        return filteredWithdrawals.reduce<Record<string, AggregatedWithdrawal[]>>((acc, w) => {
            if (!acc[w.userEmail]) {
                acc[w.userEmail] = [];
            }
            acc[w.userEmail].push(w);
            return acc;
        }, {});
    }, [filteredWithdrawals]);

    const groupedByRecipientAddress = useMemo(() => {
        return filteredWithdrawals.reduce<Record<string, AggregatedWithdrawal[]>>((acc, w) => {
            if (!acc[w.recipientAddress]) {
                acc[w.recipientAddress] = [];
            }
            acc[w.recipientAddress].push(w);
            return acc;
        }, {});
    }, [filteredWithdrawals]);

    const renderByUser = () => {
        const users = Object.keys(groupedByUser);
        if (users.length === 0) {
            return <p className="text-gray-500 dark:text-gray-400 text-center mt-8">No withdrawal history from any user yet.</p>;
        }
        return users.map(email => {
            const userWithdrawals = groupedByUser[email];
            const firstWithdrawal = userWithdrawals[0];
            return (
            <div key={email} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-2">
                    {firstWithdrawal?.userPhotoURL ? (
                        <img src={firstWithdrawal.userPhotoURL} alt="Avatar" className="w-5 h-5 rounded-full object-cover shrink-0" />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                            {(firstWithdrawal?.userDisplayName || email).charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span>{firstWithdrawal?.userDisplayName ? `${firstWithdrawal.userDisplayName} (${email})` : email}</span>
                </h3>
                <div className="space-y-2">
                    {userWithdrawals.map(w => (
                         <div key={w.id} className="bg-white dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start gap-2">
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white text-sm flex items-center space-x-2"><TokenIcon token={w.token} className="w-4 h-4" /><span>{w.amount.toLocaleString()} {state.tokenConfigs[w.token]?.name || w.token}</span></div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">To {w.method?.toUpperCase()}: <span className="font-mono">{w.recipientAddress}</span></p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">TxID: <span className="font-mono">{w.id}</span></p>
                                    {w.exchange && <p className="text-xs text-orange-400 mt-0.5 font-bold">Exchange: {w.exchange}</p>}
                                </div>
                                <div className="text-right">
                                    <StatusBadge status={w.status} />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(w.timestamp).toLocaleDateString()}</p>
                                </div>
                            </div>
                            {(w.status === 'pending' || w.status === 'processing') && <div className="border-t border-gray-200 dark:border-gray-700/50 mt-2 pt-2 flex justify-end"><WithdrawalStatusChanger withdrawal={w} /></div>}
                        </div>
                    ))}
                </div>
            </div>
            );
        });
    };

    const renderByRecipientAddress = () => {
        const uids = Object.keys(groupedByRecipientAddress);
        if (uids.length === 0) {
            return <p className="text-gray-500 dark:text-gray-400 text-center mt-8">No withdrawal history from any user yet.</p>;
        }
        return uids.map(uid => (
             <div key={uid} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    Destination: <span className="font-mono">{uid}</span>
                </h3>
                <div className="space-y-2">
                    {groupedByRecipientAddress[uid].map(w => (
                         <div key={w.id} className="bg-white dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start gap-2">
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white text-sm flex items-center space-x-2"><TokenIcon token={w.token} className="w-4 h-4" /><span>{w.amount.toLocaleString()} {state.tokenConfigs[w.token]?.name || w.token}</span></div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">From: <span className="font-mono">{w.userDisplayName ? `${w.userDisplayName} (${w.userEmail})` : w.userEmail}</span> ({w.method?.toUpperCase()})</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">TxID: <span className="font-mono">{w.id}</span></p>
                                    {w.exchange && <p className="text-xs text-orange-400 mt-0.5 font-bold">Exchange: {w.exchange}</p>}
                                </div>
                                <div className="text-right">
                                    <StatusBadge status={w.status} />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(w.timestamp).toLocaleDateString()}</p>
                                </div>
                            </div>
                            {(w.status === 'pending' || w.status === 'processing') && <div className="border-t border-gray-200 dark:border-gray-700/50 mt-2 pt-2 flex justify-end"><WithdrawalStatusChanger withdrawal={w} /></div>}
                        </div>
                    ))}
                </div>
            </div>
        ));
    };

    return (
            <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-purple-400">
                <h2 className="text-2xl font-bold text-purple-400 flex items-center space-x-2">
                    <HistoryIcon className="w-7 h-7" />
                    <span>Withdrawals & Swaps</span>
                </h2>
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 text-gray-900 dark:text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0 .55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107 1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{showSettings ? 'Hide Configuration' : 'Configure Settings'}</span>
                </button>
            </div>

            {showSettings && (
                <div className="mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700 animate-fade-in">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Withdrawal & Swap Configuration</h3>
                    <div className="grid grid-cols-1 gap-6">
                        {state.availableTokens.map(token => (
                            <div key={token} className="bg-white dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center space-x-2">
                                        <TokenIcon token={token} className="w-6 h-6" />
                                        <span className="font-bold text-gray-900 dark:text-white">{state.tokenConfigs[token]?.name || token}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <label className="inline-flex items-center cursor-pointer mr-3">
                                            <span className="mr-2 text-xs font-medium text-gray-700 dark:text-gray-300">{settings[token]?.enabled ? 'Withdrawals On' : 'Withdrawals Off'}</span>
                                            <input 
                                                type="checkbox" 
                                                checked={settings[token]?.enabled ?? true} 
                                                onChange={(e) => handleSettingChange(token, 'enabled', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="relative w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Min Amount</label>
                                        <input 
                                            type="number" 
                                            value={settings[token]?.minAmount ?? ''} 
                                            onChange={(e) => handleSettingChange(token, 'minAmount', parseInt(e.target.value))}
                                            className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm p-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Daily Limit (Amount)</label>
                                        <input 
                                            type="number" 
                                            value={settings[token]?.dailyLimit ?? ''} 
                                            onChange={(e) => handleSettingChange(token, 'dailyLimit', parseInt(e.target.value))}
                                            className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm p-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Daily Count Limit</label>
                                        <input 
                                            type="number" 
                                            value={settings[token]?.dailyCountLimit ?? 3} 
                                            onChange={(e) => handleSettingChange(token, 'dailyCountLimit', parseInt(e.target.value))}
                                            className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm p-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Swap Rate (1 USHA = ?)</label>
                                        <input 
                                            type="number" 
                                            step="0.000001"
                                            value={settings[token]?.swapRate ?? 1} 
                                            onChange={(e) => handleSettingChange(token, 'swapRate', parseFloat(e.target.value))}
                                            className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm p-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Swap Fee (%)</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            value={settings[token]?.swapFee ?? 0} 
                                            onChange={(e) => handleSettingChange(token, 'swapFee', parseFloat(e.target.value))}
                                            className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm p-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-red-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Exchanges (comma separated)</label>
                                        <input 
                                            type="text" 
                                            value={settings[token]?.exchangeName ?? ''} 
                                            onChange={(e) => handleSettingChange(token, 'exchangeName', e.target.value)}
                                            className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm p-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                            placeholder="e.g. BINANCE, MEXC, OKX"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Method Label</label>
                                        <input 
                                            type="text" 
                                            value={settings[token]?.methodLabel ?? ''} 
                                            onChange={(e) => handleSettingChange(token, 'methodLabel', e.target.value)}
                                            className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm p-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                            placeholder="e.g. UID"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Network</label>
                                        <input 
                                            type="text" 
                                            value={settings[token]?.network ?? ''} 
                                            onChange={(e) => handleSettingChange(token, 'network', e.target.value)}
                                            className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm p-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                            placeholder="e.g. BEP20"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-600">
                                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Deposit Settings</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-600">
                                             <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">Enable Deposits</span>
                                             <label className="inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={settings[token]?.depositEnabled ?? false} 
                                                    onChange={(e) => handleSettingChange(token, 'depositEnabled', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="relative w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Deposit Address</label>
                                            <input 
                                                type="text" 
                                                value={settings[token]?.depositAddress || ''} 
                                                onChange={(e) => handleSettingChange(token, 'depositAddress', e.target.value)}
                                                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm p-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                                                placeholder="0x..."
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                             <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">QR Code Image URL</label>
                                             <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={settings[token]?.depositQrCodeUrl || ''} 
                                                    onChange={(e) => handleSettingChange(token, 'depositQrCodeUrl', e.target.value)}
                                                    className="flex-grow bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm p-2 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                                    placeholder="https://..."
                                                />
                                                <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white p-2 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center min-w-[40px] transition-colors" title="Upload QR Image">
                                                    <UploadIcon className="w-4 h-4 text-purple-400" />
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, token)} />
                                                </label>
                                             </div>
                                             {settings[token]?.depositQrCodeUrl && (
                                                 <div className="mt-2">
                                                     <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Preview:</p>
                                                     <img src={settings[token]?.depositQrCodeUrl} alt="QR Preview" className="h-24 w-24 object-contain bg-white rounded p-1" />
                                                 </div>
                                             )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button 
                            onClick={handleSaveSettings} 
                            disabled={saveStatus === 'saving'}
                            className={`px-6 py-2 rounded-md text-sm font-bold transition-colors shadow-lg ${saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                        >
                            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Changes Saved!' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div className="flex border border-gray-300 dark:border-gray-700 rounded-lg p-1 max-w-xs bg-gray-100 dark:bg-gray-800 w-full md:w-auto">
                    <button
                        onClick={() => setGroupBy('user')}
                        className={`w-1/2 p-2 text-sm font-semibold rounded-md transition ${groupBy === 'user' ? 'bg-purple-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                        By User
                    </button>
                    <button
                        onClick={() => setGroupBy('recipient')}
                        className={`w-1/2 p-2 text-sm font-semibold rounded-md transition ${groupBy === 'recipient' ? 'bg-purple-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                        By Destination
                    </button>
                </div>
                
                <div className="w-full md:w-auto flex-grow max-w-md">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by Email, UID, or TxID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>
            </div>
            
            <div className="space-y-4 max-h-[calc(100vh-18rem)] overflow-y-auto pr-2">
                {groupBy === 'user' ? renderByUser() : renderByRecipientAddress()}
            </div>
        </div>
    );
};

export default WithdrawalManager;
