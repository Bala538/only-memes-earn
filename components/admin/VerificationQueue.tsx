import React, { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { UserData } from '../../types';

interface PendingVerificationItem {
    id: string;
    user: UserData;
    exchange: string;
    gameUid: string;
    screenshotUrl: string;
}

const VerificationQueue: React.FC = () => {
    const { state, adminApproveUserUid, adminRejectUserUid, dispatch } = useContext(AppContext);
    const { allUsers } = state;

    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedExchangeTab, setSelectedExchangeTab] = useState<string>('all');

    // Filter pending user UID approvals
    const pendingApprovals = useMemo(() => {
        const list: PendingVerificationItem[] = [];
        allUsers.forEach(user => {
            const pendings = user.pendingExchangeUids || {};
            const hasRecordPendings = Object.keys(pendings).length > 0;
            
            if (hasRecordPendings) {
                Object.entries(pendings).forEach(([exchange, uid]) => {
                    const screenshotUrl = user.pendingExchangeScreenshots?.[exchange] || user.uidScreenshotUrl || '';
                    list.push({
                        id: `${user.email}-${exchange}`,
                        user,
                        exchange,
                        gameUid: uid,
                        screenshotUrl
                    });
                });
            } else {
                // Fallback to legacy fields
                if (user.gameUid && !user.isUidVerified) {
                    list.push({
                        id: `${user.email}-${user.pendingExchange || 'Default'}`,
                        user,
                        exchange: user.pendingExchange || 'Default',
                        gameUid: user.gameUid,
                        screenshotUrl: user.uidScreenshotUrl || ''
                    });
                }
            }
        });
        return list;
    }, [allUsers]);

    // Calculate exchange counts for tabs
    const exchangeCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        pendingApprovals.forEach(item => {
            const exch = item.exchange || 'Default';
            counts[exch] = (counts[exch] || 0) + 1;
        });
        return counts;
    }, [pendingApprovals]);

    const uniqueExchangesWithPendings = useMemo(() => {
        return Object.keys(exchangeCounts).sort();
    }, [exchangeCounts]);

    // Sync selected tab with list to prevent getting stuck on empty tabs
    useEffect(() => {
        if (selectedExchangeTab !== 'all' && !uniqueExchangesWithPendings.includes(selectedExchangeTab)) {
            setSelectedExchangeTab('all');
        }
    }, [uniqueExchangesWithPendings, selectedExchangeTab]);

    // Apply search query filtering
    const filteredApprovals = useMemo(() => {
        return pendingApprovals.filter(item => {
            const query = searchQuery.toLowerCase();
            const name = (item.user.displayName || '').toLowerCase();
            const email = (item.user.email || '').toLowerCase();
            const uid = (item.gameUid || '').toLowerCase();
            const exchange = (item.exchange || '').toLowerCase();
            return name.includes(query) || email.includes(query) || uid.includes(query) || exchange.includes(query);
        });
    }, [pendingApprovals, searchQuery]);

    // Filter by active exchange tab
    const displayedApprovals = useMemo(() => {
        return filteredApprovals.filter(item => {
            if (selectedExchangeTab === 'all') return true;
            return (item.exchange || 'Default') === selectedExchangeTab;
        });
    }, [filteredApprovals, selectedExchangeTab]);

    // Group items by exchange for rendering
    const groupedApprovals = useMemo(() => {
        const groups: Record<string, PendingVerificationItem[]> = {};
        displayedApprovals.forEach(item => {
            const exch = item.exchange || 'Default';
            if (!groups[exch]) {
                groups[exch] = [];
            }
            groups[exch].push(item);
        });
        return groups;
    }, [displayedApprovals]);

    const handleApprove = async (email: string, gameUid: string, pendingExchange?: string) => {
        const loadingKey = `${email}-${pendingExchange || 'Default'}-approve`;
        setActionLoading(prev => ({ ...prev, [loadingKey]: true }));
        setError(null);
        setSuccess(null);
        try {
            await adminApproveUserUid(email, gameUid, pendingExchange);
            setSuccess(`Successfully approved UID "${gameUid}" for ${email} on ${pendingExchange || 'Default'}.`);
        } catch (error: any) {
            console.error('Failed to approve UID:', error);
            setError(error.message || 'Failed to approve UID.');
        } finally {
            setActionLoading(prev => ({ ...prev, [loadingKey]: false }));
        }
    };

    const handleReject = async (email: string, pendingExchange?: string) => {
        const loadingKey = `${email}-${pendingExchange || 'Default'}-reject`;
        setActionLoading(prev => ({ ...prev, [loadingKey]: true }));
        setError(null);
        setSuccess(null);
        try {
            await adminRejectUserUid(email, pendingExchange);
            setSuccess(`Successfully rejected UID verification request for ${email} on ${pendingExchange || 'Default'}.`);
        } catch (error: any) {
            console.error('Failed to reject UID:', error);
            setError(error.message || 'Failed to reject UID.');
        } finally {
            setActionLoading(prev => ({ ...prev, [loadingKey]: false }));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#161B22] p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                        </span>
                        UID Verification Queue
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Review, approve, or reject exchange profile screenshots and UID claims.
                    </p>
                </div>
                
                {pendingApprovals.length > 0 && (
                    <div className="w-full sm:w-64 relative">
                        <input
                            type="text"
                            placeholder="Search by name, email, UID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                            >
                                &times;
                            </button>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 px-5 py-4 rounded-xl text-sm flex justify-between items-center transition-all animate-fadeIn">
                    <span className="font-medium flex items-center gap-2">⚠️ {error}</span>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 dark:hover:text-red-300 font-bold text-lg leading-none">&times;</button>
                </div>
            )}
            {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 px-5 py-4 rounded-xl text-sm flex justify-between items-center transition-all animate-fadeIn">
                    <span className="font-medium flex items-center gap-2">✓ {success}</span>
                    <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700 dark:hover:text-green-300 font-bold text-lg leading-none">&times;</button>
                </div>
            )}

            {pendingApprovals.length === 0 ? (
                <div className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">All Caught Up!</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        There are currently no pending UID verifications from users across any exchanges.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Exchange Tabs Selector */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <button
                            onClick={() => setSelectedExchangeTab('all')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all border ${
                                selectedExchangeTab === 'all'
                                    ? 'bg-purple-600 border-purple-600 text-white shadow-sm shadow-purple-600/10'
                                    : 'bg-white dark:bg-[#161B22] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`}
                        >
                            All Exchanges ({pendingApprovals.length})
                        </button>
                        {uniqueExchangesWithPendings.map(exchange => {
                            const count = exchangeCounts[exchange] || 0;
                            return (
                                <button
                                    key={exchange}
                                    onClick={() => setSelectedExchangeTab(exchange)}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all border flex items-center gap-1.5 ${
                                        selectedExchangeTab === exchange
                                            ? 'bg-purple-600 border-purple-600 text-white shadow-sm shadow-purple-600/10'
                                            : 'bg-white dark:bg-[#161B22] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                    }`}
                                >
                                    <span>{exchange}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                        selectedExchangeTab === exchange
                                            ? 'bg-white/20 text-white'
                                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {displayedApprovals.length === 0 ? (
                        <div className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center animate-fade-in">
                            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Matching Verifications</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                                No pending verifications match your search query in this section.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-fade-in">
                            {Object.entries(groupedApprovals).map(([exchangeName, items]) => (
                                <div key={exchangeName} className="space-y-4">
                                    <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-2">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                                            {exchangeName} Verifications
                                        </h3>
                                        <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                            {items.length} {items.length === 1 ? 'request' : 'requests'}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {items.map(item => {
                                            const { user, exchange, gameUid, screenshotUrl: currentScreenshot } = item;

                                            const isReusedLocally = currentScreenshot 
                                                ? Object.values(user.exchangeScreenshotUrls || {}).filter(url => url === currentScreenshot).length > 1 ||
                                                  Object.values(user.pendingExchangeScreenshots || {}).filter(url => url === currentScreenshot).length > 1
                                                : false;

                                            const otherUsersWithSameScreenshot = currentScreenshot
                                                ? allUsers.filter(u => u.email !== user.email && (
                                                    u.uidScreenshotUrl === currentScreenshot || 
                                                    Object.values(u.exchangeScreenshotUrls || {}).includes(currentScreenshot) ||
                                                    Object.values(u.pendingExchangeScreenshots || {}).includes(currentScreenshot)
                                                  ))
                                                : [];
                                            const isReusedGlobally = otherUsersWithSameScreenshot.length > 0;

                                            const isApproving = actionLoading[`${user.email}-${exchange}-approve`] || actionLoading[`${user.email}-approve`];
                                            const isRejecting = actionLoading[`${user.email}-${exchange}-reject`] || actionLoading[`${user.email}-reject`];
                                            const isLoading = isApproving || isRejecting;

                                            return (
                                                <div 
                                                    key={item.id} 
                                                    className="bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden hover:border-purple-300 dark:hover:border-purple-900/50 transition-all flex flex-col justify-between"
                                                >
                                                    <div className="p-5 space-y-4">
                                                        {/* User Info Header */}
                                                        <div className="flex items-center space-x-3">
                                                            {user.photoURL ? (
                                                                <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-purple-100 dark:border-purple-900/30 shrink-0" referrerPolicy="no-referrer" />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-inner shrink-0">
                                                                    {(user.displayName || user.email).charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div className="overflow-hidden">
                                                                <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                                                                    {user.displayName || 'OnlyMemes User'}
                                                                </h4>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                    {user.email}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Verification details */}
                                                        <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-lg border border-gray-100 dark:border-gray-800/80 space-y-2 text-xs">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-gray-400">Exchange:</span>
                                                                <span className="font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/10">
                                                                    {exchange}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-gray-400">Submitted UID:</span>
                                                                <span className="font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/10">
                                                                    {gameUid}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Alerts for duplicate screenshot reuse */}
                                                        {(isReusedLocally || isReusedGlobally) && (
                                                            <div className="space-y-1.5">
                                                                {isReusedLocally && (
                                                                    <div className="flex items-center gap-1.5 text-[10px] text-yellow-600 dark:text-yellow-400 bg-yellow-500/5 px-2.5 py-1 rounded border border-yellow-500/10 font-medium">
                                                                        <span className="shrink-0 text-xs">⚠️</span>
                                                                        <span>Reused locally on multiple exchanges</span>
                                                                    </div>
                                                                )}
                                                                {isReusedGlobally && (
                                                                    <div className="flex items-center gap-1.5 text-[10px] text-red-600 dark:text-red-400 bg-red-500/5 px-2.5 py-1 rounded border border-red-500/10 font-medium">
                                                                        <span className="shrink-0 text-xs">🚫</span>
                                                                        <span className="truncate">Matches user: {otherUsersWithSameScreenshot[0]?.email}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Proof Screenshot */}
                                                        {currentScreenshot ? (
                                                            <div className="space-y-1.5">
                                                                <span className="text-xs font-medium text-gray-400 block">UID Screenshot:</span>
                                                                <div 
                                                                    onClick={() => dispatch({ type: 'SHOW_IMAGE_PREVIEW', payload: currentScreenshot })}
                                                                    className="relative group overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer h-36 w-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center hover:opacity-90 transition-all shadow-inner"
                                                                >
                                                                    <img src={currentScreenshot} alt="UID Proof" className="max-h-full max-w-full object-contain p-1" referrerPolicy="no-referrer" />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-semibold transition-opacity gap-1">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                                                                        </svg>
                                                                        Click to Zoom
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="h-36 w-full rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-xs text-gray-400">
                                                                No Screenshot Submitted
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions footer */}
                                                    <div className="px-5 pb-5 pt-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 flex gap-3">
                                                        <button
                                                            disabled={isLoading}
                                                            onClick={() => handleReject(user.email, exchange)}
                                                            className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                                        >
                                                            {isRejecting ? 'Rejecting...' : 'Reject'}
                                                        </button>
                                                        <button
                                                            disabled={isLoading}
                                                            onClick={() => handleApprove(user.email, gameUid, exchange)}
                                                            className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                                                        >
                                                            {isApproving ? 'Approving...' : 'Approve'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VerificationQueue;
