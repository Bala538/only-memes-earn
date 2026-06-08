
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import TokenIcon from './icons/TokenIcon';
import NotificationCenter from './NotificationCenter';

const Header: React.FC = () => {
    const { state, logout, dispatch } = useContext(AppContext);

    if (!state.currentUser) return null;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#161B22] border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
            <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="bg-orange-50 dark:bg-gray-800 p-1.5 rounded-md">
                        <TokenIcon token="USHA" className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                            Only Memes <span className="text-purple-600 dark:text-purple-400">Earn</span>
                        </h1>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                     {state.currentUser.isAdmin && (
                        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700">
                            <span className="mr-2 text-xs font-medium text-gray-600 dark:text-gray-300 hidden sm:block">{state.isAdminView ? 'Admin' : 'User'}</span>
                            <label htmlFor="view-toggle" className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="view-toggle"
                                    className="sr-only peer"
                                    checked={state.isAdminView}
                                    onChange={() => dispatch({ type: 'TOGGLE_VIEW' })}
                                />
                                <div className="w-9 h-5 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-500/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>
                    )}
                    <NotificationCenter />
                    <button 
                        onClick={logout} 
                        className="p-2 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors duration-200"
                        title="Logout"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
