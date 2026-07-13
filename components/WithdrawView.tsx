
import React, { useState, useContext, ChangeEvent, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { Withdrawal, Token, Transaction } from '../types';
import ExchangeIcon from './icons/ExchangeIcon';
import HistoryIcon from './icons/HistoryIcon';
import TokenIcon from './icons/TokenIcon';
import UploadIcon from './icons/UploadIcon';
import DownloadIcon from './icons/DownloadIcon';

import WithdrawSuccessModal from './WithdrawSuccessModal';

import { getApiBaseUrl } from '../utils/api';

const StatusBadge: React.FC<{ status: Withdrawal['status'] }> = ({ status }) => {
    const statusStyles = {
        pending: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
        processing: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 animate-pulse',
        completed: 'bg-green-500/20 text-green-600 dark:text-green-400',
        rejected: 'bg-red-500/20 text-red-600 dark:text-red-400'
    };
    const safeStatus = status || 'pending';
    const text = safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[safeStatus] || statusStyles.pending}`}>
            {text}
        </span>
    );
};

interface WithdrawalDetails {
    amount: number;
    token: Token;
    recipientAddress: string;
    transactionId?: string;
}

interface TokenListNewProps {
    tokens: Token[];
    onSelect: (c: Token) => void;
    getEffectiveBalance: (token: Token) => number;
    getTokenName: (token: Token) => string;
}

const TokenListNew: React.FC<TokenListNewProps> = ({ tokens, onSelect, getEffectiveBalance, getTokenName }) => (
    <div className="grid grid-cols-3 gap-3">
        {tokens.map(token => (
            <button 
                key={token} 
                onClick={() => onSelect(token)} 
                className="flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <TokenIcon token={token} className="w-8 h-8 mb-2" />
                <span className="text-xs font-bold text-gray-900 dark:text-white">{getTokenName(token)}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                    {getEffectiveBalance(token).toLocaleString()}
                </span>
            </button>
        ))}
    </div>
);

const WithdrawView: React.FC = () => {
    const { state, initiateWithdrawal, submitDepositProof, swapBalance, triggerAd, uploadProofAttachment, submitUidForVerification } = useContext(AppContext);
    
    // View Navigation State
    const [currentView, setCurrentView] = useState<'main' | 'withdraw' | 'deposit' | 'swap' | 'asset_details' | 'asset_withdraw' | 'asset_deposit' | 'history'>('main');
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);
    const [selectedExchange, setSelectedExchange] = useState<string>('');
    const [historyTab, setHistoryTab] = useState<'transactions' | 'withdrawals'>('transactions');
    const [expandedWithdrawalId, setExpandedWithdrawalId] = useState<string | null>(null);
    const [copiedWithdrawalId, setCopiedWithdrawalId] = useState<string | null>(null);

    // UID Validation State
    const [gameUid, setGameUid] = useState<string>('');
    const [uidFile, setUidFile] = useState<File | null>(null);
    const [uidPreviewUrl, setUidPreviewUrl] = useState<string>('');

    const isExchangeVerified = useMemo(() => {
        if (!state.currentUser) return false;
        if (selectedExchange) {
            return !!state.currentUser.exchangeUids?.[selectedExchange];
        }
        return !!state.currentUser.isUidVerified;
    }, [state.currentUser, selectedExchange]);

    const isPendingExchangeUid = useMemo(() => {
        if (!state.currentUser) return false;
        if (isExchangeVerified) return false;
        if (selectedExchange) {
            const hasRecordPending = !!state.currentUser.pendingExchangeUids?.[selectedExchange];
            return hasRecordPending || !!(state.currentUser.gameUid && state.currentUser.pendingExchange === selectedExchange);
        }
        return !!(state.currentUser.gameUid && !state.currentUser.isUidVerified);
    }, [state.currentUser, selectedExchange, isExchangeVerified]);

    // Sync gameUid and uidPreviewUrl from user profile if already set
    useEffect(() => {
        setUidFile(null); // Clear any locally selected file when exchange or user updates
        if (state.currentUser) {
            const isRejected = selectedExchange ? !!state.currentUser.rejectedExchangeUids?.[selectedExchange] : false;

            if (selectedExchange) {
                const exchangeUid = state.currentUser.exchangeUids?.[selectedExchange];
                if (exchangeUid && !isRejected) {
                    setGameUid(exchangeUid);
                } else if (state.currentUser.pendingExchangeUids?.[selectedExchange] && !isRejected) {
                    setGameUid(state.currentUser.pendingExchangeUids[selectedExchange]);
                } else if (state.currentUser.pendingExchange === selectedExchange && state.currentUser.gameUid && !isRejected) {
                    setGameUid(state.currentUser.gameUid);
                } else {
                    setGameUid('');
                }
            } else {
                if (state.currentUser.gameUid) {
                    setGameUid(state.currentUser.gameUid);
                } else {
                    setGameUid('');
                }
            }
            
            if (selectedExchange) {
                const specScreenshot = state.currentUser.exchangeScreenshotUrls?.[selectedExchange];
                if (specScreenshot && !isRejected) {
                    setUidPreviewUrl(specScreenshot);
                } else if (state.currentUser.pendingExchangeScreenshots?.[selectedExchange] && !isRejected) {
                    setUidPreviewUrl(state.currentUser.pendingExchangeScreenshots[selectedExchange]);
                } else if (state.currentUser.pendingExchange === selectedExchange && state.currentUser.uidScreenshotUrl && !isRejected) {
                    setUidPreviewUrl(state.currentUser.uidScreenshotUrl);
                } else {
                    setUidPreviewUrl('');
                }
            } else {
                if (state.currentUser.uidScreenshotUrl) {
                    setUidPreviewUrl(state.currentUser.uidScreenshotUrl);
                } else {
                    setUidPreviewUrl('');
                }
            }
        }
    }, [state.currentUser, selectedExchange]);

    const handleUidFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUidFile(file);
            setUidPreviewUrl(URL.createObjectURL(file));
        }
    };

    const uploadUidScreenshotIfNeeded = async (): Promise<string> => {
        if (uidFile) {
            return await uploadProofAttachment(uidFile);
        }
        return uidPreviewUrl;
    };

    const [uidSubmitStatus, setUidSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [uidSubmitError, setUidSubmitError] = useState('');

    const handleApplyUidVerification = async () => {
        setUidSubmitError('');
        setUidSubmitStatus('submitting');

        if (!gameUid.trim()) {
            setUidSubmitError('UID is required.');
            setUidSubmitStatus('error');
            return;
        }

        if (!uidPreviewUrl && !uidFile) {
            setUidSubmitError('A screenshot of the UID is required.');
            setUidSubmitStatus('error');
            return;
        }

        // Check uniqueness of UID
        try {
            const checkResponse = await axios.post('/api/withdraw/check-uid', { uid: gameUid.trim(), email: state.currentUser?.email });
            if (checkResponse.data && checkResponse.data.exists) {
                setUidSubmitError("This UID already exists and is linked to another account.");
                setUidSubmitStatus('error');
                return;
            }
        } catch (err: any) {
            console.error("UID check failed:", err);
        }

        try {
            const uploadedUrl = await uploadUidScreenshotIfNeeded();
            if (!uploadedUrl) {
                throw new Error("Failed to upload screenshot. Please try again.");
            }

            await submitUidForVerification(gameUid.trim(), uploadedUrl, selectedExchange);
            setUidSubmitStatus('success');
        } catch (err: any) {
            console.error("UID verification application failed:", err);
            setUidSubmitError(err.message || "Failed to submit UID verification.");
            setUidSubmitStatus('error');
        }
    };

    // Withdraw Form State
    const [recipientAddress, setRecipientAddress] = useState('');
    const [amountInput, setAmountInput] = useState('');
    const [formStatus, setFormStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [formError, setFormError] = useState('');
    const [withdrawMethod, setWithdrawMethod] = useState<Withdrawal['method']>('uid');

    // Deposit Form State
    const [depositAmount, setDepositAmount] = useState('');
    const [depositFile, setDepositFile] = useState<File | null>(null);
    const [depositPreviewUrl, setDepositPreviewUrl] = useState<string | null>(null);
    const [depositStatus, setDepositStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [depositError, setDepositError] = useState('');
    const [copyFeedback, setCopyFeedback] = useState(false);

    // Swap Form State
    const [swapToToken, setSwapToToken] = useState<Token | null>(null);
    const [swapAmount, setSwapAmount] = useState('');
    const [swapStatus, setSwapStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [swapMessage, setSwapMessage] = useState('');

    // Confirmation Modal State (Withdrawal)
    const [isConfirming, setIsConfirming] = useState(false);
    const [withdrawalDetails, setWithdrawalDetails] = useState<WithdrawalDetails | null>(null);
    const [modalError, setModalError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasVerified, setHasVerified] = useState(false);
    
    // Success Modal State
    const [successModalData, setSuccessModalData] = useState<WithdrawalDetails | null>(null);

    const balances = state.currentUser?.balance || {};
    const allWithdrawals = state.currentUser?.withdrawals || [];
    const transactionHistory = state.currentUser?.tapGameData?.history || [];
    
    // Include all transactions, mapping those without a specific token to 'USHA' (the primary reward token)
    const walletTransactions = transactionHistory.map(tx => ({
        ...tx,
        token: tx.token || 'USHA'
    }));

    const withdrawalSettings = state.withdrawalSettings;
    const availableTokens = state.availableTokens;

    // Helper: Get effective balance
    const getEffectiveBalance = (token: Token | null) => {
        if (!token) return 0;
        return balances[token] || 0;
    };

    const getTokenName = (token: Token | null) => {
        if (!token) return '';
        return state.tokenConfigs[token]?.name || token;
    };
    
    // Calculate remaining daily limit
    const calculateRemainingLimit = (token: Token) => {
        const dailyLimit = withdrawalSettings[token]?.dailyLimit ?? Infinity;
        const today = new Date().toDateString();
        const todaysWithdrawals = allWithdrawals
            .filter(w => w.token === token && new Date(w.timestamp).toDateString() === today)
            .reduce((sum, w) => sum + w.amount, 0);
        return Math.max(0, dailyLimit - todaysWithdrawals);
    };

    // --- Helpers ---

    const getDepositAddress = (token: Token) => {
        const prefix = ['BTC', 'LTC', 'DOGE'].some(c => token.includes(c)) ? 'bc1' : '0x';
        const hash = token.split('').map(c => c.charCodeAt(0).toString(16)).join('') + 'd3adbeef' + 'c0ffee';
        return `${prefix}${hash.substring(0, 38)}...`;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

    // --- Navigation Handlers ---

    const handleAssetClick = (token: Token) => {
        setSelectedToken(token);
        setCurrentView('asset_details');
    };

    const handleStartWithdraw = (token: Token) => {
        if (token === 'USHA') {
            alert("Withdrawals for USHA are coming soon!");
            return;
        }
        if (withdrawalSettings[token] && !withdrawalSettings[token].enabled) {
            alert(`Withdrawals for ${token} are currently disabled.`);
            return;
        }
        setSelectedToken(token);
        setRecipientAddress('');
        setAmountInput('');
        setFormError('');
        setFormStatus('idle');
        setWithdrawMethod('uid'); // Defaulting to UID for simplicity as per requirement
        
        const exchanges = (state.exchanges || []).filter(e => e.enabled).map(e => e.name);
        setSelectedExchange(exchanges.length > 0 ? exchanges[0] : '');
    };

    const handleStartAssetWithdraw = () => {
        if (!selectedToken) return;
        handleStartWithdraw(selectedToken);
        if (selectedToken !== 'USHA' && (!withdrawalSettings[selectedToken] || withdrawalSettings[selectedToken].enabled)) {
            setCurrentView('asset_withdraw');
        }
    };

    const handleStartDeposit = (token: Token) => {
        if (token === 'USHA') {
            alert("Deposits for USHA are coming soon!");
            return;
        }
        
        const settings = withdrawalSettings[token];
        // Deposits are disabled by default for all coins unless explicitly enabled
        if (!settings || settings.depositEnabled !== true) {
            alert(`Deposits for ${token} are currently disabled.`);
            return;
        }

        setSelectedToken(token);
        setDepositAmount('');
        setDepositFile(null);
        setDepositPreviewUrl(null);
        setDepositStatus('idle');
        setDepositError('');
    };

    const handleStartAssetDeposit = () => {
        if (!selectedToken) return;
        handleStartDeposit(selectedToken);
        // Only switch view if we successfully started the deposit process (i.e. not USHA and enabled)
        const settings = withdrawalSettings[selectedToken];
        const isEnabled = settings && settings.depositEnabled === true;
        
        if (selectedToken !== 'USHA' && isEnabled) {
            setCurrentView('asset_deposit');
        }
    };

    const handleBack = () => {
        if (currentView === 'asset_withdraw' || currentView === 'asset_deposit') {
            setCurrentView('asset_details');
            setRecipientAddress('');
            setAmountInput('');
            setFormError('');
            setDepositAmount('');
            return;
        }

        if (currentView === 'asset_details') {
            setSelectedToken(null);
            setCurrentView('main');
            return;
        }

        if (selectedToken) {
            setSelectedToken(null);
        } else {
            setCurrentView('main');
            setSwapToToken(null);
            setSwapAmount('');
            setSwapStatus('idle');
            setSwapMessage('');
        }
    };

    // --- Deposit Logic ---

    const handleDepositFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setDepositError('');
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setDepositError('Please upload an image file.');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setDepositError('File size exceeds 5MB.');
                return;
            }
            setDepositFile(file);
            setDepositPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleDepositSubmit = () => {
        if (!selectedToken) return;
        if (!depositAmount || parseFloat(depositAmount) <= 0) {
            setDepositError('Please enter a valid deposit amount.');
            return;
        }
        if (!depositFile) {
            setDepositError('Please upload a screenshot of your transaction.');
            return;
        }

        setDepositStatus('uploading');
        setIsSubmitting(true);
        const reader = new FileReader();
        reader.readAsDataURL(depositFile);
        reader.onload = async () => {
            const proofUrl = reader.result as string;
            try {
                await submitDepositProof(
                    `dep-${Date.now()}`,
                    `Deposit ${depositAmount} ${selectedToken}`,
                    proofUrl,
                    parseFloat(depositAmount),
                    selectedToken
                );
                setDepositStatus('success');
                setIsSubmitting(false);
                setTimeout(() => {
                    handleBack();
                }, 2000);
            } catch (err: any) {
                setDepositError(err.message || 'Failed to submit proof.');
                setDepositStatus('error');
                setIsSubmitting(false);
            }
        };
        reader.onerror = () => {
            setDepositError('Failed to read file.');
            setDepositStatus('error');
        };
    };

    // --- Swap Logic ---
    const handleSwapMax = () => {
        setSwapAmount(getEffectiveBalance('USHA').toString());
    };

    const calculateSwap = () => {
        if (!swapToToken) return { received: 0, rate: 0, fee: 0, feePercent: 0 };
        const amount = parseFloat(swapAmount) || 0;
        const settings = withdrawalSettings[swapToToken];
        
        let rate = settings?.swapRate ?? 0;
        
        // Check if there's a market for this pair to use real-time price
        const market = state.markets.find(m => 
            (m.base === swapToToken && m.quote === 'USHA') || 
            (m.base === 'USHA' && m.quote === swapToToken)
        );
        
        if (market) {
            if (market.base === swapToToken && market.quote === 'USHA') {
                rate = 1 / market.price; // USHA -> swapToToken
            } else {
                rate = market.price; // USHA -> swapToToken
            }
        }

        const feePercent = settings?.swapFee ?? 0;
        const fee = amount * (feePercent / 100);
        const received = (amount - fee) * rate;
        return { received, rate, fee, feePercent };
    }

    const { received, rate, fee, feePercent } = calculateSwap();

    const handleSwapSubmit = () => {
        if (!swapToToken) {
            setSwapMessage('Please select a token to receive.');
            setSwapStatus('error');
            return;
        }
        
        const amount = parseFloat(swapAmount);
        if (isNaN(amount) || amount <= 0) {
            setSwapMessage('Invalid amount.');
            setSwapStatus('error');
            return;
        }

        const balance = getEffectiveBalance('USHA');
        if (amount > balance) {
            setSwapMessage('Insufficient USHA balance in wallet.');
            setSwapStatus('error');
            return;
        }

        setSwapStatus('processing');
        setIsSubmitting(true);
        
        setTimeout(async () => {
            try {
                await swapBalance('USHA', swapToToken, amount, received);
                setSwapStatus('success');
                setSwapMessage(`Successfully swapped ${amount} USHA to ${received.toLocaleString()} ${swapToToken}`);
                setSwapAmount('');
                setIsSubmitting(false);
            } catch (e: any) {
                setSwapStatus('error');
                setSwapMessage('Swap failed.');
                setIsSubmitting(false);
                console.error(e?.message || String(e));
            }
        }, 1500);
    };

    // --- Withdraw Logic ---

    const handleSetMax = () => {
        if (!selectedToken) return;
        const balance = getEffectiveBalance(selectedToken);
        setAmountInput(balance.toString());
    }

    const handleWithdrawClick = async () => {
        setFormError('');
        if (!selectedToken) return;

        if (!isExchangeVerified) {
            setFormError('Your exchange UID has not been verified by the admin yet.');
            return;
        }

        if (!gameUid.trim()) {
            setFormError('UID is required.');
            return;
        }
        
        const isUidMethod = withdrawalSettings[selectedToken]?.methodLabel?.toUpperCase() === 'UID';
        const finalRecipientAddress = isUidMethod ? gameUid.trim() : recipientAddress.trim();

        if (!finalRecipientAddress) {
            setFormError(`${withdrawalSettings[selectedToken]?.methodLabel || 'Recipient address/ID'} is required.`);
            return;
        }

        const amount = parseFloat(amountInput);
        if (isNaN(amount) || amount <= 0) {
            setFormError('Please enter a valid amount greater than zero.');
            return;
        }
        
        const availableExchanges = (state.exchanges || []).filter(e => e.enabled).map(e => e.name);
        if (availableExchanges.length > 0 && !selectedExchange) {
            setFormError('Please select an exchange.');
            return;
        }
        
        const balance = getEffectiveBalance(selectedToken);
        const minWithdraw = withdrawalSettings[selectedToken]?.minAmount ?? 0;
        const remainingDaily = calculateRemainingLimit(selectedToken);
        const dailyCountLimit = withdrawalSettings[selectedToken]?.dailyCountLimit ?? 3;
        const todaysCount = allWithdrawals.filter(w => w.token === selectedToken && new Date(w.timestamp).toDateString() === new Date().toDateString()).length;

        if (amount > balance) {
            setFormError(`Insufficient balance.`);
            return;
        }
        if (amount < minWithdraw) {
            setFormError(`Minimum withdrawal is ${minWithdraw.toLocaleString()} ${selectedToken}.`);
            return;
        }
        if (amount > remainingDaily) {
            setFormError(`Daily limit reached.`);
            return;
        }
        if (todaysCount >= dailyCountLimit) {
            setFormError(`Daily frequency limit reached.`);
            return;
        }

        // Check uniqueness of UID on click
        setIsSubmitting(true);
        try {
            const response = await axios.post('/api/withdraw/check-uid', { uid: gameUid.trim(), email: state.currentUser?.email });
            if (response.data && response.data.exists) {
                setFormError("This UID already exists and is linked to another account.");
                setIsSubmitting(false);
                return;
            }
        } catch (err: any) {
            console.error("UID check failed:", err);
        } finally {
            setIsSubmitting(false);
        }

        setWithdrawalDetails({
            amount: amount,
            token: selectedToken,
            recipientAddress: finalRecipientAddress,
            exchange: selectedExchange || undefined
        });
        setHasVerified(false);
        setIsConfirming(true);
    };

    const confirmWithdrawal = async () => {
        if (!withdrawalDetails || !hasVerified) return;

        setFormStatus('processing');
        setIsSubmitting(true);
        setModalError('');

        // Pre-check UID uniqueness again just before finalizing
        try {
            const checkResponse = await axios.post('/api/withdraw/check-uid', { uid: gameUid.trim(), email: state.currentUser?.email });
            if (checkResponse.data && checkResponse.data.exists) {
                throw new Error("This UID already exists and is linked to another account.");
            }
        } catch (err: any) {
            setModalError(err.message || "Failed to verify UID uniqueness.");
            setIsSubmitting(false);
            setFormStatus('error');
            return;
        }

        // Upload UID Screenshot if a new one was selected and not verified yet
        let finalUidScreenshotUrl = state.currentUser?.uidScreenshotUrl || '';
        if (!isExchangeVerified) {
            try {
                finalUidScreenshotUrl = await uploadUidScreenshotIfNeeded();
                if (!finalUidScreenshotUrl) {
                    throw new Error("UID screenshot required.");
                }
            } catch (err: any) {
                setModalError("Failed to upload UID screenshot: " + err.message);
                setIsSubmitting(false);
                setFormStatus('error');
                return;
            }
        }

        try {
            // Show Rewarded Ad before confirming
            await triggerAd('rewarded');

            const txId = await initiateWithdrawal(
                withdrawalDetails.recipientAddress, 
                withdrawalDetails.token, 
                withdrawalDetails.amount, 
                withdrawMethod, 
                withdrawalDetails.exchange,
                gameUid.trim(),
                finalUidScreenshotUrl
            );
            
            // Set Success Data for Modal
            setSuccessModalData({
                ...withdrawalDetails,
                transactionId: txId
            });
            
            setFormStatus('success');
            setRecipientAddress('');
            setAmountInput('');
            setIsConfirming(false); // Close confirm modal
            setHasVerified(false);
            
            // Note: We don't clear selectedToken yet so user can see context, but Success Modal takes over
        } catch (err: any) {
            setModalError(err.message);
            setFormStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setIsConfirming(false);
        setWithdrawalDetails(null);
        setModalError('');
        setHasVerified(false);
    };
    
    const closeSuccessModal = () => {
        setSuccessModalData(null);
        setFormStatus('idle');
        if (currentView === 'asset_withdraw') {
            handleBack();
        } else {
            setSelectedToken(null);
        }
    };

    // --- Sub-components ---
    // TokenListNew moved outside


    // Dynamic Logic for rendering the deposit view
    const renderDepositContent = () => {
        if (!selectedToken) return null;
        
        const settings = withdrawalSettings[selectedToken];
        // Use configured address or fallback to generated one
        const depositAddress = settings?.depositAddress || getDepositAddress(selectedToken);

        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                <p className="text-gray-400 text-sm mb-4">Send only {selectedToken} ({withdrawalSettings[selectedToken]?.network || 'Standard'}) to this address.</p>
                
                <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-between mb-6 group cursor-pointer" onClick={() => copyToClipboard(depositAddress)}>
                    <span className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate mr-2">{depositAddress}</span>
                    <button className="p-2 bg-white dark:bg-gray-800 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition border border-gray-200 dark:border-gray-700">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                </div>
                {copyFeedback && <p className="text-green-400 text-xs font-bold mb-4">Address Copied!</p>}

                <div className="text-left border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Submit Deposit Proof</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Amount Sent</label>
                            <input 
                                type="number" 
                                value={depositAmount} 
                                onChange={e => setDepositAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-green-500 focus:outline-none"
                                step="any"
                            />
                        </div>
                        <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-4 hover:bg-gray-700/30 transition text-center cursor-pointer">
                            <input type="file" onChange={handleDepositFileChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            {depositPreviewUrl ? (
                                <img src={depositPreviewUrl} alt="Preview" className="max-h-32 mx-auto rounded-md" />
                            ) : (
                                <div className="flex flex-col items-center">
                                    <UploadIcon className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-400">Upload Transaction Screenshot</span>
                                </div>
                            )}
                        </div>
                        {depositError && <p className="text-red-400 text-sm">{depositError}</p>}
                        <button 
                            onClick={handleDepositSubmit}
                            disabled={depositStatus === 'uploading'}
                            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg shadow-green-600/20 transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                            {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Confirm Deposit'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-20 pb-24 px-4 max-w-screen-md mx-auto min-h-screen">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                    <ExchangeIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exchange & Wallet</h1>
            </div>

            {/* Success Modal */}
            {successModalData && (
                <WithdrawSuccessModal 
                    isOpen={!!successModalData} 
                    onClose={closeSuccessModal}
                    amount={successModalData.amount}
                    token={successModalData.token}
                    address={successModalData.recipientAddress}
                    transactionId={successModalData.transactionId || ''}
                />
            )}

            {isConfirming && withdrawalDetails && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirm Withdrawal</h3>
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Amount</span>
                                <span className="text-gray-900 dark:text-white font-mono">{withdrawalDetails.amount.toLocaleString()} {state.tokenConfigs[withdrawalDetails.token]?.name || withdrawalDetails.token}</span>
                            </div>
                            {withdrawalDetails.exchange && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Exchange</span>
                                    <span className="text-gray-900 dark:text-white font-bold">{withdrawalDetails.exchange}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Recipient</span>
                                <span className="text-gray-900 dark:text-white font-mono truncate max-w-[150px]">{withdrawalDetails.recipientAddress}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">UID</span>
                                <span className="text-gray-900 dark:text-white font-mono truncate max-w-[150px]">{gameUid}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Network</span>
                                <span className="text-gray-900 dark:text-white">{withdrawalSettings[withdrawalDetails.token]?.network || 'Standard'}</span>
                            </div>
                        </div>
                        
                        <label className="flex items-start space-x-3 mb-6 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input type="checkbox" checked={hasVerified} onChange={e => setHasVerified(e.target.checked)} className="peer sr-only" />
                                <div className="w-5 h-5 border-2 border-gray-500 rounded peer-checked:bg-green-500 peer-checked:border-green-500 transition-colors"></div>
                                <svg className="w-3 h-3 text-white dark:text-gray-900 absolute left-1 top-1 opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                            <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">I confirm that the address is correct and on the right network.</span>
                        </label>

                        {modalError && <p className="text-red-500 text-sm mb-4 text-center">{modalError}</p>}

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={closeModal} className="py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition">Cancel</button>
                            <button 
                                onClick={confirmWithdrawal} 
                                disabled={!hasVerified || formStatus === 'processing'}
                                className="py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {currentView === 'main' && (
                <div className="space-y-6">
                    {/* Main Wallet Card */}
                    <div className="bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                        <div className="relative z-10">
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Balance (USHA)</p>
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-6">
                                {getEffectiveBalance('USHA').toLocaleString()} <span className="text-lg text-orange-500">USHA</span>
                            </h2>
                            <div className="grid grid-cols-4 gap-3">
                                <button onClick={() => setCurrentView('deposit')} className="flex flex-col items-center p-3 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition">
                                    <div className="bg-green-500/20 p-2 rounded-full mb-1"><DownloadIcon className="w-5 h-5 text-green-600 dark:text-green-400" /></div>
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Deposit</span>
                                </button>
                                <button 
                                    onClick={() => setCurrentView('withdraw')} 
                                    className="flex flex-col items-center p-3 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition"
                                >
                                    <div className="p-2 bg-red-500/20 text-red-600 dark:text-red-400 rounded-full mb-1">
                                        <UploadIcon className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Withdraw</span>
                                </button>
                                <button onClick={() => setCurrentView('swap')} className="flex flex-col items-center p-3 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition">
                                    <div className="bg-blue-500/20 p-2 rounded-full mb-1"><ExchangeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Swap</span>
                                </button>
                                <button onClick={() => setCurrentView('history')} className="flex flex-col items-center p-3 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition">
                                    <div className="bg-purple-500/20 p-2 rounded-full mb-1"><HistoryIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div>
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">History</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Assets List */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Your Assets</h3>
                        <div className="space-y-2">
                            {availableTokens.map(token => (
                                <div key={token} onClick={() => handleAssetClick(token)} className="flex items-center justify-between p-4 bg-white dark:bg-[#161B22] rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <TokenIcon token={token} className="w-10 h-10" />
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{getTokenName(token)}</p>
                                            <p className="text-xs text-gray-500">{token}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white">{getEffectiveBalance(token).toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">Available</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {currentView === 'asset_details' && selectedToken && (
                <div className="animate-fade-in">
                    <button onClick={handleBack} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        Back
                    </button>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center mb-6 shadow-xl">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-gray-600 shadow-inner">
                            <TokenIcon token={selectedToken} className="w-12 h-12" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{getEffectiveBalance(selectedToken).toLocaleString()}</h2>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mb-6">{selectedToken} Balance</p>

                        {/* Special handling for USHA Coming Soon + Generic Disabled State */}
                        {(selectedToken === 'USHA') ? (
                             <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4 mt-6">
                                <div className="flex justify-center mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-yellow-400 font-bold text-sm">Transfers Coming Soon</p>
                                <p className="text-xs text-gray-400 mt-1">Deposits and withdrawals for USHA are not yet available.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={handleStartAssetDeposit}
                                    className={`flex items-center justify-center py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition shadow-lg shadow-green-900/20`}
                                >
                                    <DownloadIcon className="w-5 h-5 mr-2" /> Deposit
                                </button>
                                <button 
                                    onClick={handleStartAssetWithdraw}
                                    className="flex items-center justify-center py-3 rounded-xl font-bold transition shadow-lg bg-red-600 hover:bg-red-500 text-white shadow-red-900/20"
                                >
                                    <UploadIcon className="w-5 h-5 mr-2" /> Withdraw
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Filtered History for Asset Details */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                            <span>History</span>
                            <span className="text-xs bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">{selectedToken}</span>
                        </h3>
                        {walletTransactions.filter(tx => tx.token === selectedToken).length > 0 ? (
                            <div className="space-y-2">
                                {walletTransactions.filter(tx => tx.token === selectedToken).slice().reverse().map((tx, idx) => (
                                    <div key={tx.id || idx} className="p-3 bg-white dark:bg-[#161B22] rounded-lg border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-2 rounded-full ${tx.isPositive ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                                                {tx.isPositive ? <DownloadIcon className="w-4 h-4 text-green-600 dark:text-green-400" /> : <UploadIcon className="w-4 h-4 text-red-600 dark:text-red-400" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{tx.type}</p>
                                                <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-mono text-sm font-bold ${tx.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                {tx.isPositive ? '+' : '-'}{tx.amount}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                <p className="text-sm">No transactions for {selectedToken} yet</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {currentView === 'history' && (
                <div className="animate-fade-in">
                    <button onClick={handleBack} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        Back
                    </button>
                    
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Transaction History</h2>

                    {/* Tab Selection */}
                    <div className="flex bg-gray-100 dark:bg-gray-800/60 p-1 rounded-xl mb-6 border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setHistoryTab('transactions')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                historyTab === 'transactions'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            Wallet Activities
                        </button>
                        <button
                            onClick={() => setHistoryTab('withdrawals')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                historyTab === 'withdrawals'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            Withdrawal History
                        </button>
                    </div>

                    {historyTab === 'transactions' ? (
                        walletTransactions.length > 0 ? (
                            <div className="space-y-2">
                                {walletTransactions.slice().reverse().map((tx, idx) => (
                                    <div key={tx.id || idx} className="p-3 bg-white dark:bg-[#161B22] rounded-lg border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-2 rounded-full ${tx.isPositive ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                                                {tx.isPositive ? <DownloadIcon className="w-4 h-4 text-green-600 dark:text-green-400" /> : <UploadIcon className="w-4 h-4 text-red-600 dark:text-red-400" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{tx.type}</p>
                                                <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-mono text-sm font-bold ${tx.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                {tx.isPositive ? '+' : '-'}{tx.amount}
                                            </p>
                                            {tx.token && <p className="text-xs text-gray-500">{tx.token}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                <p className="text-sm">No transactions yet</p>
                            </div>
                        )
                    ) : (
                        /* Withdrawal History Real-Time Component */
                        allWithdrawals.length > 0 ? (
                            <div className="space-y-3">
                                {allWithdrawals.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((w) => {
                                    const isExpanded = expandedWithdrawalId === w.id;
                                    const isCopied = copiedWithdrawalId === w.id;
                                    
                                    const handleCopyToClipboard = (e: React.MouseEvent, text: string, copyId: string) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(text);
                                        setCopiedWithdrawalId(copyId);
                                        setTimeout(() => setCopiedWithdrawalId(null), 2000);
                                    };

                                    return (
                                        <div key={w.id} className="bg-white dark:bg-[#161B22] rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all overflow-hidden shadow-sm">
                                            {/* Header / Clickable Area */}
                                            <div 
                                                onClick={() => setExpandedWithdrawalId(isExpanded ? null : w.id)}
                                                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50/50 dark:hover:bg-zinc-900/40 select-none transition-colors"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-orange-500/10 dark:bg-orange-500/20 rounded-full">
                                                        <TokenIcon token={w.token} className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold text-gray-900 dark:text-white text-base">
                                                                {w.amount.toLocaleString()} {w.token}
                                                            </span>
                                                            {w.exchange && (
                                                                <span className="text-[10px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-md">
                                                                    {w.exchange}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                                            {new Date(w.timestamp).toLocaleDateString()} at {new Date(w.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <StatusBadge status={w.status} />
                                                    <svg 
                                                        className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Collapsible Details Area */}
                                            {isExpanded && (
                                                <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-zinc-900/20 p-4 space-y-4 animate-fade-in text-sm text-gray-600 dark:text-gray-300">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {/* Details Block */}
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800/50">
                                                                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Request ID</span>
                                                                <button 
                                                                    onClick={(e) => handleCopyToClipboard(e, w.id, w.id)}
                                                                    className="text-xs font-mono text-gray-500 dark:text-gray-400 hover:text-orange-500 flex items-center gap-1 transition-colors bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded"
                                                                >
                                                                    {w.id.substring(0, 8)}... {isCopied ? 'Copied!' : 'Copy'}
                                                                </button>
                                                            </div>
                                                            
                                                            <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800/50">
                                                                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Payout Method</span>
                                                                <span className="font-semibold text-gray-800 dark:text-gray-200 uppercase text-xs">{w.method}</span>
                                                            </div>

                                                            {w.gameUid && (
                                                                <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800/50">
                                                                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Game Account UID</span>
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200 text-xs">{w.gameUid}</span>
                                                                        {(state.currentUser?.exchangeUids?.[w.exchange || ''] === w.gameUid || (state.currentUser?.isUidVerified && state.currentUser?.gameUid === w.gameUid)) && (
                                                                            <span className="text-[10px] font-bold bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/25 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                                                Verified
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {w.recipientAddress && (
                                                                <div className="flex flex-col py-1 border-b border-gray-100 dark:border-gray-800/50 gap-0.5">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Recipient Address</span>
                                                                        <button 
                                                                            onClick={(e) => handleCopyToClipboard(e, w.recipientAddress, w.id + '_addr')}
                                                                            className="text-[10px] text-orange-500 hover:underline transition-all"
                                                                        >
                                                                            {copiedWithdrawalId === w.id + '_addr' ? 'Copied!' : 'Copy'}
                                                                        </button>
                                                                    </div>
                                                                    <span className="font-mono text-xs text-gray-800 dark:text-gray-200 break-all select-all">
                                                                        {w.recipientAddress}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Screenshot Visual Column if present */}
                                                        {w.uidScreenshotUrl && (
                                                            <div className="flex flex-col gap-1.5 bg-gray-50 dark:bg-[#1C2128] p-3 rounded-lg border border-gray-200/50 dark:border-gray-800">
                                                                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">Linked UID Screenshot</span>
                                                                <a 
                                                                    href={w.uidScreenshotUrl} 
                                                                    target="_blank" 
                                                                    rel="noreferrer" 
                                                                    className="relative rounded overflow-hidden aspect-video border border-gray-300 dark:border-gray-700 bg-black block group"
                                                                >
                                                                    <img 
                                                                        src={w.uidScreenshotUrl} 
                                                                        alt="UID Verification Attachment" 
                                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <span className="text-xs font-bold text-white bg-black/60 px-2 py-1 rounded-md">View Original</span>
                                                                    </div>
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Progress timeline visualizer */}
                                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-3">
                                                            Status Timeline (Real-Time)
                                                        </span>
                                                        
                                                        <div className="relative flex justify-between items-center max-w-md mx-auto py-2 px-2">
                                                            {/* Connector Line */}
                                                            <div className="absolute top-1/2 left-4 right-4 h-1 bg-gray-200 dark:bg-gray-800 -translate-y-1/2 rounded-full z-0">
                                                                <div 
                                                                    className={`h-full bg-orange-500 rounded-full transition-all duration-500 ${
                                                                        w.status === 'completed' ? 'w-full' : w.status === 'processing' ? 'w-1/2' : 'w-0'
                                                                    }`} 
                                                                />
                                                            </div>

                                                            {/* Step 1: Requested */}
                                                            <div className="relative z-10 flex flex-col items-center">
                                                                <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-orange-500/20">
                                                                    ✓
                                                                </div>
                                                                <span className="text-[10px] font-bold text-gray-900 dark:text-white mt-1.5">Submitted</span>
                                                            </div>

                                                            {/* Step 2: Processing */}
                                                            <div className="relative z-10 flex flex-col items-center">
                                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                                                                    w.status === 'processing' || w.status === 'completed'
                                                                    ? 'bg-orange-500 text-white shadow-orange-500/20'
                                                                    : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                                                                }`}>
                                                                    {w.status === 'processing' ? (
                                                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                    ) : w.status === 'completed' ? '✓' : '2'}
                                                                </div>
                                                                <span className={`text-[10px] font-bold mt-1.5 ${
                                                                    w.status === 'processing' || w.status === 'completed' ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                                                                }`}>
                                                                    Approved
                                                                </span>
                                                            </div>

                                                            {/* Step 3: Completed or Rejected */}
                                                            <div className="relative z-10 flex flex-col items-center">
                                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                                                                    w.status === 'completed'
                                                                    ? 'bg-green-500 text-white shadow-green-500/20'
                                                                    : w.status === 'rejected'
                                                                    ? 'bg-red-500 text-white shadow-red-500/20'
                                                                    : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                                                                }`}>
                                                                    {w.status === 'completed' ? '✓' : w.status === 'rejected' ? '✗' : '3'}
                                                                </div>
                                                                <span className={`text-[10px] font-bold mt-1.5 ${
                                                                    w.status === 'completed' 
                                                                    ? 'text-green-500' 
                                                                    : w.status === 'rejected' 
                                                                    ? 'text-red-500 font-black' 
                                                                    : 'text-gray-400'
                                                                }`}>
                                                                    {w.status === 'rejected' ? 'Rejected' : 'Completed'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                <p className="text-sm">No withdrawal history found</p>
                            </div>
                        )
                    )}
                </div>
            )}

            {(currentView === 'withdraw' || currentView === 'asset_withdraw') && (
                <div className="animate-fade-in">
                    <button onClick={handleBack} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        Back
                    </button>
                    {!selectedToken ? (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Select Asset to Withdraw</h2>
                            <TokenListNew tokens={availableTokens} onSelect={handleStartWithdraw} getEffectiveBalance={getEffectiveBalance} getTokenName={getTokenName} />
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-3 mb-6">
                                <TokenIcon token={selectedToken} className="w-10 h-10" />
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Withdraw {selectedToken}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Balance: {getEffectiveBalance(selectedToken).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {(() => {
                                    const availableExchanges = (state.exchanges || []).filter(e => e.enabled).map(e => e.name);
                                    if (availableExchanges.length > 0) {
                                        return (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Select Exchange</label>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                    {availableExchanges.map(exchange => (
                                                        <button
                                                            key={exchange}
                                                            onClick={() => setSelectedExchange(exchange)}
                                                            className={`py-2 px-3 rounded-lg text-sm font-bold transition-all border ${
                                                                selectedExchange === exchange 
                                                                ? 'bg-orange-500/20 border-orange-500 text-orange-600 dark:text-orange-400' 
                                                                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                                                            }`}
                                                        >
                                                            {exchange}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                                                          {isExchangeVerified ? (
                                    <>
                                        {withdrawalSettings[selectedToken]?.methodLabel?.toUpperCase() !== 'UID' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">{withdrawalSettings[selectedToken]?.methodLabel || 'Recipient Address'}</label>
                                                <input 
                                                    type="text" 
                                                    value={recipientAddress}
                                                    onChange={e => setRecipientAddress(e.target.value)}
                                                    placeholder={`Enter ${withdrawalSettings[selectedToken]?.methodLabel || 'Address'}`}
                                                    className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:outline-none"
                                                    step="any"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Your Verified UID for {selectedExchange || 'Default'}</label>
                                            <input 
                                                type="text" 
                                                value={gameUid}
                                                placeholder="Verified UID"
                                                className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                                                disabled={true}
                                            />
                                            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                ✓ Verified UID: {gameUid} for {selectedExchange || 'Default'}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Amount</label>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    value={amountInput}
                                                    onChange={e => setAmountInput(e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:outline-none pr-16"
                                                    step="any"
                                                />
                                                <button 
                                                    onClick={handleSetMax}
                                                    className="absolute right-2 top-2 bottom-2 px-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs font-bold text-gray-900 dark:text-white rounded-md transition"
                                                >
                                                    MAX
                                                </button>
                                            </div>
                                            <div className="flex justify-between mt-1 text-xs text-gray-500">
                                                <span>Min: {(withdrawalSettings[selectedToken]?.minAmount ?? 0).toLocaleString()}</span>
                                                <span>Fee: 0 {selectedToken}</span>
                                            </div>
                                        </div>

                                        {formError && (
                                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm flex items-center space-x-2">
                                                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <span>{formError}</span>
                                            </div>
                                        )}

                                        <button 
                                            onClick={handleWithdrawClick}
                                            className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg shadow-lg shadow-orange-600/20 transition-all mt-2"
                                        >
                                            Review Withdrawal
                                        </button>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        {state.currentUser?.rejectedExchangeUids?.[selectedExchange || "Default"] && (
                                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600 dark:text-red-400">
                                                <h4 className="font-bold mb-1 flex items-center gap-1.5">
                                                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Verification Request Rejected
                                                </h4>
                                                <p className="text-xs leading-relaxed">
                                                    Your previous UID verification request for <strong>{selectedExchange || 'Default'}</strong> was rejected by the admin. Please enter your correct UID, upload a new profile screenshot, and re-submit.
                                                </p>
                                            </div>
                                        )}

                                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-600 dark:text-yellow-400">
                                            <h4 className="font-bold mb-1 flex items-center gap-1.5">
                                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                Exchange UID Verification Required
                                            </h4>
                                            <p className="text-xs leading-relaxed">
                                                You must verify your exchange UID for <strong>{selectedExchange || 'your selected exchange'}</strong> before requesting withdrawals. Please enter your exchange UID and upload a screenshot of your exchange profile showing your UID. After the admin approves your UID, you can make withdrawals instantly.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Enter your UID for {selectedExchange}</label>
                                            <input 
                                                type="text" 
                                                value={gameUid}
                                                onChange={e => setGameUid(e.target.value)}
                                                placeholder={`Enter ${selectedExchange} UID`}
                                                className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                                                disabled={isPendingExchangeUid}
                                            />
                                            {isPendingExchangeUid ? (
                                                <p className="text-xs text-yellow-500 mt-1.5 flex items-center gap-1.5">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse"></span>
                                                    ⚠ UID verification for {selectedExchange} is pending admin approval. You will be notified once verified.
                                                </p>
                                            ) : null}
                                        </div>

                                        {!isPendingExchangeUid && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Upload Screenshot of the UID</label>
                                                <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-4 hover:bg-gray-700/30 transition text-center cursor-pointer">
                                                    <input type="file" onChange={handleUidFileChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                    {uidPreviewUrl ? (
                                                        <div className="relative">
                                                            <img src={uidPreviewUrl} alt="UID Screenshot Preview" className="max-h-32 mx-auto rounded-md" />
                                                            {!state.currentUser?.uidScreenshotUrl && (
                                                                <span className="text-xs text-orange-500 mt-1 block">Click or drag to change screenshot</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center py-4">
                                                            <UploadIcon className="w-8 h-8 text-gray-400 mb-2" />
                                                            <span className="text-sm text-gray-400">Upload UID Screenshot</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {uidSubmitError && (
                                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm flex items-center space-x-2">
                                                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <span>{uidSubmitError}</span>
                                            </div>
                                        )}

                                        {uidSubmitStatus === 'success' && (
                                            <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg text-sm flex items-center space-x-2">
                                                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <span>✓ Verification request submitted successfully for {selectedExchange}!</span>
                                            </div>
                                        )}

                                        {!isPendingExchangeUid && (
                                            <button 
                                                onClick={handleApplyUidVerification}
                                                disabled={uidSubmitStatus === 'submitting'}
                                                className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg shadow-lg shadow-orange-600/20 transition-all mt-2 disabled:opacity-50"
                                            >
                                                {uidSubmitStatus === 'submitting' ? 'Submitting...' : 'Submit UID for Verification'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {(currentView === 'deposit' || currentView === 'asset_deposit') && (
                <div className="animate-fade-in">
                    <button onClick={handleBack} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        Back
                    </button>
                    {!selectedToken ? (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Select Asset to Deposit</h2>
                            <TokenListNew tokens={availableTokens} onSelect={handleStartDeposit} getEffectiveBalance={getEffectiveBalance} getTokenName={getTokenName} />
                        </div>
                    ) : (
                        renderDepositContent()
                    )}
                </div>
            )}

            {currentView === 'swap' && (
                <div className="animate-fade-in">
                    <button onClick={handleBack} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        Back
                    </button>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Swap Assets</h2>
                        
                        {/* From */}
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-2 border border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-500 dark:text-gray-400 text-sm">From</span>
                                <span className="text-gray-500 dark:text-gray-400 text-sm">Balance: {getEffectiveBalance('USHA').toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 shrink-0">
                                    <TokenIcon token="USHA" className="w-6 h-6" />
                                    <span className="font-bold text-gray-900 dark:text-white">USHA</span>
                                </div>
                                <input 
                                    type="number" 
                                    value={swapAmount} 
                                    onChange={e => setSwapAmount(e.target.value)}
                                    placeholder="0" 
                                    className="w-full bg-transparent text-right text-2xl font-bold text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-gray-600"
                                    step="any"
                                />
                            </div>
                            <div className="flex justify-end mt-2">
                                <button onClick={handleSwapMax} className="text-xs text-orange-500 dark:text-orange-400 font-bold hover:text-orange-600 dark:hover:text-orange-300">MAX</button>
                            </div>
                        </div>

                        {/* Swap Icon */}
                        <div className="flex justify-center -my-3 relative z-10">
                            <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full border-4 border-white dark:border-gray-800 shadow-lg">
                                <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                            </div>
                        </div>

                        {/* To */}
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mt-2 mb-6 border border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-500 dark:text-gray-400 text-sm">To (Estimated)</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <select 
                                    value={swapToToken || ''} 
                                    onChange={e => setSwapToToken(e.target.value as Token)}
                                    className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none font-bold shrink-0 appearance-none"
                                >
                                    <option value="" disabled>Select</option>
                                    {availableTokens.filter(c => c !== 'USHA').map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <input 
                                    type="text" 
                                    value={received > 0 ? received.toLocaleString() : '0'} 
                                    readOnly 
                                    className="w-full bg-transparent text-right text-2xl font-bold text-gray-500 dark:text-gray-400 focus:outline-none"
                                />
                            </div>
                        </div>

                        {swapToToken && (
                            <div className="bg-gray-100 dark:bg-gray-700/30 p-3 rounded-md text-sm space-y-1 mb-6">
                                <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Rate</span><span className="text-gray-900 dark:text-white">1 USHA = {rate.toLocaleString(undefined, { maximumFractionDigits: 6 })} {swapToToken}</span></div>
                                <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Fee ({feePercent}%)</span><span className="text-gray-900 dark:text-white">{fee.toLocaleString()} USHA</span></div>
                            </div>
                        )}

                        {swapMessage && (
                            <div className={`p-3 rounded-lg text-sm mb-4 flex items-center space-x-2 ${swapStatus === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                <span>{swapMessage}</span>
                            </div>
                        )}

                        <button 
                            onClick={handleSwapSubmit}
                            disabled={swapStatus === 'processing'}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                            {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Swap Now'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WithdrawView;
