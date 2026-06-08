import React from 'react';

interface MaintenanceViewProps {
    message?: string;
    onAdminLogin: () => void;
    showAdminButton?: boolean;
    onLogout?: () => void;
}

const MaintenanceView: React.FC<MaintenanceViewProps> = ({ message, onAdminLogin, showAdminButton = true, onLogout }) => {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#0D1117] flex flex-col items-center justify-center p-4 text-center">
            <div className="max-w-md w-full bg-white dark:bg-[#161B22] rounded-2xl shadow-2xl p-8 space-y-6">
                <div className="flex justify-center">
                    <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-purple-600 dark:text-purple-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                        </svg>
                    </div>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Under Maintenance</h1>
                
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                    {message || 'We are currently undergoing scheduled maintenance. Please check back later.'}
                </p>
                
                <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        Thank you for your patience.
                    </p>
                </div>
            </div>
            
            {showAdminButton ? (
                <button 
                    onClick={onAdminLogin}
                    className="mt-8 text-sm text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors bg-transparent border-none cursor-pointer"
                >
                    Admin Access
                </button>
            ) : onLogout ? (
                <button 
                    onClick={onLogout}
                    className="mt-8 text-sm text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors bg-transparent border-none cursor-pointer"
                >
                    Logout
                </button>
            ) : null}
        </div>
    );
};

export default MaintenanceView;
