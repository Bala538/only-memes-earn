
import { useState, useEffect, useContext } from 'react';
import { UserData } from '../../types';
import UsersIcon from '../icons/UsersIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import HistoryIcon from '../icons/HistoryIcon';
import { AdminTab } from './AdminTabs';
import GiftIcon from '../icons/GiftIcon';
import { AppContext } from '../../context/AppContext';
import TokenIcon from '../icons/TokenIcon';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick }) => (
    <div 
        className={`bg-white dark:bg-[#161B22] p-6 rounded-xl shadow-lg border-l-4 ${color} ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''} transition-colors`}
        onClick={onClick}
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-1">{value}</p>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                {icon}
            </div>
        </div>
    </div>
);


interface DashboardProps {
    setActiveTab: (tab: AdminTab) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
    const { state } = useContext(AppContext);
    const [stats, setStats] = useState({
        totalUsers: 0,
        onlineUsers: 0,
        pendingProofs: 0,
        pendingWithdrawals: 0,
        pendingUidVerifications: 0,
        totalEarnings: 0,
        totalPayouts: 0
    });

    useEffect(() => {
        const users = state.allUsers;
        
        let pendingProofs = 0;
        let pendingWithdrawals = 0;
        let pendingUidVerifications = 0;
        let onlineUsers = 0;
        let totalEarnings = 0;
        let totalPayouts = 0;
        const now = Date.now();

        users.forEach(user => {
            // Count online
            if (user.lastActive) {
                const diff = now - new Date(user.lastActive).getTime();
                if (diff < 5 * 60 * 1000) { // 5 minutes
                    onlineUsers++;
                }
            }

            // Count pending UID verifications
            const recordPendingsCount = user.pendingExchangeUids ? Object.keys(user.pendingExchangeUids).length : 0;
            if (recordPendingsCount > 0) {
                pendingUidVerifications += recordPendingsCount;
            } else if (user.gameUid && !user.isUidVerified) {
                pendingUidVerifications++;
            }

            // Calculate Earnings & Payouts (USHA only for simplicity or convert all?)
            // Assuming USHA is the main token for earnings display
            const ushaBalance = user.balance['USHA'] || 0;
            let userWithdrawn = 0;
            let userPayouts = 0;

            if (user.withdrawals) {
                user.withdrawals.forEach(w => {
                    if (w.token === 'USHA') {
                        // Only count non-rejected withdrawals towards "lifetime earnings" calculation
                        // because rejected ones are refunded to balance.
                        if (w.status !== 'rejected') {
                            userWithdrawn += w.amount;
                        }
                        
                        if (w.status === 'completed') {
                            userPayouts += w.amount;
                        }
                    }
                    if (w.status === 'pending') {
                        pendingWithdrawals++;
                    }
                });
            }
            
            totalEarnings += (ushaBalance + userWithdrawn);
            totalPayouts += userPayouts;

            const proofTypes: (keyof UserData)[] = [
                'videoProofs', 'youtubeTaskProofs', 'telegramTaskProofs', 
                'facebookTaskProofs', 'instagramTaskProofs', 'twitterTaskProofs', 
                'tiktokTaskProofs', 'appDownloadTaskProofs', 'depositProofs'
            ];
            
            proofTypes.forEach(proofType => {
                const proofs = user[proofType] as Record<string, any> | undefined;
                if (proofs) {
                    pendingProofs += Object.values(proofs).filter(p => p.status === 'pending').length;
                }
            });
        });

        setStats({
            totalUsers: users.length,
            onlineUsers,
            pendingProofs,
            pendingWithdrawals,
            pendingUidVerifications,
            totalEarnings,
            totalPayouts
        });
    }, [state.allUsers]);


    return (
        <div className="animate-fade-in space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Overview</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Users" 
                    value={stats.totalUsers} 
                    icon={<UsersIcon className="w-6 h-6 text-blue-400" />} 
                    color="border-blue-500"
                    onClick={() => setActiveTab('users')}
                />
                <StatCard 
                    title="Online Users" 
                    value={stats.onlineUsers} 
                    icon={<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />} 
                    color="border-green-500"
                    onClick={() => setActiveTab('users')}
                />
                <StatCard 
                    title="Pending Proofs" 
                    value={stats.pendingProofs} 
                    icon={<CheckCircleIcon className="w-6 h-6 text-yellow-400" />} 
                    color="border-yellow-500"
                    onClick={() => setActiveTab('proofs')}
                />
                <StatCard 
                    title="Pending Withdrawals" 
                    value={stats.pendingWithdrawals} 
                    icon={<HistoryIcon className="w-6 h-6 text-red-400" />} 
                    color="border-red-500"
                    onClick={() => setActiveTab('withdrawals')}
                />
                <StatCard 
                    title="Pending UID Verifications" 
                    value={stats.pendingUidVerifications} 
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                    } 
                    color="border-purple-600"
                    onClick={() => setActiveTab('verification-queue')}
                />
                 <StatCard 
                    title={`Total User Earnings (${state.tokenConfigs['USHA']?.name || 'USHA'})`} 
                    value={stats.totalEarnings.toLocaleString()} 
                    icon={<TokenIcon token="USHA" className="w-6 h-6" />} 
                    color="border-purple-500"
                />
                <StatCard 
                    title={`Total Payouts (${state.tokenConfigs['USHA']?.name || 'USHA'})`} 
                    value={stats.totalPayouts.toLocaleString()} 
                    icon={<GiftIcon className="w-6 h-6 text-pink-400" />} 
                    color="border-pink-500"
                    onClick={() => setActiveTab('withdrawals')}
                />
            </div>

            <div className="bg-white dark:bg-[#161B22] p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={() => setActiveTab('promo')} className="flex-1 text-left p-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-3">
                         <div className="p-2 bg-pink-900/50 rounded-md">
                            <GiftIcon className="h-6 w-6 text-pink-400" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">Promo Codes</p>
                            <p className="text-xs text-gray-400">Create and manage promotional codes.</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Total Users List Table */}
            <div className="bg-white dark:bg-[#161B22] p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Registered Users</h2>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase font-bold sticky top-0">
                            <tr>
                                <th className="p-3">Email</th>
                                <th className="p-3">Joined</th>
                                <th className="p-3">Balance ({state.tokenConfigs['USHA']?.name || 'USHA'})</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {state.allUsers.slice().reverse().map((user, idx) => {
                                const isOnline = user.lastActive && (Date.now() - new Date(user.lastActive).getTime() < 5 * 60 * 1000);
                                return (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="p-3 font-medium text-gray-900 dark:text-white">{user.email}</td>
                                        <td className="p-3 text-xs">2024</td>
                                        <td className="p-3 font-mono text-gray-900 dark:text-white flex items-center gap-1">
                                            <TokenIcon token="USHA" className="w-3 h-3" />
                                            {(user.balance['USHA'] || 0).toLocaleString()}
                                        </td>
                                        <td className="p-3">
                                            {user.isBlocked ? (
                                                <span className="text-red-400 font-bold text-xs bg-red-900/20 px-2 py-1 rounded">Blocked</span>
                                            ) : isOnline ? (
                                                <span className="text-green-400 font-bold text-xs bg-green-900/20 px-2 py-1 rounded">Online</span>
                                            ) : (
                                                <span className="text-gray-500 font-bold text-xs bg-gray-700/20 px-2 py-1 rounded">Offline</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {state.allUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
