
import React, { useContext } from 'react';
import { UserData } from '../../types';
import { AppContext } from '../../context/AppContext';
import TokenIcon from '../icons/TokenIcon';
import UsersIcon from '../icons/UsersIcon';
import WalletIcon from '../icons/WalletIcon';
import HistoryIcon from '../icons/HistoryIcon';
import DownloadIcon from '../icons/DownloadIcon';
import UploadIcon from '../icons/UploadIcon';
import GameControllerIcon from '../icons/GameControllerIcon';

interface UserDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserData | null;
}

const formatNumber = (num: number) => num.toLocaleString();

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ isOpen, onClose, user }) => {
    const { state } = useContext(AppContext);
    if (!isOpen || !user) return null;

    const balances = user.balance || {};
    const referralStats = user.referralStats || { totalReferrals: 0, totalEarned: {} };
    const history = user.tapGameData?.history || [];
    const gameScore = user.tapGameData?.score || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-[#1c1c1e] w-full max-w-4xl rounded-2xl border border-gray-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-100 dark:bg-gray-800/50 flex-shrink-0">
                    <div className="flex items-center space-x-4">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="Avatar" className="w-12 h-12 rounded-full object-cover shrink-0" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white shrink-0">
                                {(user.displayName || user.email).charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.displayName || user.email}</h2>
                            {user.displayName && <p className="text-sm text-gray-500">{user.email}</p>}
                            <p className="text-xs text-gray-400 font-mono">{user.uid}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Status Section */}
                    <div className="flex flex-wrap gap-2">
                        {user.isAdmin && <span className="px-3 py-1 rounded-full bg-purple-900/50 text-purple-300 text-xs font-bold border border-purple-700">Admin</span>}
                        {user.isBlocked ? (
                            <span className="px-3 py-1 rounded-full bg-red-900/50 text-red-300 text-xs font-bold border border-red-700">Blocked</span>
                        ) : (
                            <span className="px-3 py-1 rounded-full bg-green-900/50 text-green-300 text-xs font-bold border border-green-700">Active</span>
                        )}
                        {user.emailVerified && <span className="px-3 py-1 rounded-full bg-blue-900/50 text-blue-300 text-xs font-bold border border-blue-700">Verified Email</span>}
                    </div>

                    {/* Earnings Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Main Wallet */}
                        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2 relative z-10">
                                <WalletIcon className="w-4 h-4 text-blue-400" /> Main Wallet
                            </h3>
                            <div className="space-y-2 relative z-10">
                                {Object.keys(balances).length > 0 ? Object.entries(balances).map(([token, amount]) => (
                                    <div key={token} className="flex items-center gap-2">
                                        <TokenIcon token={token} className="w-6 h-6" />
                                        <span className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(amount as number)}</span>
                                    </div>
                                )) : <p className="text-gray-500 text-sm">No funds.</p>}
                            </div>
                        </div>

                        {/* Game Earnings */}
                        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2 relative z-10">
                                <GameControllerIcon className="w-4 h-4 text-yellow-400" /> Game Earnings
                            </h3>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="p-1 bg-yellow-500/20 rounded-full"><div className="w-4 h-4 bg-yellow-500 rounded-full shadow-[0_0_10px_#eab308]"></div></div>
                                    <span className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(gameScore)}</span>
                                </div>
                                <p className="text-xs text-gray-500">Current Score</p>
                            </div>
                        </div>

                        {/* Referral Earnings */}
                        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2 relative z-10">
                                <UsersIcon className="w-4 h-4 text-green-400" /> Referral Earnings
                            </h3>
                            <div className="space-y-2 relative z-10">
                                {Object.keys(referralStats.totalEarned).length > 0 ? Object.entries(referralStats.totalEarned).map(([token, amount]) => (
                                    <div key={token} className="flex items-center gap-2">
                                        <TokenIcon token={token} className="w-6 h-6" />
                                        <span className="text-xl font-bold text-green-400">+{formatNumber((amount as number) || 0)}</span>
                                    </div>
                                )) : <p className="text-gray-500 text-sm">No earnings.</p>}
                                <p className="text-xs text-gray-500 pt-1 border-t border-gray-700/50">{referralStats.totalReferrals} Invited Users</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            {/* Account Info */}
                            <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    Activity & Info
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-gray-700/50 pb-2">
                                        <span className="text-gray-500">Last Active:</span>
                                        <span className="text-gray-900 dark:text-white">
                                            {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-700/50 pb-2">
                                        <span className="text-gray-500">My Referral Code:</span>
                                        <span className="text-gray-900 dark:text-white font-mono bg-gray-200 dark:bg-gray-900 px-2 py-0.5 rounded">{user.referralCode || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-700/50 pb-2">
                                        <span className="text-gray-500">Referred By:</span>
                                        <span className="text-gray-900 dark:text-white font-mono">{user.referredByEmail || 'None'}</span>
                                    </div>
                                    {user.airdropAddress && (
                                        <div className="flex flex-col pt-1">
                                            <span className="text-gray-500 text-xs mb-1">Airdrop Address:</span>
                                            <span className="text-indigo-300 font-mono text-xs break-all bg-indigo-900/20 p-2 rounded border border-indigo-500/20">{user.airdropAddress}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Transaction History */}
                        <div className="flex flex-col h-full min-h-[300px]">
                            <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                                <HistoryIcon className="w-4 h-4"/> Transaction History
                            </h3>
                            <div className="bg-gray-100 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex-grow flex flex-col">
                                <div className="overflow-y-auto flex-grow p-1 max-h-64">
                                    {history.length > 0 ? (
                                        <div className="space-y-1">
                                            {history.slice().reverse().map((tx, idx) => (
                                                <div key={tx.id || idx} className="p-3 bg-gray-100 dark:bg-gray-800/80 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex justify-between items-center text-sm border border-gray-200 dark:border-gray-700/50">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-1.5 rounded-full shrink-0 ${tx.isPositive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                                            {tx.isPositive ? <DownloadIcon className="w-3 h-3" /> : <UploadIcon className="w-3 h-3" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                                {tx.type} 
                                                                {tx.type === 'Referral' && <span className="text-[10px] bg-green-900 text-green-300 px-1.5 rounded">Ref</span>}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">{new Date(tx.date).toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`font-mono font-bold ${tx.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                                            {tx.isPositive ? '+' : '-'}{tx.amount}
                                                        </div>
                                                        {tx.token && <div className="text-[10px] text-gray-500">{state.tokenConfigs[tx.token]?.name || tx.token}</div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
                                            <p className="text-sm">No transactions yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;
