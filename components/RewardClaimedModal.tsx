
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Token } from '../types';
import TokenIcon from './icons/TokenIcon';

// A self-drawing checkmark icon for a more polished animation
const AnimatedCheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 52 52"
        {...props}
    >
        <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
        <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
    </svg>
);

interface RewardClaimedModalProps {
    isOpen: boolean;
    onClose: () => void;
    reward: number;
    token: Token;
}

const RewardClaimedModal: React.FC<RewardClaimedModalProps> = ({ isOpen, onClose, reward, token }) => {
    const { state } = useContext(AppContext);
    
    if (!isOpen) return null;

    const tokenName = state.tokenConfigs[token]?.name || token;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-[#161B22] rounded-xl shadow-2xl w-full max-w-sm p-8 transform transition-all scale-100 text-center border border-gray-100 dark:border-gray-700 relative" onClick={e => e.stopPropagation()}>
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AnimatedCheckCircleIcon className="w-12 h-12 text-green-600 dark:text-green-500" />
                </div>
                
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Congratulations!</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">You have successfully completed the task.</p>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-8 border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 uppercase font-bold tracking-wider">You Received</p>
                    <div className="flex items-center justify-center space-x-2">
                        <TokenIcon token={token} className="w-8 h-8" />
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{reward.toLocaleString()}</span>
                    </div>
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-500 mt-1">{tokenName}</p>
                </div>

                <button 
                    onClick={onClose}
                    className="w-full py-3.5 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg shadow-green-600/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    Awesome!
                </button>
            </div>
        </div>
    );
};

export default RewardClaimedModal;
