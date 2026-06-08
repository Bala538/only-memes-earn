import React from 'react';
import TokenIcon from './icons/TokenIcon';
import { Token } from '../types';

interface DailyComboSuccessModalProps {
    isOpen: boolean;
    onClaim: () => void;
    reward: number;
    token: Token;
}

const DailyComboSuccessModal: React.FC<DailyComboSuccessModalProps> = ({ isOpen, onClaim, reward, token }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in" style={{ touchAction: 'none' }}>
            <div className="w-full max-w-sm flex flex-col items-center text-center relative">
                {/* Glow Effect */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-500/20 rounded-full blur-[60px] pointer-events-none"></div>
                
                {/* Hamster Wizard / Success Image */}
                <div className="relative mb-6 mt-4 animate-bounce-slow">
                     <img 
                        src="https://i.postimg.cc/RZTZLQT6/IMG-20251121-174619-657.jpg" 
                        alt="Hamster Wizard" 
                        className="w-40 h-40 object-cover rounded-full shadow-2xl border-4 border-yellow-500/50 relative z-10"
                    />
                </div>

                <h2 className="text-3xl font-black text-white mb-2 drop-shadow-lg tracking-tight">Good job, CEO!</h2>
                <p className="text-gray-400 text-sm mb-8 font-medium px-4">
                    Yay, the combo is complete. You're doing great!
                </p>

                <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 w-full mb-8 flex flex-col items-center">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Total Reward</p>
                    <div className="flex items-center gap-3">
                        <TokenIcon token={token} className="w-10 h-10" />
                        <span className="text-4xl font-black text-gray-900 dark:text-white drop-shadow-md">+{reward.toLocaleString()}</span>
                    </div>
                </div>

                <button 
                    onClick={onClaim}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold text-xl py-4 rounded-2xl shadow-lg shadow-green-900/40 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    Claim Reward
                </button>
            </div>
            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default DailyComboSuccessModal;