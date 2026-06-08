import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Proof } from '../../types';

import DownloadIcon from '../icons/DownloadIcon';
import ConfirmationModal from '../ConfirmationModal';

interface AggregatedProof extends Proof {
    userEmail: string;
    userDisplayName?: string;
    userPhotoURL?: string;
    taskId: string; // Here it's the depositId
    taskType: 'deposit';
}

const ProofStatusBadge: React.FC<{ status: Proof['status'] }> = ({ status }) => {
    const statusStyles = {
        pending: 'bg-yellow-500/20 text-yellow-400',
        approved: 'bg-green-500/20 text-green-400',
        rejected: 'bg-red-500/20 text-red-400',
        claimed: 'bg-blue-500/20 text-blue-400'
    };
    const safeStatus = status || 'pending';
    const text = safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[safeStatus] || statusStyles.pending}`}>
            {text}
        </span>
    );
};

const DepositManager: React.FC = () => {
    const { 
        state, // FIX: get state from context
        adminApproveDepositProof, adminRejectDepositProof,
        adminRemoveProof,
        dispatch,
        getProofUrl
    } = useContext(AppContext);
    const [allProofs, setAllProofs] = useState<AggregatedProof[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingImageId, setLoadingImageId] = useState<string | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [proofToDelete, setProofToDelete] = useState<AggregatedProof | null>(null);

    useEffect(() => {
        // FIX: Remove setInterval and use state.allUsers directly
        const users = state.allUsers;
        const proofs: AggregatedProof[] = [];

        users.forEach(user => {
            if (user.depositProofs) {
                Object.entries(user.depositProofs).forEach(([depositId, proofData]) => {
                    // FIX: Cast proofData to Proof to ensure properties are spread correctly for the AggregatedProof type.
                    // FIX: Ensure proofData is an object before spreading
                    if (proofData && typeof proofData === 'object') {
                        proofs.push({ 
                            userEmail: user.email, 
                            userDisplayName: user.displayName,
                            userPhotoURL: user.photoURL,
                            taskId: depositId, 
                            taskType: 'deposit', 
                            ...(proofData as Proof) 
                        });
                    }
                });
            }
        });
        proofs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setAllProofs(proofs);
        setIsLoading(false);
    }, [state.allUsers]);
    
    const handleViewProof = async (proofUrl: string, taskId: string) => {
        if (loadingImageId) return;
        setLoadingImageId(taskId);
        dispatch({ type: 'SHOW_IMAGE_PREVIEW', payload: '' }); 

        try {
            await new Promise(resolve => setTimeout(resolve, 50));
            const imageUrl = await getProofUrl(proofUrl);
            if (imageUrl) {
                dispatch({ type: 'SHOW_IMAGE_PREVIEW', payload: imageUrl });
            } else {
                dispatch({ type: 'HIDE_IMAGE_PREVIEW' });
                alert('Could not load proof image.');
            }
        } catch (error) {
            console.error("Error viewing proof", error);
            dispatch({ type: 'HIDE_IMAGE_PREVIEW' });
            alert('An error occurred while loading the image.');
        } finally {
            setLoadingImageId(null);
        }
    };

    const handleApprove = (proof: AggregatedProof) => {
        adminApproveDepositProof(proof.userEmail, proof.taskId);
    };

    const handleReject = (proof: AggregatedProof) => {
        adminRejectDepositProof(proof.userEmail, proof.taskId);
    };

    const handleRemoveClick = (proof: AggregatedProof) => {
        setProofToDelete(proof);
        setIsDeleteModalOpen(true);
    };

    const confirmRemove = () => {
        if (proofToDelete) {
            adminRemoveProof(proofToDelete.userEmail, proofToDelete.taskId, proofToDelete.taskType);
            setProofToDelete(null);
        }
    };

    return (
        <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl">
             <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmRemove}
                title="Remove Deposit Proof"
                message="Are you sure you want to remove this proof? This will permanently delete the record."
            />
            <h2 className="text-2xl font-bold mb-4 text-purple-400 border-b-2 border-purple-400 pb-2 flex items-center space-x-2">
                <DownloadIcon className="w-7 h-7" />
                <span>Deposit Verification</span>
            </h2>
            <div className="space-y-3 max-h-[calc(100vh-15rem)] overflow-y-auto pr-2">
                {isLoading ? (
                    <p className="text-gray-500 text-center mt-8">Loading deposit requests...</p>
                ) : allProofs.length > 0 ? (
                    allProofs.map(proof => (
                        <div key={`${proof.userEmail}-${proof.taskId}`} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                            <div className="flex justify-between items-start flex-wrap gap-2">
                                <div className="flex items-start space-x-3">
                                    <DownloadIcon className="w-5 h-5 text-gray-400 mt-1" />
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{proof.taskTitle}</p>
                                        <p className="font-bold text-lg text-yellow-400">{proof.reward.toLocaleString()} {state.tokenConfigs[proof.rewardToken]?.name || proof.rewardToken}</p>
                                        <div className="flex items-center gap-2 mt-1 mb-1">
                                            {proof.userPhotoURL ? (
                                                <img src={proof.userPhotoURL} alt="Avatar" className="w-4 h-4 rounded-full object-cover shrink-0" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                                                    {(proof.userDisplayName || proof.userEmail).charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-400">User: <span className="font-mono">{proof.userDisplayName ? `${proof.userDisplayName} (${proof.userEmail})` : proof.userEmail}</span></p>
                                        </div>
                                        <p className="text-xs text-gray-400">Submitted: {new Date(proof.submittedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                     <ProofStatusBadge status={proof.status} />
                                      <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewProof(proof.proofUrl, proof.taskId);
                                        }}
                                        disabled={loadingImageId === proof.taskId}
                                        className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md transition duration-300 flex items-center space-x-1 shadow-sm"
                                    >
                                        {loadingImageId === proof.taskId ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Loading...</span>
                                            </>
                                        ) : (
                                            <span>View Proof</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-700 mt-3 pt-2 flex justify-end space-x-2">
                                {proof.status === 'pending' ? (
                                    <>
                                        <button onClick={() => handleRemoveClick(proof)} className="text-xs bg-gray-600 hover:bg-gray-700 text-white font-semibold py-1 px-3 rounded-md transition">
                                            Remove
                                        </button>
                                        <button onClick={() => handleReject(proof)} className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-md transition">
                                            Reject
                                        </button>
                                        <button onClick={() => handleApprove(proof)} className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-md transition">
                                            Approve
                                        </button>
                                    </>
                                ) : (
                                     <button onClick={() => handleRemoveClick(proof)} className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-md transition">
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center mt-8">No deposit requests from any user yet.</p>
                )}
            </div>
        </div>
    );
};

export default DepositManager;