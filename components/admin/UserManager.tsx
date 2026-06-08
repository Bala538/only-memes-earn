
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { UserData } from '../../types';
import UsersIcon from '../icons/UsersIcon';
import TokenIcon from '../icons/TokenIcon';
import ConfirmationModal from '../ConfirmationModal';
import UserDetailsModal from './UserDetailsModal';

const UserManager: React.FC = () => {
    const { state, adminToggleUserBlock, adminUpdateUserBalance } = useContext(AppContext);
    const { allUsers } = state;
    const [searchTerm, setSearchTerm] = useState('');
    const [processingUsers, setProcessingUsers] = useState<Record<string, boolean>>({});

    // Modal States
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [userToToggle, setUserToToggle] = useState<UserData | null>(null);
    
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

    const handleViewDetails = (user: UserData) => {
        setSelectedUser(user);
        setIsDetailsModalOpen(true);
    };

    const filteredUsers = useMemo(() => {
        return allUsers.filter(user => 
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.uid?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allUsers, searchTerm]);

    const isOnline = (lastActive?: string) => {
        if (!lastActive) return false;
        const diff = Date.now() - new Date(lastActive).getTime();
        return diff < 5 * 60 * 1000; // 5 minutes
    };

    const initiateToggleBlock = (user: UserData) => {
        setUserToToggle(user);
        setIsBlockModalOpen(true);
    };

    const confirmToggleBlock = async () => {
        if (!userToToggle) return;
        
        const userEmail = userToToggle.email;
        if (processingUsers[userEmail]) return;

        const willBlock = !userToToggle.isBlocked;
        
        setProcessingUsers(prev => ({ ...prev, [userEmail]: true }));
        try {
            await adminToggleUserBlock(userEmail, willBlock, userToToggle.uid);
        } catch (error) {
            console.error("Failed to toggle block status:", error);
            alert("Failed to update user status. Check console for details.");
        } finally {
            setProcessingUsers(prev => ({ ...prev, [userEmail]: false }));
            setUserToToggle(null);
        }
    };

    const handleEditBalance = async (user: UserData) => {
        const currentBalance = user.balance['USHA'] || 0;
        const newBalanceStr = prompt(`Enter new ${state.tokenConfigs['USHA']?.name || 'USHA'} balance for ${user.email}:`, currentBalance.toString());
        if (newBalanceStr === null) return; // Cancelled
        
        const newBalance = parseFloat(newBalanceStr);
        if (isNaN(newBalance) || newBalance < 0) {
            alert("Invalid balance amount. Please enter a valid positive number.");
            return;
        }

        const userEmail = user.email;
        setProcessingUsers(prev => ({ ...prev, [userEmail]: true }));
        try {
            await adminUpdateUserBalance(userEmail, 'USHA', newBalance);
        } catch (error) {
            console.error("Failed to update balance:", error);
            alert("Failed to update user balance. Check console for details.");
        } finally {
            setProcessingUsers(prev => ({ ...prev, [userEmail]: false }));
        }
    };

    return (
        <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-blue-400 border-b-2 border-blue-400 pb-2 flex items-center space-x-2">
                <UsersIcon className="w-7 h-7" />
                <span>User Management</span>
            </h2>

            {/* Modals */}
            <ConfirmationModal 
                isOpen={isBlockModalOpen}
                onClose={() => setIsBlockModalOpen(false)}
                onConfirm={confirmToggleBlock}
                title={userToToggle?.isBlocked ? "Unblock User" : "Block User"}
                message={`Are you sure you want to ${userToToggle?.isBlocked ? 'unblock' : 'block'} ${userToToggle?.email}? ${userToToggle?.isBlocked ? 'They will regain access to the platform.' : 'They will be logged out and unable to access the platform.'}`}
            />

            <UserDetailsModal 
                isOpen={isDetailsModalOpen} 
                onClose={() => setIsDetailsModalOpen(false)} 
                user={selectedUser} 
            />

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by email or UID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
                />
            </div>

            <div className="overflow-x-auto max-h-[calc(100vh-20rem)] overflow-y-auto">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase font-bold sticky top-0 z-10">
                        <tr>
                            <th className="p-3 rounded-tl-lg">User</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Balance ({state.tokenConfigs['USHA']?.name || 'USHA'})</th>
                            <th className="p-3 rounded-tr-lg text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => {
                                const online = isOnline(user.lastActive);
                                const balance = user.balance['USHA'] || 0;
                                const isProcessing = processingUsers[user.email] || false;
                                const isBlocked = !!user.isBlocked;
                                
                                return (
                                    <tr key={user.uid || user.email} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isBlocked ? 'bg-red-100 dark:bg-red-900/10' : ''}`}>
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                {user.photoURL ? (
                                                    <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                                        {(user.displayName || user.email).charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                        {user.displayName ? `${user.displayName} (${user.email})` : user.email}
                                                        {isBlocked && <span className="text-[10px] bg-red-600 text-white px-1.5 rounded">BLOCKED</span>}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Last Active: {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'}
                                                    </div>
                                                    {user.uid && <div className="text-[10px] text-gray-600 font-mono mt-0.5">ID: {user.uid}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-col gap-1">
                                                {user.isAdmin ? (
                                                    <span className="bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded text-xs font-bold w-fit border border-purple-800">Admin</span>
                                                ) : online ? (
                                                    <span className="bg-green-900/50 text-green-400 px-2 py-0.5 rounded text-xs font-bold w-fit border border-green-800">Online</span>
                                                ) : (
                                                    <span className="bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded text-xs font-bold w-fit border border-gray-600">Offline</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 font-mono text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-1">
                                                <TokenIcon token="USHA" className="w-4 h-4" />
                                                {balance.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditBalance(user)}
                                                    disabled={isProcessing}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    Edit Balance
                                                </button>
                                                <button
                                                    onClick={() => handleViewDetails(user)}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-bold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors`}
                                                >
                                                    Details
                                                </button>
                                                {!user.isAdmin && (
                                                    <button
                                                        onClick={() => initiateToggleBlock(user)}
                                                        disabled={isProcessing}
                                                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-md active:scale-95 min-w-[70px] flex items-center justify-center gap-1 ${
                                                            isBlocked
                                                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-900/20'
                                                                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20'
                                                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {isProcessing ? (
                                                            <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                        ) : (
                                                            isBlocked ? 'Unblock' : 'Block'
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500 italic">
                                    {searchTerm ? 'No users found matching your search.' : 'No users registered yet.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManager;
