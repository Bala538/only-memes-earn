
import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    message: string;
    title?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, message, title = "Confirm Action" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-[#161B22] rounded-md shadow-2xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-700 transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }}
                        className="px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
