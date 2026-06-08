
import React from 'react';
import BabyDogeIcon from './icons/BabyDogeIcon';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-[#161B22] rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-700 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="bg-orange-50 dark:bg-gray-800 p-4 rounded-full mb-4">
                        <BabyDogeIcon className="w-12 h-12" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">About Us</h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
                        Welcome to <span className="font-bold text-purple-600 dark:text-purple-400">Only Memes Earn</span>!
                        <br /><br />
                        We are the premier platform for meme token enthusiasts. Our mission is to make earning crypto fun and accessible for everyone. Watch videos, play engaging games, and complete tasks to grow your portfolio with the most popular meme tokens.
                    </p>
                    
                    <div className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-xs text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
                        <p className="font-semibold mb-1">Version 1.0.0</p>
                        <p>© 2024 Only Memes Earn. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutModal;
