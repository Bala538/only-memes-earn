import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';

const ActivityLogs: React.FC = () => {
    const { state } = useContext(AppContext);
    const { adminLogs = [] } = state;

    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('ALL');
    const [adminFilter, setAdminFilter] = useState('ALL');
    const [pageSize, setPageSize] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);

    // Get unique actions and unique admins for dropdowns
    const uniqueActions = useMemo(() => {
        const set = new Set<string>();
        adminLogs.forEach(log => {
            if (log.action) set.add(log.action);
        });
        return Array.from(set).sort();
    }, [adminLogs]);

    const uniqueAdmins = useMemo(() => {
        const set = new Set<string>();
        adminLogs.forEach(log => {
            if (log.adminEmail) set.add(log.adminEmail);
        });
        return Array.from(set).sort();
    }, [adminLogs]);

    // Filter and search
    const filteredLogs = useMemo(() => {
        let logs = [...adminLogs];

        // Sort descending by timestamp / date (newest first)
        logs.sort((a, b) => {
            const timeA = new Date(a.timestamp || 0).getTime();
            const timeB = new Date(b.timestamp || 0).getTime();
            return timeB - timeA;
        });

        if (actionFilter !== 'ALL') {
            logs = logs.filter(log => log.action === actionFilter);
        }

        if (adminFilter !== 'ALL') {
            logs = logs.filter(log => log.adminEmail === adminFilter);
        }

        if (search.trim()) {
            const s = search.toLowerCase();
            logs = logs.filter(log => 
                (log.adminEmail && log.adminEmail.toLowerCase().includes(s)) ||
                (log.action && log.action.toLowerCase().includes(s)) ||
                (log.details && log.details.toLowerCase().includes(s))
            );
        }

        return logs;
    }, [adminLogs, search, actionFilter, adminFilter]);

    // Paginated logs
    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredLogs.slice(start, start + pageSize);
    }, [filteredLogs, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Helper to style action badges
    const getActionBadgeStyle = (action: string) => {
        const act = action.toUpperCase();
        if (act.includes('ADD') || act.includes('CREATE') || act.includes('APPROVE') || act.includes('LIST')) {
            return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800';
        }
        if (act.includes('REMOVE') || act.includes('DELETE') || act.includes('REJECT') || act.includes('BLOCK')) {
            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800';
        }
        if (act.includes('UPDATE') || act.includes('EDIT')) {
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
        }
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
    };

    // Action name formatted cleanly
    const formatActionName = (action: string) => {
        return action.replace(/_/g, ' ');
    };

    return (
        <div className="space-y-6">
            {/* Header section with Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#161B22] p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                    <div>
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Actions Recorded</span>
                        <h4 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{adminLogs.length}</h4>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                        Real-time updates active
                    </div>
                </div>

                <div className="bg-white dark:bg-[#161B22] p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                    <div>
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admins Logged</span>
                        <h4 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{uniqueAdmins.length}</h4>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                        Unique administrator accounts tracked
                    </div>
                </div>

                <div className="bg-white dark:bg-[#161B22] p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                    <div>
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Filtered Action Count</span>
                        <h4 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{filteredLogs.length}</h4>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                        Matching current search parameters
                    </div>
                </div>
            </div>

            {/* Filter and search bar */}
            <div className="bg-white dark:bg-[#161B22] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Search Logs</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search by email, action, details..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                    </div>

                    {/* Filter Action */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Action Category</label>
                        <select
                            value={actionFilter}
                            onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="ALL">All Actions</option>
                            {uniqueActions.map(action => (
                                <option key={action} value={action}>{formatActionName(action)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filter Admin */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Administrator</label>
                        <select
                            value={adminFilter}
                            onChange={(e) => { setAdminFilter(e.target.value); setCurrentPage(1); }}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="ALL">All Admins</option>
                            {uniqueAdmins.map(admin => (
                                <option key={admin} value={admin}>{admin}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">System Logs</h3>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Show:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                            className="text-xs border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white py-1 px-1.5 focus:ring-purple-500"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>

                {paginatedLogs.length === 0 ? (
                    <div className="py-12 text-center">
                        <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No matching logs found</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try resetting or modifying your filter criteria.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                                    <th className="py-3.5 px-4 font-semibold">Admin</th>
                                    <th className="py-3.5 px-4 font-semibold">Action</th>
                                    <th className="py-3.5 px-4 font-semibold">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50 text-sm text-gray-700 dark:text-gray-300">
                                {paginatedLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                        {/* Timestamp */}
                                        <td className="py-3 px-4 whitespace-nowrap font-mono text-xs text-gray-500 dark:text-gray-400">
                                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                                        </td>
                                        {/* Admin email */}
                                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                            {log.adminEmail || 'Unknown Admin'}
                                        </td>
                                        {/* Action type badge */}
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getActionBadgeStyle(log.action)}`}>
                                                {formatActionName(log.action)}
                                            </span>
                                        </td>
                                        {/* Details description */}
                                        <td className="py-3 px-4 text-xs font-medium max-w-md break-words text-gray-600 dark:text-gray-300">
                                            {log.details}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination footer */}
                {filteredLogs.length > pageSize && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{Math.min(filteredLogs.length, (currentPage - 1) * pageSize + 1)}</span> to{' '}
                            <span className="font-semibold text-gray-700 dark:text-gray-300">{Math.min(filteredLogs.length, currentPage * pageSize)}</span> of{' '}
                            <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredLogs.length}</span> entries
                        </span>
                        
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-2.5 py-1 text-xs font-semibold rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            
                            {Array.from({ length: totalPages }).map((_, index) => {
                                const page = index + 1;
                                // Display range logic
                                if (page === 1 || page === totalPages || Math.abs(currentPage - page) <= 1) {
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`px-2.5 py-1 text-xs font-semibold rounded border ${
                                                currentPage === page
                                                    ? 'bg-purple-600 border-purple-600 text-white'
                                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                } else if (page === 2 || page === totalPages - 1) {
                                    return <span key={page} className="px-1 text-xs text-gray-400">...</span>;
                                }
                                return null;
                            })}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-2.5 py-1 text-xs font-semibold rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLogs;
