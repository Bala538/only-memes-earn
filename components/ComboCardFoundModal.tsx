import React from 'react';
import { MineUpgrade } from '../types';

interface ComboCardFoundModalProps {
    isOpen: boolean;
    onClose: () => void;
    card: MineUpgrade | null;
    foundCount: number; // 1, 2, or 3
}

const ComboCardFoundModal: React.FC<ComboCardFoundModalProps> = ({ isOpen, onClose, card, foundCount }) => {
    if (!isOpen || !card) return null;

    const messages = [
        "Cool, first card is ready! Don't stop",
        "The second card is assembled, just a little bit left!",
        "All cards found! You are amazing!"
    ];

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in" style={{ touchAction: 'none' }}>
            <div className="w-full max-w-sm flex flex-col items-center text-center relative">
                {/* Burst Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none animate-pulse"></div>

                {/* Card Display */}
                <div className="relative mb-8 transform transition-all hover:scale-105 duration-300">
                    <div className="w-40 h-40 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-yellow-500/10 animate-pulse"></div>
                        <span className="text-6xl mb-2 relative z-10">{card.icon}</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white relative z-10 px-2 text-center leading-tight">{card.name}</span>
                    </div>
                    {/* Checkmark Badge */}
                    <div className="absolute -bottom-3 -right-3 bg-green-500 rounded-full p-2 border-4 border-white dark:border-[#1c1c1e] shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>

                {/* Text Content */}
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
                    {foundCount === 3 ? "Combo Completed!" : "Card Found!"}
                </h2>
                <p className="text-gray-300 text-sm mb-8 font-medium px-4">
                    {messages[Math.min(foundCount - 1, 2)]}
                </p>

                {/* Action Button */}
                <button 
                    onClick={onClose}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg py-3.5 rounded-xl shadow-lg shadow-blue-900/40 transform transition-all active:scale-[0.98]"
                >
                    {foundCount === 3 ? "Claim Prize" : "Get it!"}
                </button>
            </div>
        </div>
    );
};

export default ComboCardFoundModal;