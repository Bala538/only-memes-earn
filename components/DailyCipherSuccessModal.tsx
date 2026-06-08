import React from 'react';
import TokenIcon from './icons/TokenIcon';
import { Token } from '../types';

interface DailyCipherSuccessModalProps {
    isOpen: boolean;
    onClaim: () => void;
    reward: number;
    token: Token;
}

const DailyCipherSuccessModal: React.FC<DailyCipherSuccessModalProps> = ({ isOpen, onClaim, reward, token }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in" style={{ touchAction: 'none' }}>
            <div className="w-full max-w-sm flex flex-col items-center text-center relative">
                {/* Glow Effect behind the character */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-orange-500/30 rounded-full blur-[60px] pointer-events-none"></div>
                
                {/* Character Image (Detective style) */}
                <div className="relative mb-8 mt-4">
                     <img 
                        src="https://i.postimg.cc/RZTZLQT6/IMG-20251121-174619-657.jpg" 
                        alt="Detective Hamster" 
                        className="w-48 h-48 object-cover rounded-full shadow-2xl border-4 border-[#2c2c2e] relative z-10"
                    />
                    {/* Magnifying glass overlay icon */}
                    <div className="absolute -bottom-1 -right-1 bg-gray-800 p-3 rounded-full border-4 border-[#1c1c1e] z-20 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
                            <path d="M8.25 10.875a2.625 2.625 0 115.25 0 2.625 2.625 0 01-5.25 0z" />
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.125 4.5a4.125 4.125 0 102.338 7.524l2.007 2.006a.75.75 0 101.06-1.06l-2.006-2.007a4.125 4.125 0 00-3.399-6.463z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-3xl font-black text-white mb-2 drop-shadow-lg tracking-tight">The code is cracked.</h2>
                <p className="text-gray-400 text-lg mb-8 font-medium">You are a real detective!</p>

                <div className="flex items-center gap-3 mb-10">
                    <TokenIcon token={token} className="w-12 h-12" />
                    <span className="text-5xl font-black text-white drop-shadow-md">+{reward.toLocaleString()}</span>
                </div>

                <button 
                    onClick={onClaim}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl py-4 rounded-2xl shadow-lg shadow-blue-900/40 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    Take the prize
                </button>
            </div>
        </div>
    );
};

export default DailyCipherSuccessModal;