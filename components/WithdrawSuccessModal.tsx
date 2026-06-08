
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Token } from '../types';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface WithdrawSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    token: Token;
    address: string;
    transactionId: string;
}

const WithdrawSuccessModal: React.FC<WithdrawSuccessModalProps> = ({ isOpen, onClose, amount, token, address, transactionId }) => {
    const { state } = useContext(AppContext);
    
    if (!isOpen) return null;

    const tokenName = state.tokenConfigs[token]?.name || token;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircleIcon className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Request Submitted</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Your withdrawal request has been received and is being processed.</p>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 space-y-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Amount</span>
                        <span className="text-gray-900 dark:text-white font-bold">{amount.toLocaleString()} {tokenName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Destination</span>
                        <span className="text-gray-900 dark:text-white font-mono truncate max-w-[150px]">{address}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Transaction ID</span>
                        <span className="text-gray-900 dark:text-white font-mono truncate max-w-[150px]">{transactionId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status</span>
                        <span className="text-yellow-600 dark:text-yellow-500 font-bold bg-yellow-100 dark:bg-yellow-500/10 px-2 rounded">Pending</span>
                    </div>
                </div>

                <button 
                    onClick={onClose} 
                    className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition shadow-lg shadow-green-600/20"
                >
                    Done
                </button>
            </div>
        </div>
    );
};

export default WithdrawSuccessModal;
