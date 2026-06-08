
import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { UserData, Proof } from '../../types';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import VideoIcon from '../icons/VideoIcon';
import { YouTubeIcon } from '../icons/YouTubeIcon';
import TelegramIcon from '../icons/TelegramIcon';
import FacebookIcon from '../icons/FacebookIcon';
import InstagramIcon from '../icons/InstagramIcon';
import TwitterIcon from '../icons/TwitterIcon';
import TikTokIcon from '../icons/TikTokIcon';
import AppStoreIcon from '../icons/AppStoreIcon';
import ConfirmationModal from '../ConfirmationModal';

interface AggregatedProof extends Proof {
    userEmail: string;
    userDisplayName?: string;
    userPhotoURL?: string;
    taskId: string;
    taskType: 'video' | 'youtube' | 'telegram' | 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'app_download' | 'other';
}

const ProofStatusBadge: React.FC<{ status: Proof['status'] }> = ({ status }) => {
    const statusStyles = {
        pending: 'bg-yellow-500/20 text-yellow-400',
        processing: 'bg-blue-500/20 text-blue-400 animate-pulse',
        approved: 'bg-green-500/20 text-green-400',
        rejected: 'bg-red-500/20 text-red-400',
        claimed: 'bg-purple-500/20 text-purple-400'
    };
    const safeStatus = status || 'pending';
    const textMap = {
        pending: 'Pending',
        processing: 'Processing',
        approved: 'Completed',
        rejected: 'Rejected',
        claimed: 'Claimed'
    };
    const text = textMap[safeStatus] || safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[safeStatus] || statusStyles.pending}`}>
            {text}
        </span>
    );
};

const TaskTypeIcon: React.FC<{ type: AggregatedProof['taskType'] }> = ({ type }) => {
    switch (type) {
        case 'video': return <VideoIcon className="w-5 h-5 text-gray-400" title="Video Task" />;
        case 'youtube': return <YouTubeIcon className="w-5 h-5 text-red-500" title="YouTube Task"/>;
        case 'telegram': return <TelegramIcon className="w-5 h-5 text-blue-400" title="Telegram Task"/>;
        case 'facebook': return <FacebookIcon className="w-5 h-5" title="Facebook Task"/>;
        case 'instagram': return <InstagramIcon className="w-5 h-5" title="Instagram Task"/>;
        case 'twitter': return <TwitterIcon className="w-5 h-5" title="Twitter Task"/>;
        case 'tiktok': return <TikTokIcon className="w-5 h-5" title="TikTok Task"/>;
        case 'app_download': return <AppStoreIcon className="w-5 h-5 text-green-500" title="App Download Task"/>;
        case 'other': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500" title="Other Task"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" /></svg>;
        default: return null;
    }
};


const ProofVerifier: React.FC = () => {
    const { 
        state,
        adminUpdateTaskProofStatus,
        adminRemoveProof,
        dispatch,
        getProofUrl
    } = useContext(AppContext);
    const { allUsers } = state;
    const [allProofs, setAllProofs] = useState<AggregatedProof[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingImageId, setLoadingImageId] = useState<string | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [proofToDelete, setProofToDelete] = useState<AggregatedProof | null>(null);

    useEffect(() => {
        const proofs: AggregatedProof[] = [];
        allUsers.forEach(user => {
            const proofFields: (keyof UserData)[] = [
                'videoProofs', 'youtubeTaskProofs', 'telegramTaskProofs', 
                'facebookTaskProofs', 'instagramTaskProofs', 'twitterTaskProofs', 
                'tiktokTaskProofs', 'appDownloadTaskProofs', 'otherTaskProofs'
            ];
            
            proofFields.forEach(field => {
                const data = user[field] as Record<string, Proof>;
                if (data) {
                    Object.entries(data).forEach(([taskId, p]) => {
                        let type: any = 'video';
                        if (field.includes('youtube')) type = 'youtube';
                        else if (field.includes('telegram')) type = 'telegram';
                        else if (field.includes('facebook')) type = 'facebook';
                        else if (field.includes('instagram')) type = 'instagram';
                        else if (field.includes('twitter')) type = 'twitter';
                        else if (field.includes('tiktok')) type = 'tiktok';
                        else if (field.includes('appDownload')) type = 'app_download';
                        else if (field.includes('other')) type = 'other';
                        
                        proofs.push({ 
                            userEmail: user.email, 
                            userDisplayName: user.displayName,
                            userPhotoURL: user.photoURL,
                            taskId, 
                            taskType: type, 
                            ...p 
                        });
                    });
                }
            });
        });
        proofs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setAllProofs(proofs);
        setIsLoading(false);
    }, [allUsers]);
    
    const handleViewProof = async (proofUrl: string, taskId: string) => {
        if (loadingImageId || !proofUrl || proofUrl === 'code_only') return;
        setLoadingImageId(taskId);
        dispatch({ type: 'SHOW_IMAGE_PREVIEW', payload: '' }); 
        try {
            const imageUrl = await getProofUrl(proofUrl);
            if (imageUrl) dispatch({ type: 'SHOW_IMAGE_PREVIEW', payload: imageUrl });
            else dispatch({ type: 'HIDE_IMAGE_PREVIEW' });
        } catch (error) {
            dispatch({ type: 'HIDE_IMAGE_PREVIEW' });
        } finally {
            setLoadingImageId(null);
        }
    };

    return (
        <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl">
             <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={() => { adminRemoveProof(proofToDelete!.userEmail, proofToDelete!.taskId, proofToDelete!.taskType); setProofToDelete(null); }} title="Remove Proof" message="Are you sure?" />
            <h2 className="text-2xl font-bold mb-4 text-purple-400 border-b-2 border-purple-400 pb-2 flex items-center space-x-2">
                <CheckCircleIcon className="w-7 h-7" />
                <span>Proof Verification</span>
            </h2>
            <div className="space-y-4 max-h-[calc(100vh-15rem)] overflow-y-auto pr-2">
                {isLoading ? (
                    <p className="text-gray-500 text-center mt-8">Loading proofs...</p>
                ) : allProofs.length > 0 ? (
                    allProofs.map(proof => {
                        const hasImg = proof.proofUrl && proof.proofUrl !== 'code_only' && proof.proofUrl !== 'auto_generated';
                        const hasCode = !!proof.codeSubmitted;
                        
                        return (
                            <div key={`${proof.userEmail}-${proof.taskType}-${proof.taskId}`} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex items-start space-x-3">
                                        <TaskTypeIcon type={proof.taskType} />
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-base">{proof.taskTitle}</p>
                                            <div className="flex items-center gap-2 mt-1 mb-1">
                                                {proof.userPhotoURL ? (
                                                    <img src={proof.userPhotoURL} alt="Avatar" className="w-4 h-4 rounded-full object-cover shrink-0" />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                                                        {(proof.userDisplayName || proof.userEmail).charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <p className="text-xs text-gray-500">User: <span className="text-gray-400">{proof.userDisplayName ? `${proof.userDisplayName} (${proof.userEmail})` : proof.userEmail}</span></p>
                                            </div>
                                            <p className="text-[10px] text-gray-600">{new Date(proof.submittedAt).toLocaleString()}</p>
                                            
                                            {hasCode && (
                                                <div className="mt-2 bg-gray-100 dark:bg-black/40 p-2 rounded border border-gray-200 dark:border-gray-700 inline-block">
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Submitted Code</p>
                                                    <p className="text-sm font-mono text-green-400 font-bold">{proof.codeSubmitted}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <ProofStatusBadge status={proof.status} />
                                        {hasImg && (
                                            <button 
                                                onClick={() => handleViewProof(proof.proofUrl, proof.taskId)}
                                                disabled={loadingImageId === proof.taskId}
                                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded transition shadow-sm"
                                            >
                                                {loadingImageId === proof.taskId ? '...' : 'View Image'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-3 flex justify-end space-x-2">
                                    <button onClick={() => { setProofToDelete(proof); setIsDeleteModalOpen(true); }} className="text-xs bg-gray-700 hover:bg-gray-600 text-white font-bold py-1.5 px-3 rounded transition">Remove</button>
                                    {proof.status !== 'approved' && proof.status !== 'claimed' && proof.status !== 'rejected' && (
                                        <>
                                            <button onClick={() => adminUpdateTaskProofStatus(proof.userEmail, proof.taskId, proof.taskType, 'rejected')} className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded transition">Reject</button>
                                            <button onClick={() => adminUpdateTaskProofStatus(proof.userEmail, proof.taskId, proof.taskType, 'approved')} className="text-xs bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 rounded transition">Approve</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-gray-500 text-center mt-8">No tasks awaiting review.</p>
                )}
            </div>
        </div>
    );
};

export default ProofVerifier;
