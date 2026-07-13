
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { UserData } from '../../types';
import UsersIcon from '../icons/UsersIcon';
import TokenIcon from '../icons/TokenIcon';
import ConfirmationModal from '../ConfirmationModal';
import UserDetailsModal from './UserDetailsModal';

const UserManager: React.FC = () => {
    const { state, adminToggleUserBlock, adminUpdateUserBalance, adminReverifyUserUid, adminDeleteUser } = useContext(AppContext);
    const { allUsers } = state;
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTab, setFilterTab] = useState<'all' | 'verified' | 'unverified' | 'blocked' | 'pending_verification'>('all');
    const [processingUsers, setProcessingUsers] = useState<Record<string, boolean>>({});
    
    // Bulk Selection States
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

    // Modal States
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [userToToggle, setUserToToggle] = useState<UserData | null>(null);
    
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

    // New Modal States to replace standard dialogs
    const [isEditBalanceModalOpen, setIsEditBalanceModalOpen] = useState(false);
    const [userToEditBalance, setUserToEditBalance] = useState<UserData | null>(null);
    const [newBalanceValue, setNewBalanceValue] = useState('');

    const [isReverifyModalOpen, setIsReverifyModalOpen] = useState(false);
    const [userToReverify, setUserToReverify] = useState<UserData | null>(null);
    const [reverifyExchangeSelection, setReverifyExchangeSelection] = useState<string>('all');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

    // Bulk Modals
    const [isBulkBlockModalOpen, setIsBulkBlockModalOpen] = useState(false);
    const [bulkBlockStatus, setBulkBlockStatus] = useState(true);

    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

    const [isBulkReverifyModalOpen, setIsBulkReverifyModalOpen] = useState(false);

    const [isBulkBalanceModalOpen, setIsBulkBalanceModalOpen] = useState(false);
    const [bulkBalanceMode, setBulkBalanceMode] = useState<boolean>(true); // true = relative, false = absolute
    const [bulkBalanceValue, setBulkBalanceValue] = useState('');

    const handleViewDetails = (user: UserData) => {
        setSelectedUser(user);
        setIsDetailsModalOpen(true);
    };

    const counts = useMemo(() => {
        let verified = 0;
        let unverified = 0;
        let blocked = 0;
        let pendingVerification = 0;

        allUsers.forEach(user => {
            const isVerified = !!user.isUidVerified || (user.exchangeUids && Object.keys(user.exchangeUids).length > 0);
            if (isVerified) {
                verified++;
            } else {
                unverified++;
            }
            if (user.isBlocked) {
                blocked++;
            }
            const hasRecordPendings = user.pendingExchangeUids && Object.keys(user.pendingExchangeUids).length > 0;
            if (hasRecordPendings || (user.gameUid && !user.isUidVerified)) {
                pendingVerification++;
            }
        });

        return {
            all: allUsers.length,
            verified,
            unverified,
            blocked,
            pendingVerification
        };
    }, [allUsers]);

    const filteredUsers = useMemo(() => {
        return allUsers.filter(user => {
            const query = searchTerm.toLowerCase();
            const matchSearch = 
                user.email.toLowerCase().includes(query) ||
                (user.uid || '').toLowerCase().includes(query) ||
                (user.displayName || '').toLowerCase().includes(query) ||
                (user.gameUid || '').toLowerCase().includes(query);
            
            if (!matchSearch) return false;

            const isVerified = !!user.isUidVerified || (user.exchangeUids && Object.keys(user.exchangeUids).length > 0);
            if (filterTab === 'verified') {
                return isVerified;
            }
            if (filterTab === 'unverified') {
                return !isVerified;
            }
            if (filterTab === 'blocked') {
                return !!user.isBlocked;
            }
            if (filterTab === 'pending_verification') {
                const hasRecordPendings = user.pendingExchangeUids && Object.keys(user.pendingExchangeUids).length > 0;
                return hasRecordPendings || (!!user.gameUid && !user.isUidVerified);
            }

            return true;
        });
    }, [allUsers, searchTerm, filterTab]);

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

    const handleEditBalance = (user: UserData) => {
        setUserToEditBalance(user);
        setNewBalanceValue((user.balance['USHA'] || 0).toString());
        setIsEditBalanceModalOpen(true);
    };

    const confirmEditBalance = async () => {
        if (!userToEditBalance) return;
        const newBalance = parseFloat(newBalanceValue);
        if (isNaN(newBalance) || newBalance < 0) {
            alert("Invalid balance amount. Please enter a valid positive number.");
            return;
        }

        const userEmail = userToEditBalance.email;
        setIsEditBalanceModalOpen(false);
        setProcessingUsers(prev => ({ ...prev, [userEmail]: true }));
        try {
            await adminUpdateUserBalance(userEmail, 'USHA', newBalance);
        } catch (error) {
            console.error("Failed to update balance:", error);
            alert("Failed to update user balance. Check console for details.");
        } finally {
            setProcessingUsers(prev => ({ ...prev, [userEmail]: false }));
            setUserToEditBalance(null);
        }
    };

    const availableExchangesForReverify = useMemo(() => {
        if (!userToReverify) return [];
        const set = new Set<string>();
        if (userToReverify.exchangeUids) {
            Object.keys(userToReverify.exchangeUids).forEach(k => set.add(k));
        }
        if (userToReverify.pendingExchangeUids) {
            Object.keys(userToReverify.pendingExchangeUids).forEach(k => set.add(k));
        }
        (state.exchanges || []).forEach(e => {
            set.add(e.name);
        });
        return Array.from(set).sort();
    }, [userToReverify, state.exchanges]);

    const handleReverifyUid = (user: UserData) => {
        setUserToReverify(user);
        setReverifyExchangeSelection('all');
        setIsReverifyModalOpen(true);
    };

    const confirmReverifyUid = async () => {
        if (!userToReverify) return;
        const userEmail = userToReverify.email;
        const targetIdentifier = userToReverify.docId || userToReverify.email;
        const exchangeName = reverifyExchangeSelection === 'all' ? undefined : reverifyExchangeSelection;
        setIsReverifyModalOpen(false);
        setProcessingUsers(prev => ({ ...prev, [userEmail]: true }));
        try {
            await adminReverifyUserUid(targetIdentifier, exchangeName);
        } catch (error) {
            console.error("Failed to request UID re-verification:", error);
            alert("Failed to request UID re-verification. Check console for details.");
        } finally {
            setProcessingUsers(prev => ({ ...prev, [userEmail]: false }));
            setUserToReverify(null);
        }
    };

    const handleDeleteUser = (user: UserData) => {
        if (user.isAdmin) {
            alert("Cannot delete an administrator account!");
            return;
        }
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        const userEmail = userToDelete.email;
        const targetIdentifier = userToDelete.docId || userToDelete.email || userToDelete.uid;
        if (!targetIdentifier) return;

        setIsDeleteModalOpen(false);
        setProcessingUsers(prev => ({ ...prev, [userEmail]: true }));
        try {
            await adminDeleteUser(targetIdentifier);
        } catch (error) {
            console.error("Failed to delete user:", error);
            alert("Failed to delete user: " + (error instanceof Error ? error.message : String(error)));
        } finally {
            setProcessingUsers(prev => ({ ...prev, [userEmail]: false }));
            setUserToDelete(null);
        }
    };

    const toggleSelectUser = (email: string) => {
        setSelectedEmails(prev => 
            prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
        );
    };

    const nonAdminFilteredUsers = useMemo(() => {
        return filteredUsers.filter(u => !u.isAdmin);
    }, [filteredUsers]);
    
    const isAllSelected = useMemo(() => {
        if (nonAdminFilteredUsers.length === 0) return false;
        return nonAdminFilteredUsers.every(u => selectedEmails.includes(u.email));
    }, [nonAdminFilteredUsers, selectedEmails]);

    const handleSelectAllToggle = () => {
        if (isAllSelected) {
            const emailsToDeselect = nonAdminFilteredUsers.map(u => u.email);
            setSelectedEmails(prev => prev.filter(email => !emailsToDeselect.includes(email)));
        } else {
            const emailsToSelect = nonAdminFilteredUsers.map(u => u.email);
            setSelectedEmails(prev => {
                const newSelection = [...prev];
                emailsToSelect.forEach(email => {
                    if (!newSelection.includes(email)) {
                        newSelection.push(email);
                    }
                });
                return newSelection;
            });
        }
    };

    const handleBulkBlockToggle = (block: boolean) => {
        if (selectedEmails.length === 0) return;
        setBulkBlockStatus(block);
        setIsBulkBlockModalOpen(true);
    };

    const confirmBulkBlockToggle = async () => {
        setIsBulkBlockModalOpen(false);
        const targets = allUsers.filter(u => selectedEmails.includes(u.email) && !u.isAdmin);
        
        setProcessingUsers(prev => {
            const next = { ...prev };
            targets.forEach(u => {
                next[u.email] = true;
            });
            return next;
        });

        let successCount = 0;
        let failCount = 0;

        for (const user of targets) {
            try {
                await adminToggleUserBlock(user.email, bulkBlockStatus);
                successCount++;
            } catch (err) {
                console.error(`Failed to toggle block for ${user.email}:`, err);
                failCount++;
            } finally {
                setProcessingUsers(prev => ({ ...prev, [user.email]: false }));
            }
        }

        setSelectedEmails([]);
    };

    const handleBulkDelete = () => {
        if (selectedEmails.length === 0) return;
        setIsBulkDeleteModalOpen(true);
    };

    const confirmBulkDelete = async () => {
        setIsBulkDeleteModalOpen(false);
        const targets = allUsers.filter(u => selectedEmails.includes(u.email) && !u.isAdmin);
        
        setProcessingUsers(prev => {
            const next = { ...prev };
            targets.forEach(u => {
                next[u.email] = true;
            });
            return next;
        });

        let successCount = 0;
        let failCount = 0;

        for (const user of targets) {
            const targetIdentifier = user.docId || user.email || user.uid;
            if (!targetIdentifier) continue;
            try {
                await adminDeleteUser(targetIdentifier);
                successCount++;
            } catch (err) {
                console.error(`Failed to delete user ${user.email}:`, err);
                failCount++;
            } finally {
                setProcessingUsers(prev => ({ ...prev, [user.email]: false }));
            }
        }

        setSelectedEmails([]);
    };

    const handleBulkReverify = () => {
        if (selectedEmails.length === 0) return;
        setIsBulkReverifyModalOpen(true);
    };

    const confirmBulkReverify = async () => {
        setIsBulkReverifyModalOpen(false);
        const targets = allUsers.filter(u => selectedEmails.includes(u.email) && !u.isAdmin);
        
        setProcessingUsers(prev => {
            const next = { ...prev };
            targets.forEach(u => {
                next[u.email] = true;
            });
            return next;
        });

        let successCount = 0;
        let failCount = 0;

        for (const user of targets) {
            const targetIdentifier = user.docId || user.email;
            try {
                await adminReverifyUserUid(targetIdentifier);
                successCount++;
            } catch (err) {
                console.error(`Failed to reverify user ${user.email}:`, err);
                failCount++;
            } finally {
                setProcessingUsers(prev => ({ ...prev, [user.email]: false }));
            }
        }

        setSelectedEmails([]);
    };

    const handleBulkGiveBalance = () => {
        if (selectedEmails.length === 0) return;
        setBulkBalanceMode(true);
        setBulkBalanceValue('');
        setIsBulkBalanceModalOpen(true);
    };

    const confirmBulkGiveBalance = async () => {
        const val = parseFloat(bulkBalanceValue);
        if (isNaN(val)) {
            alert("Invalid number. Please enter a valid number.");
            return;
        }

        if (!bulkBalanceMode && val < 0) {
            alert("Absolute balance cannot be negative.");
            return;
        }

        setIsBulkBalanceModalOpen(false);
        const targets = allUsers.filter(u => selectedEmails.includes(u.email) && !u.isAdmin);
        
        setProcessingUsers(prev => {
            const next = { ...prev };
            targets.forEach(u => {
                next[u.email] = true;
            });
            return next;
        });

        let successCount = 0;
        let failCount = 0;

        for (const user of targets) {
            try {
                let targetBalance = val;
                if (bulkBalanceMode) {
                    const currentBalance = user.balance['USHA'] || 0;
                    targetBalance = Math.max(0, currentBalance + val);
                }
                await adminUpdateUserBalance(user.email, 'USHA', targetBalance);
                successCount++;
            } catch (err) {
                console.error(`Failed to update balance for user ${user.email}:`, err);
                failCount++;
            } finally {
                setProcessingUsers(prev => ({ ...prev, [user.email]: false }));
            }
        }

        setSelectedEmails([]);
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

            {/* Custom Edit Balance Modal */}
            {isEditBalanceModalOpen && userToEditBalance && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsEditBalanceModalOpen(false)}>
                    <div className="bg-white dark:bg-[#161B22] rounded-md shadow-2xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-700 transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Edit Balance</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                            Set new balance of <span className="font-semibold">{state.tokenConfigs['USHA']?.name || 'USHA'}</span> for <span className="font-semibold text-blue-500">{userToEditBalance.email}</span>:
                        </p>
                        <div className="mb-6">
                            <input
                                type="number"
                                value={newBalanceValue}
                                onChange={e => setNewBalanceValue(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-2.5 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                                placeholder="0.00"
                                min="0"
                                step="any"
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => setIsEditBalanceModalOpen(false)}
                                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmEditBalance}
                                className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Reverify Modal */}
            {isReverifyModalOpen && userToReverify && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsReverifyModalOpen(false)}>
                    <div className="bg-white dark:bg-[#161B22] rounded-md shadow-2xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-700 transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Request UID Re-verification</h3>
                        
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Select Exchange
                            </label>
                            <select
                                value={reverifyExchangeSelection}
                                onChange={(e) => setReverifyExchangeSelection(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-2.5 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm font-semibold"
                            >
                                <option value="all">⚠️ All Exchanges (Full Reset)</option>
                                {availableExchangesForReverify.map(exchange => (
                                    <option key={exchange} value={exchange}>{exchange}</option>
                                ))}
                            </select>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">
                            {reverifyExchangeSelection === 'all' ? (
                                <>
                                    Are you sure you want to request UID re-verification for <span className="font-semibold text-blue-500">{userToReverify.email}</span>? This will clear all their currently verified UIDs and screenshots, forcing them to re-verify.
                                </>
                            ) : (
                                <>
                                    Are you sure you want to request UID re-verification for <span className="font-semibold text-blue-500">{userToReverify.email}</span> on <span className="font-semibold text-orange-500">{reverifyExchangeSelection}</span>? This will clear their verification and screenshot for this exchange, forcing them to re-verify.
                                </>
                            )}
                        </p>
                        
                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => setIsReverifyModalOpen(false)}
                                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmReverifyUid}
                                className="px-4 py-2 rounded-md text-sm font-medium bg-yellow-600 hover:bg-yellow-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            >
                                Request Re-verify
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Delete Modal */}
            {isDeleteModalOpen && userToDelete && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}>
                    <div className="bg-white dark:bg-[#161B22] rounded-md shadow-2xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-700 transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">⚠️ Delete User Account</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">
                            WARNING: Are you sure you want to <span className="font-bold text-red-600">PERMANENTLY DELETE</span> the user account for <span className="font-semibold text-blue-500">{userToDelete.email}</span>? This action is completely IRREVERSIBLE and will delete their entire document and data from Firestore.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDeleteUser}
                                className="px-4 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Bulk Block Modal */}
            {isBulkBlockModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsBulkBlockModalOpen(false)}>
                    <div className="bg-white dark:bg-[#161B22] rounded-md shadow-2xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-700 transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Bulk Block/Unblock</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">
                            Are you sure you want to <span className="font-semibold text-blue-500">{bulkBlockStatus ? 'BLOCK' : 'UNBLOCK'}</span> the <span className="font-semibold text-blue-500">{selectedEmails.length}</span> selected user(s)?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => setIsBulkBlockModalOpen(false)}
                                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmBulkBlockToggle}
                                className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors focus:outline-none"
                            >
                                Confirm Action
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Bulk Delete Modal */}
            {isBulkDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsBulkDeleteModalOpen(false)}>
                    <div className="bg-white dark:bg-[#161B22] rounded-md shadow-2xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-700 transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">⚠️ Bulk Delete Users</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">
                            Are you sure you want to <span className="font-bold text-red-600">PERMANENTLY DELETE</span> the <span className="font-semibold text-blue-500">{selectedEmails.length}</span> selected user(s)? This action is completely IRREVERSIBLE and will delete their entire document and data from Firestore.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => setIsBulkDeleteModalOpen(false)}
                                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmBulkDelete}
                                className="px-4 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors focus:outline-none"
                            >
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Bulk Reverify Modal */}
            {isBulkReverifyModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsBulkReverifyModalOpen(false)}>
                    <div className="bg-white dark:bg-[#161B22] rounded-md shadow-2xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-700 transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Bulk Request UID Re-verification</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">
                            Are you sure you want to request UID re-verification for the <span className="font-semibold text-blue-500">{selectedEmails.length}</span> selected user(s)? This will clear their currently verified UIDs and screenshots, forcing them to re-verify.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => setIsBulkReverifyModalOpen(false)}
                                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmBulkReverify}
                                className="px-4 py-2 rounded-md text-sm font-medium bg-yellow-600 hover:bg-yellow-700 text-white transition-colors focus:outline-none"
                            >
                                Request Re-verify
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Bulk Balance Modal */}
            {isBulkBalanceModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsBulkBalanceModalOpen(false)}>
                    <div className="bg-white dark:bg-[#161B22] rounded-md shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-700 transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Bulk Balance Update</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                            Updating balance of <span className="font-semibold">{state.tokenConfigs['USHA']?.name || 'USHA'}</span> for <span className="font-semibold text-blue-500">{selectedEmails.length}</span> selected user(s).
                        </p>
                        
                        <div className="mb-4">
                            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Update Mode</span>
                            <div className="flex rounded-md shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setBulkBalanceMode(true)}
                                    className={`flex-1 py-2 px-3 border border-gray-200 dark:border-gray-700 rounded-l-md text-xs font-bold transition-all ${
                                        bulkBalanceMode 
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    Add / Subtract (Relative)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBulkBalanceMode(false)}
                                    className={`flex-1 py-2 px-3 border-t border-b border-r border-gray-200 dark:border-gray-700 rounded-r-md text-xs font-bold transition-all ${
                                        !bulkBalanceMode 
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    Set Exactly (Absolute)
                                </button>
                            </div>
                            <span className="block text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                {bulkBalanceMode 
                                    ? "Add or subtract tokens. E.g. enter 50 to add 50, -20 to subtract 20. Total will not go below 0." 
                                    : "Set the exact balance of all selected users. Value must be 0 or positive."}
                            </span>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Amount</label>
                            <input
                                type="number"
                                value={bulkBalanceValue}
                                onChange={e => setBulkBalanceValue(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-2.5 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                                placeholder={bulkBalanceMode ? "e.g. 50 or -25" : "e.g. 100"}
                                step="any"
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => setIsBulkBalanceModalOpen(false)}
                                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmBulkGiveBalance}
                                className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors focus:outline-none"
                            >
                                Apply to Users
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-4 space-y-4">
                <input
                    type="text"
                    placeholder="Search by name, email, game UID or Firebase UID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
                />

                <div className="flex flex-wrap gap-2 pb-2">
                    <button
                        onClick={() => setFilterTab('all')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                            filterTab === 'all'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        All Users ({counts.all})
                    </button>
                    <button
                        onClick={() => setFilterTab('verified')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                            filterTab === 'verified'
                                ? 'bg-green-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        Verified UIDs ({counts.verified})
                    </button>
                    <button
                        onClick={() => setFilterTab('unverified')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                            filterTab === 'unverified'
                                ? 'bg-yellow-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                        Unverified UIDs ({counts.unverified})
                    </button>
                    <button
                        onClick={() => setFilterTab('blocked')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                            filterTab === 'blocked'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        Blocked ({counts.blocked})
                    </button>
                    <button
                        onClick={() => setFilterTab('pending_verification')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                            filterTab === 'pending_verification'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        <span className="relative flex h-1.5 w-1.5 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
                        </span>
                        Pending UID Verifications ({counts.pendingVerification})
                    </button>
                </div>
            </div>

            {/* Bulk Actions Panel */}
            {selectedEmails.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950/25 border border-blue-200 dark:border-blue-900/40 p-4 rounded-xl mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[11px] text-white font-bold shrink-0">
                            {selectedEmails.length}
                        </div>
                        <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                            selected user(s) for bulk action
                        </span>
                        <button
                            onClick={() => setSelectedEmails([])}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold ml-2 cursor-pointer"
                        >
                            Deselect all
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => handleBulkGiveBalance()}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-sm active:scale-95"
                        >
                            Update/Add Balance
                        </button>
                        <button
                            onClick={() => handleBulkBlockToggle(true)}
                            className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-sm active:scale-95"
                        >
                            Block Selected
                        </button>
                        <button
                            onClick={() => handleBulkBlockToggle(false)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-sm active:scale-95"
                        >
                            Unblock Selected
                        </button>
                        <button
                            onClick={() => handleBulkReverify()}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-sm active:scale-95"
                        >
                            Request Re-verification
                        </button>
                        <button
                            onClick={() => handleBulkDelete()}
                            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-sm active:scale-95"
                        >
                            Delete Permanently
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto max-h-[calc(100vh-20rem)] overflow-y-auto">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase font-bold sticky top-0 z-10">
                        <tr>
                            <th className="p-3 w-10 rounded-tl-lg text-center">
                                <input
                                    type="checkbox"
                                    checked={isAllSelected}
                                    onChange={handleSelectAllToggle}
                                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer accent-blue-600"
                                />
                            </th>
                            <th className="p-3">User</th>
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
                                const isSelected = selectedEmails.includes(user.email);
                                
                                return (
                                    <tr key={user.uid || user.email} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isBlocked ? 'bg-red-100 dark:bg-red-900/10' : ''} ${isSelected ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''}`}>
                                        <td className="p-3 w-10 text-center">
                                            {!user.isAdmin ? (
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectUser(user.email)}
                                                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer accent-blue-600"
                                                />
                                            ) : (
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">Admin</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                {user.photoURL ? (
                                                    <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
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
                                                    {user.uid && <div className="text-[10px] text-gray-600 dark:text-gray-400 font-mono mt-0.5">ID: {user.uid}</div>}
                                                    
                                                    {/* Verified UIDs Badge & Mapping */}
                                                    {user.exchangeUids && Object.keys(user.exchangeUids).length > 0 ? (
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {Object.entries(user.exchangeUids).map(([exchange, uid]) => (
                                                                <span key={exchange} className="inline-flex items-center text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 font-bold font-mono">
                                                                    ✓ {exchange}: {uid}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : user.isUidVerified && user.gameUid ? (
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            <span className="inline-flex items-center text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 font-bold font-mono">
                                                                ✓ Verified UID: {user.gameUid}
                                                            </span>
                                                        </div>
                                                    ) : (user.gameUid && !user.isUidVerified) ? (
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            <span className="inline-flex items-center text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold font-mono">
                                                                ⏳ Pending: {user.pendingExchange || 'UID'} ({user.gameUid})
                                                            </span>
                                                        </div>
                                                    ) : null}
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
                                                {(!!user.isUidVerified || (user.exchangeUids && Object.keys(user.exchangeUids).length > 0)) && (
                                                    <button
                                                        onClick={() => handleReverifyUid(user)}
                                                        disabled={isProcessing}
                                                        className={`px-3 py-1.5 rounded-md text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        Reverify UID
                                                    </button>
                                                )}
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
                                                {!user.isAdmin && (
                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        disabled={isProcessing}
                                                        className={`px-3 py-1.5 rounded-md text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500 italic">
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
