import React from 'react';

const OfflinePage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="text-center">
        <svg
          className="mx-auto h-16 w-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
          You're offline
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Please check your internet connection and try again.
        </p>
      </div>
    </div>
  );
};

export default OfflinePage;
