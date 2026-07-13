

import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { db, collection, query, where, getDocs } from '../firebaseConfig';
import { UserData } from '../types';
import { motion } from 'framer-motion';
import { 
    Users, 
    Copy, 
    Share2, 
    Gift, 
    CheckCircle2, 
    Trophy, 
    Coins,
    UserPlus,
    Clock,
    AlertCircle
} from 'lucide-react';

const ReferralView: React.FC = () => {
    const { state, applyReferralCode } = useContext(AppContext);
    const { currentUser, referralConfig } = state;
    const [friendCode, setFriendCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [copied, setCopied] = useState(false);
    
    // Referral List State
    const [referralList, setReferralList] = useState<UserData[]>([]);
    const [loadingReferrals, setLoadingReferrals] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const urlRefCode = params.get('ref');
            if (urlRefCode) {
                const cleanedCode = urlRefCode.trim().toUpperCase();
                setFriendCode(cleanedCode);
                localStorage.setItem('pending_referral_code', cleanedCode);
            } else {
                const storedRefCode = localStorage.getItem('pending_referral_code');
                if (storedRefCode) {
                    setFriendCode(storedRefCode);
                }
            }
        }
    }, []);

    useEffect(() => {
        const fetchReferrals = async () => {
            if (!currentUser?.email) return;
            try {
                const q = query(collection(db, "users"), where("referredByEmail", "==", currentUser.email));
                const querySnapshot = await getDocs(q);
                const users: UserData[] = [];
                querySnapshot.forEach((doc: any) => {
                    users.push(doc.data() as UserData);
                });
                setReferralList(users);
            } catch (error) {
                console.error("Error fetching referrals:", error);
            } finally {
                setLoadingReferrals(false);
            }
        };
        fetchReferrals();
    }, [currentUser?.email]);

    if (!currentUser) return null;

    const copyToClipboard = () => {
        const text = `Join me on Only Memes Earn! Use my code ${currentUser.referralCode} to get started. https://onlymemesearn.store/?ref=${currentUser.referralCode}`;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = text;
            
            // Avoid scrolling to bottom
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.position = "fixed";
            
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }
            
            document.body.removeChild(textArea);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: 'Only Memes Earn',
            text: `Join me on Only Memes Earn! Use my code ${currentUser.referralCode} to get started.`,
            url: `https://onlymemesearn.store/?ref=${currentUser.referralCode}`
        };
        
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    copyToClipboard();
                }
            }
        } else {
            copyToClipboard();
        }
    };

    const handleSubmitCode = async () => {
        const code = friendCode.trim();
        if (!code) return;

        // Validation: Alphanumeric and max 8 chars
        const isValidFormat = /^[a-zA-Z0-9]{1,8}$/.test(code);
        
        if (!isValidFormat) {
            setStatus('error');
            setMessage('Invalid format. Code must be alphanumeric (max 8 chars).');
            return;
        }

        setStatus('processing');
        setMessage('');
        try {
            await applyReferralCode(code);
            setStatus('success');
            setMessage('Referral code applied successfully!');
            setFriendCode('');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Failed to apply code.');
        }
    };

    const maskEmail = (email: string) => {
        const [name, domain] = email.split('@');
        if (!name || name.length < 3) return email;
        return `${name.substring(0, 2)}***@${domain}`;
    };

    const isUserOnline = (lastActive?: string) => {
        if (!lastActive) return false;
        const diff = Date.now() - new Date(lastActive).getTime();
        return diff < 10 * 60 * 1000; // 10 minutes
    };

    const referralTokenName = state.tokenConfigs[referralConfig.token]?.name || referralConfig.token;

    return (
        <div className="pt-20 pb-24 px-4 max-w-screen-md mx-auto min-h-screen">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
            >
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-10 -mb-10"></div>
                    
                    <div className="relative z-10 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4 shadow-lg ring-4 ring-white/10">
                            <Gift className="w-8 h-8 text-yellow-300" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Invite Friends</h1>
                        <p className="text-indigo-100 max-w-sm mx-auto">
                            Earn <span className="font-bold text-yellow-300 text-lg">{referralConfig.amount} {referralTokenName}</span> for every friend who joins using your code!
                        </p>
                    </div>
                </div>

                {/* Referral Code Card */}
                <div className="bg-white dark:bg-[#161B22] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-indigo-500" />
                            Your Referral Code
                        </h3>
                        <span className="text-xs font-medium px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                            Share & Earn
                        </span>
                    </div>

                    <div 
                        onClick={() => {
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                                navigator.clipboard.writeText(currentUser.referralCode).then(() => {
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                });
                            } else {
                                const textArea = document.createElement("textarea");
                                textArea.value = currentUser.referralCode;
                                textArea.style.top = "0";
                                textArea.style.left = "0";
                                textArea.style.position = "fixed";
                                document.body.appendChild(textArea);
                                textArea.focus();
                                textArea.select();
                                try {
                                    document.execCommand('copy');
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                } catch (err) {}
                                document.body.removeChild(textArea);
                            }
                        }}
                        className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center mb-4 relative group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer"
                    >
                        <p className="text-3xl font-mono font-bold text-gray-900 dark:text-white tracking-widest select-all">
                            {currentUser.referralCode}
                        </p>
                        <p className="text-xs text-gray-400 mt-2 font-medium">{copied ? 'Copied!' : 'Tap to copy code'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={copyToClipboard}
                            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                                copied 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-2 ring-green-500/20' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200'
                            }`}
                        >
                            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy Code'}
                        </button>
                        <button 
                            onClick={handleShare}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                        >
                            <Share2 className="w-4 h-4" />
                            Invite
                        </button>
                    </div>
                </div>

                {/* Enter Code Section */}
                {!currentUser.referredByEmail && (
                    <div className="bg-white dark:bg-[#161B22] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-2 mb-4">
                            <UserPlus className="w-5 h-5 text-purple-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Have a Referral Code?</h3>
                        </div>
                        
                        <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <input 
                                    type="text" 
                                    placeholder="Enter friend's code"
                                    value={friendCode}
                                    maxLength={8}
                                    onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all font-mono uppercase placeholder:normal-case"
                                />
                            </div>
                            <button 
                                onClick={handleSubmitCode}
                                disabled={status === 'processing' || !friendCode}
                                className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-400 text-white font-semibold px-6 rounded-xl transition-colors disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                            >
                                {status === 'processing' ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : 'Apply'}
                            </button>
                        </div>
                        
                        {message && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className={`flex items-center gap-2 mt-3 text-sm font-medium ${status === 'error' ? 'text-red-500' : 'text-green-500'}`}
                            >
                                {status === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                {message}
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users className="w-12 h-12 text-blue-500" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Friends Joined</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {currentUser.referralStats?.totalReferrals || 0}
                        </p>
                    </div>
                    
                    <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Coins className="w-12 h-12 text-yellow-500" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Total Earned</p>
                        <div className="flex items-baseline gap-1">
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {(currentUser.referralStats?.totalEarned?.[referralConfig.token] || 0).toLocaleString()}
                            </p>
                            <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                                {referralTokenName}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Referral List */}
                <div className="bg-white dark:bg-[#161B22] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-gray-400" />
                            Your Friends
                        </h3>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                            {referralList.length} total
                        </span>
                    </div>
                    
                    {loadingReferrals ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        </div>
                    ) : referralList.length > 0 ? (
                        <div className="space-y-3">
                            {referralList.map((user, idx) => {
                                const isTgReferral = user.email?.endsWith('@tg.onlymemesearn.com') || user.email?.endsWith('@tg.onlymemesearn.store');
                                const displayUserText = isTgReferral 
                                    ? (user.displayName || 'Telegram User') 
                                    : maskEmail(user.email);
                                const initialChar = (user.displayName || user.email || 'U')
                                    .replace('@', '')
                                    .charAt(0)
                                    .toUpperCase();
                                return (
                                    <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shadow-inner">
                                                {initialChar}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                    {displayUserText}
                                                </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {isUserOnline(user.lastActive) ? (
                                                    <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center font-medium bg-green-100 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full">
                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                                                        Online
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-gray-500 flex items-center font-medium bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        Offline
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                {user.tapGameData?.score?.toLocaleString() || 0}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">Total Score</p>
                                    </div>
                                </motion.div>
                            ); })}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UserPlus className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-900 dark:text-white font-semibold mb-1">No friends yet</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                                Share your referral code with friends to start earning rewards together!
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ReferralView;

