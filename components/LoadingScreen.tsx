import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-[#0D1117] flex flex-col items-center justify-center z-50">
        <div className="text-gray-900 dark:text-white font-bold text-2xl mb-4 animate-pulse">
            OnlyMemes
        </div>
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-600 dark:text-white mt-4">Loading...</p>
    </div>
  );
};

export default LoadingScreen;
