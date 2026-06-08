
import React, { useState } from 'react';

interface ImagePreviewModalProps {
    imageUrl: string;
    onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
    const [hasError, setHasError] = useState(false);
    const [prevUrl, setPrevUrl] = useState(imageUrl);

    if (imageUrl !== prevUrl) {
        setPrevUrl(imageUrl);
        setHasError(false);
    }

    return (
        <div 
            className="fixed inset-0 w-full h-full flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" 
            onClick={onClose}
            style={{ zIndex: 999999 }} 
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="relative w-full h-full max-w-6xl max-h-[95vh] flex flex-col items-center justify-center outline-none pointer-events-auto" 
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white bg-gray-800/80 hover:bg-gray-700 rounded-full p-3 shadow-lg z-50 transition-transform hover:scale-110"
                    aria-label="Close image preview"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                {imageUrl && !hasError ? (
                    <img 
                        src={imageUrl} 
                        alt="Proof preview" 
                        className="rounded-lg shadow-2xl max-w-full max-h-full object-contain bg-white dark:bg-[#161B22] border border-gray-200 dark:border-gray-700" 
                        onError={() => setHasError(true)}
                    />
                ) : imageUrl && hasError ? (
                    <div className="text-red-400 bg-gray-800 p-8 rounded-lg text-center border border-gray-700 shadow-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className='font-bold text-lg mb-2'>Error Loading Image</p>
                        <p className='text-sm text-gray-300'>The image data appears to be corrupted or missing.</p>
                        <p className='text-xs text-gray-500 mt-4'>If this persists, the user may need to re-submit.</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[#161B22] p-12 rounded-lg shadow-2xl flex flex-col items-center justify-center text-gray-900 dark:text-white space-y-6 border border-gray-200 dark:border-gray-700 min-w-[300px]">
                        <svg className="animate-spin h-12 w-12 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="font-medium text-lg text-gray-300">Loading Proof...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImagePreviewModal;
