import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { AppNotification } from '../types';

const NotificationCenter: React.FC = () => {
    const { state, markNotificationRead, clearNotifications } = useContext(AppContext);
    const { currentUser } = state;
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const notifications = currentUser?.notifications || [];
    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0 && currentUser?.email) {
            // Mark all as read when opening? Or just visually?
            // Let's mark individual ones as read when clicked or maybe all at once?
            // For now, let's just show them.
        }
    };

    const handleNotificationClick = async (notification: AppNotification) => {
        if (!notification.read && currentUser?.email) {
            await markNotificationRead(currentUser.email, notification.id);
        }
        // If link, navigate?
    };

    const handleClearAll = async () => {
        if (currentUser?.email) {
            await clearNotifications(currentUser.email);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={handleOpen}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white dark:border-[#161B22]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#161B22] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-fade-in origin-top-right">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-[#0D1117]">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Notifications</h3>
                        {notifications.length > 0 && (
                            <button onClick={handleClearAll} className="text-xs text-blue-500 hover:text-blue-600 font-medium">
                                Clear All
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-800">
                                {notifications.map(notification => (
                                    <div 
                                        key={notification.id} 
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notification.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                                            <div className="flex-1">
                                                <h4 className={`text-sm font-semibold mb-1 ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                                    {notification.title}
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                                <span className="text-[10px] text-gray-400 mt-2 block">
                                                    {new Date(notification.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
