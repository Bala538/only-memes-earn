
import React, { useState, useEffect, useRef, useContext, useCallback, useMemo } from 'react';
import { Game, MineUpgrade, TapGameData, Transaction } from '../types';
import { AppContext } from '../context/AppContext';
import confetti from 'canvas-confetti';
import { triggerHapticFeedback } from '../utils/telegramUtils';
import TokenIcon from './icons/TokenIcon';
import ExchangeIcon from './icons/ExchangeIcon';
import PickaxeIcon from './icons/PickaxeIcon';
import WalletIcon from './icons/WalletIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import RankingIcon from './icons/RankingIcon';
import UploadIcon from './icons/UploadIcon';
import DownloadIcon from './icons/DownloadIcon';
import HistoryIcon from './icons/HistoryIcon';
import RewardClaimedModal from './RewardClaimedModal';
import DailyCipherSuccessModal from './DailyCipherSuccessModal';
import ComboCardFoundModal from './ComboCardFoundModal';
import DailyComboSuccessModal from './DailyComboSuccessModal';
import MineUpgradeDetailsModal from './MineUpgradeDetailsModal';

interface GamePlayerProps {
    game: Game;
    onBack: () => void;
}

const LEVELS = [
  { name: "Bronze", minScore: 0 }, { name: "Silver", minScore: 5000 },
  { name: "Gold", minScore: 25000 }, { name: "Platinum", minScore: 100000 },
  { name: "Diamond", minScore: 1000000 }, { name: "Epic", minScore: 2000000 },
  { name: "Legendary", minScore: 10000000 }, { name: "Master", minScore: 50000000 },
  { name: "Grandmaster", minScore: 10000000000 },
];
const DEFAULT_COMBO_BONUS = 5000000;
const DEFAULT_CIPHER_BONUS = 1000000;
const DAILY_REWARDS = [500, 1000, 2500, 5000, 15000, 25000, 100000, 500000, 1000000, 5000000];
const DAILY_BOOST_LIMIT = 3;

const MORSE_CODE_MAP: { [key: string]: string } = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..',
  '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----'
};

const charToMorse = (char: string): string => MORSE_CODE_MAP[char.toUpperCase()] || '';

const formatNumber = (num: number): string => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2).replace(/\.00$/, '') + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2).replace(/\.00$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2).replace(/\.00$/, '') + 'K';
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const useCountdown = (targetDate: Date) => {
    const [timeLeft, setTimeLeft] = useState(targetDate.getTime() - new Date().getTime());
    useEffect(() => {
        const interval = setInterval(() => {
            const newTimeLeft = targetDate.getTime() - new Date().getTime();
            if (newTimeLeft <= 0) { clearInterval(interval); setTimeLeft(0); } else { setTimeLeft(newTimeLeft); }
        }, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);
    const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

// Icons
const BackArrowIcon = (p: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
const CalendarIcon = (p: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 12.75h.008v.008H12v-.008zm-3 0h.008v.008H9v-.008zm6 0h.008v.008h-.008v-.008zm-3 3h.008v.008H12v-.008zm-3 0h.008v.008H9v-.008zm6 0h.008v.008h-.008v-.008z" /></svg>;
const QuestionMarkIcon = (p: any) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...p}><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.67-1.34l.04-.022zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" /></svg>;
const StarIcon = (p: any) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...p}><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>;
const BoostIcon = (p: any) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>;
const LightningIcon = (p: any) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...p}><path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" /></svg>;

const DailyStreakModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onClaim: () => void;
    streak: number;
    isClaimedToday: boolean;
}> = ({ isOpen, onClose, onClaim, streak, isClaimedToday }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6 text-gray-900 dark:text-white" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center mb-4">Daily Rewards</h2>
                <div className="grid grid-cols-5 gap-3 mb-6">
                    {DAILY_REWARDS.map((reward, index) => {
                        const day = index + 1;
                        const isClaimed = index < streak;
                        const isCurrent = index === streak && !isClaimedToday;
                        
                        return (
                            <div key={day} className={`p-2 rounded-lg text-center relative ${isClaimed ? 'bg-green-100 dark:bg-green-600/50 border border-green-500' : isCurrent ? 'bg-blue-100 dark:bg-blue-600/50 border border-blue-500 animate-pulse' : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700'}`}>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Day {day}</p>
                                <TokenIcon token="USHA" className="w-5 h-5 mx-auto my-1" />
                                <p className="text-xs font-bold">{formatNumber(reward)}</p>
                                {isClaimed && <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-white absolute top-1 right-1" />}
                            </div>
                        );
                    })}
                </div>
                <button 
                    onClick={onClaim} 
                    disabled={isClaimedToday} 
                    className="w-full py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isClaimedToday ? "Come back tomorrow" : "Claim"}
                </button>
            </div>
        </div>
    );
};


const BottomNav = React.memo(({ activeTab, setActiveTab, token }: { activeTab: any, setActiveTab: (tab: any) => void, token: string }) => {
    const navItems = [
        { id: 'tap', label: 'Tap', icon: <TokenIcon token={token || 'USHA'} className="w-8 h-8"/> },
        { id: 'mine', label: 'Mine', icon: <PickaxeIcon className="w-8 h-8" /> },
        { id: 'wallet', label: 'Wallet', icon: <WalletIcon className="w-8 h-8" /> },
        { id: 'ranking', label: 'Ranking', icon: <RankingIcon className="w-8 h-8" /> },
    ];
    return (
        <div className="bg-white/80 dark:bg-black/20 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700/50 p-1 grid grid-cols-4 gap-1 pb-safe z-20 shrink-0 mx-4 mb-2 rounded-2xl shadow-lg dark:shadow-none">
            {navItems.map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center p-1 rounded-xl transition-colors ${activeTab === item.id ? 'text-blue-600 dark:text-white' : 'text-gray-500 hover:text-blue-500 dark:hover:text-white'}`}>
                    {React.cloneElement(item.icon, { className: 'w-7 h-7' })}
                    <span className="text-[10px] font-bold mt-1">{item.label}</span>
                </button>
            ))}
        </div>
    );
});

export function GamePlayer({ game, onBack }: GamePlayerProps) {
    const { state, updateTapGameData, addBalance, getLeaderboard, triggerAd } = useContext(AppContext);
    const { currentUser, mineUpgrades, dailySchedule } = state;
    type GameTab = 'tap' | 'mine' | 'wallet' | 'ranking';
    const [activeTab, setActiveTab] = useState<GameTab>('tap');
    
    // Fallback for game data in case it's missing or malformed
    const maxEnergy = game?.maxEnergy ?? 5000;
    const rewardToken = game?.rewardToken || 'USHA';
    
    const [gameData, setGameData] = useState<TapGameData>(() => {
        const initial: TapGameData = { 
            score: 0, 
            energy: maxEnergy, 
            remainingLimit: 0, 
            lastUpdated: new Date().toISOString(), 
            history: [], 
            mineLevel: {}, 
            selectedExchange: 'Binance', 
            lastDailyRewardClaim: '', 
            dailyRewardStreak: 0, 
            lastCipherClaim: '', 
            lastComboClaim: '', 
            dailyComboFound: [], 
            dailyBoosts: DAILY_BOOST_LIMIT, 
            lastBoostReset: '' 
        };
        const saved = currentUser?.tapGameData || {};
        // Merge to ensure no fields are missing
        return { ...initial, ...saved, history: saved.history || [] };
    });
    
    const [pph, setPph] = useState(0);
    const [clickEffects, setClickEffects] = useState<{id: number, x: number, y: number, val: number}[]>([]);
    const [isCipherMode, setIsCipherMode] = useState(false);
    const [cipherSolvedIndex, setCipherSolvedIndex] = useState(0);
    const [currentMorseInput, setCurrentMorseInput] = useState('');
    const [isCipherCompleted, setIsCipherCompleted] = useState(false);
    const [showCipherSuccessModal, setShowCipherSuccessModal] = useState(false);
    const [comboCardFound, setComboCardFound] = useState<{ card: MineUpgrade, count: number } | null>(null);
    const [showComboSuccessModal, setShowComboSuccessModal] = useState(false);
    const [leaderboard, setLeaderboard] = useState<{ email: string; balance: number }[]>([]);
    const [isTapping, setIsTapping] = useState(false);
    const [energyError, setEnergyError] = useState(false);
    const [rewardModal, setRewardModal] = useState<{ visible: boolean, amount: number, token: string } | null>(null);
    const [isDailyStreakModalOpen, setIsDailyStreakModalOpen] = useState(false);
    
    // Swap State
    const [swapScoreAmount, setSwapScoreAmount] = useState('');
    const [swapStatus, setSwapStatus] = useState<'idle' | 'processing' | 'success'>('idle');
    const [swapMessage, setSwapMessage] = useState('');

    const [activeCategory, setActiveCategory] = useState('PR&Team');
    const [selectedUpgrade, setSelectedUpgrade] = useState<MineUpgrade | null>(null);

    const gameDataRef = useRef(gameData);
    const lastSyncTime = useRef<number>(0);
    // Initialize ref lazily if needed, or just set it in useEffect
    useEffect(() => {
        if (lastSyncTime.current === 0) lastSyncTime.current = Date.now();
    }, []);
    const pressStartRef = useRef(0);

    const { score, energy, mineLevel, lastDailyRewardClaim, lastCipherClaim, lastComboClaim, dailyComboFound, dailyRewardStreak, dailyBoosts } = gameData;
    const levelIndex = LEVELS.findIndex((l, i) => score >= l.minScore && (i === LEVELS.length - 1 || score < LEVELS[i+1].minScore));
    const currentLevel = LEVELS[levelIndex !== -1 ? levelIndex : 0];
    
    const today = new Date().toISOString().split('T')[0];
    const dailyConfig = dailySchedule[today] || { cipher: 'MEME', combo: [] };
    
    // Use reward from config or default
    const cipherReward = dailyConfig.cipherReward || DEFAULT_CIPHER_BONUS;
    const comboReward = dailyConfig.comboReward || DEFAULT_COMBO_BONUS;

    const lastClaimDate = lastDailyRewardClaim ? new Date(lastDailyRewardClaim) : null;
    const isDailyRewardClaimed = lastClaimDate ? lastClaimDate.toDateString() === new Date().toDateString() : false;
    const isCipherClaimedToday = lastCipherClaim ? new Date(lastCipherClaim).toDateString() === new Date().toDateString() : false;
    const isComboClaimedToday = lastComboClaim ? new Date(lastComboClaim).toDateString() === new Date().toDateString() : false;
    const dailyTimer = useCountdown(useMemo(() => { const d = new Date(); d.setHours(24, 0, 0, 0); return d; }, []));

    useEffect(() => { gameDataRef.current = gameData; }, [gameData]);
    const saveGameData = useCallback(() => updateTapGameData(gameDataRef.current), [updateTapGameData]);

    useEffect(() => {
        let total = 0;
        mineUpgrades.forEach(u => { if ((gameData.mineLevel?.[u.id] || 0) > 0) total += u.baseProfit * (gameData.mineLevel?.[u.id] || 0); });
        setPph(total);
    }, [gameData.mineLevel, mineUpgrades]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = (now - lastSyncTime.current) / 1000;
            setGameData(prev => {
                const profit = (pph / 3600) * elapsed;
                const newEnergy = Math.min(prev.energy + (3 * elapsed), maxEnergy);
                let boosts = prev.dailyBoosts ?? DAILY_BOOST_LIMIT;
                if (prev.lastBoostReset !== today) boosts = DAILY_BOOST_LIMIT;
                return {...prev, score: prev.score + profit, energy: newEnergy, dailyBoosts: boosts, lastBoostReset: today };
            });
            lastSyncTime.current = now;
        }, 1000);
        window.addEventListener('beforeunload', saveGameData);
        return () => { clearInterval(interval); window.removeEventListener('beforeunload', saveGameData); saveGameData(); };
    }, [pph, maxEnergy, saveGameData, today]);

    const handleTap = (e: React.PointerEvent) => {
        if (energy < 1) { 
            setEnergyError(true); 
            triggerHapticFeedback('error');
            setTimeout(() => setEnergyError(false), 300); 
            return; 
        }
        if (navigator.vibrate) navigator.vibrate(10);
        triggerHapticFeedback('light');
        setIsTapping(true); setTimeout(() => setIsTapping(false), 100);
        const rect = e.currentTarget.getBoundingClientRect();
        setClickEffects(p => [...p, { id: Date.now() + Math.random(), x: e.clientX - rect.left, y: e.clientY - rect.top, val: 1 }]);
        setTimeout(() => setClickEffects(p => p.slice(1)), 1000);
        setGameData(p => ({...p, score: p.score + 1, energy: Math.max(0, p.energy - 1)}));
    };

    const handleCipherEnd = (e: React.PointerEvent) => {
        e.preventDefault();
        const duration = Date.now() - pressStartRef.current;
        pressStartRef.current = 0;
        const symbol = duration < 200 ? '.' : '-';
        const input = currentMorseInput + symbol;
        const targetWord = (dailyConfig?.cipher || 'MEME').toUpperCase();
        const targetMorse = charToMorse(targetWord[cipherSolvedIndex] || '');
        
        if (navigator.vibrate) navigator.vibrate(duration < 200 ? 5 : 40);
        triggerHapticFeedback('light');
        
        if (targetMorse === input) {
            setCipherSolvedIndex(i => i + 1);
            setCurrentMorseInput('');
            if (cipherSolvedIndex + 1 >= targetWord.length) {
                setTimeout(() => { setIsCipherCompleted(true); setShowCipherSuccessModal(true); if(navigator.vibrate) navigator.vibrate([100,50,100]); triggerHapticFeedback('success'); confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, zIndex: 9999 }); }, 300);
            }
        } else if (targetMorse.startsWith(input)) {
            setCurrentMorseInput(input);
        } else {
            setCurrentMorseInput(input);
            if(navigator.vibrate) navigator.vibrate([50,50,50]);
            triggerHapticFeedback('error');
            setTimeout(() => { setCurrentMorseInput(''); setCipherSolvedIndex(0); }, 500);
        }
    };

    const handleBuyUpgrade = (upgrade: MineUpgrade) => {
        const lvl = mineLevel[upgrade.id] || 0;
        const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier || 1.15, lvl));
        if (score >= cost) {
            if (upgrade.dependency && (mineLevel[upgrade.dependency.id] || 0) < upgrade.dependency.level) { 
                triggerHapticFeedback('error');
                alert(`Requires ${mineUpgrades.find(u=>u.id===upgrade.dependency!.id)?.name} lvl ${upgrade.dependency.level}`); 
                return; 
            }
            triggerHapticFeedback('success');
            setGameData(p => {
                const combo = p.dailyComboFound || [];
                const found = dailyConfig?.combo.includes(upgrade.id) && !combo.includes(upgrade.id);
                if (found) setComboCardFound({ card: upgrade, count: combo.length + 1 });
                const newTx: Transaction = { id: Date.now(), type: 'Mining', amount: cost.toLocaleString(), date: new Date().toISOString(), isPositive: false };
                return { ...p, score: p.score - cost, mineLevel: { ...p.mineLevel, [upgrade.id]: lvl + 1 }, dailyComboFound: found ? [...combo, upgrade.id] : combo, history: [...(p.history || []), newTx] };
            });
        } else {
            triggerHapticFeedback('error');
        }
    };

    const handleClaimCipher = async () => {
        const newTx: Transaction = { id: Date.now(), type: 'Earned', amount: cipherReward.toLocaleString(), date: new Date().toISOString(), isPositive: true };
        setGameData(p => ({ ...p, score: p.score + cipherReward, lastCipherClaim: new Date().toISOString(), history: [...(p.history || []), newTx] }));
        setShowCipherSuccessModal(false); setIsCipherMode(false); setIsCipherCompleted(false); setCipherSolvedIndex(0); setCurrentMorseInput('');
    };

    const handleSwapScore = () => {
        const amount = parseFloat(swapScoreAmount);
        if (isNaN(amount) || amount <= 0 || amount > score) {
            setSwapMessage('Invalid amount');
            setSwapStatus('idle'); 
            return;
        }
        setSwapStatus('processing');
        setTimeout(() => {
            const newTx: Transaction = { id: Date.now(), type: 'Swap', amount: amount.toLocaleString(), date: new Date().toISOString(), isPositive: false };
            setGameData(p => ({ ...p, score: p.score - amount, history: [...(p.history || []), newTx] }));
            addBalance(amount, rewardToken);
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 },
                zIndex: 9999
            });
            setSwapStatus('success'); 
            setSwapScoreAmount('');
            setSwapMessage('Success!');
            setTimeout(() => {
                setSwapStatus('idle');
                setSwapMessage('');
            }, 2000);
        }, 1000);
    };

    const handleClaimDailyReward = async () => {
        if (isDailyRewardClaimed) return;
        
        // Show Ad
        await triggerAd('interstitial');

        let currentStreak = dailyRewardStreak ?? 0;
        if (lastClaimDate) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastClaimDate.toDateString() !== yesterday.toDateString()) {
                currentStreak = 0;
            }
        } else {
            currentStreak = 0;
        }
        const reward = DAILY_REWARDS[Math.min(currentStreak, DAILY_REWARDS.length - 1)];
        const newTx: Transaction = { id: Date.now(), type: 'Earned', amount: reward.toLocaleString(), date: new Date().toISOString(), isPositive: true };
        setGameData(prev => ({
            ...prev,
            score: prev.score + reward,
            dailyRewardStreak: currentStreak + 1,
            lastDailyRewardClaim: new Date().toISOString(),
            history: [...(prev.history || []), newTx]
        }));
        setRewardModal({ visible: true, amount: reward, token: rewardToken });
        setIsDailyStreakModalOpen(false);
    };
    
    let displayStreak = gameData.dailyRewardStreak ?? 0;
    if (!isDailyRewardClaimed) {
        if (lastClaimDate) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastClaimDate.toDateString() !== yesterday.toDateString()) {
                displayStreak = 0;
            }
        } else {
            displayStreak = 0;
        }
    }

    useEffect(() => { if (activeTab === 'ranking') setLeaderboard(getLeaderboard()); }, [activeTab, getLeaderboard]);

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#4a4e5a] dark:to-[#272a2f] flex flex-col font-sans text-gray-900 dark:text-white touch-manipulation">
            <main className="flex-grow flex flex-col relative overflow-hidden p-4 pt-2">
                {activeTab === 'tap' && (
                    <div className="h-full flex flex-col items-center justify-between animate-fade-in">
                        <div className="w-full flex justify-between items-center">
                            <button onClick={onBack} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"><BackArrowIcon className="w-6 h-6"/></button>
                            <div className="text-center">
                                <span className="font-bold text-sm">{currentLevel.name} &gt;</span>
                                <div className="w-24 h-2 bg-gray-300 dark:bg-gray-700 rounded-full mt-1"><div className="bg-yellow-400 h-full rounded-full" style={{width: `${(levelIndex+1)/LEVELS.length*100}%`}}></div></div>
                            </div>
                            <div className="bg-white/50 dark:bg-gray-800/50 px-3 py-1 rounded-2xl flex items-center gap-2 text-sm shadow-sm dark:shadow-none border border-gray-200 dark:border-transparent">PPH <TokenIcon token={rewardToken} className="w-4 h-4"/> +{formatNumber(pph)}</div>
                        </div>
                        <div className="w-full grid grid-cols-3 gap-2 my-4">
                            <div onClick={() => setIsDailyStreakModalOpen(true)} className={`relative bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg border text-center ${isDailyRewardClaimed ? 'border-green-500/50' : 'border-green-500'} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-sm dark:shadow-none`}>
                                {!isDailyRewardClaimed && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>}
                                <p className="text-xs text-gray-600 dark:text-gray-300">Daily Reward</p><CalendarIcon className="w-6 h-6 mx-auto my-1"/><p className="text-xs text-gray-500">{isDailyRewardClaimed ? 'Claimed' : dailyTimer}</p>
                            </div>
                            <div onClick={() => !isCipherClaimedToday && setIsCipherMode(!isCipherMode)} className={`bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg border text-center border-purple-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-sm dark:shadow-none`}>
                                <p className="text-xs text-gray-600 dark:text-gray-300">Cipher</p><QuestionMarkIcon className="w-6 h-6 mx-auto my-1"/><p className="text-xs text-gray-500">{isCipherClaimedToday ? 'Claimed' : dailyTimer}</p>
                            </div>
                            <div onClick={() => !isComboClaimedToday && setActiveTab('mine')} className={`bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg border text-center border-orange-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-sm dark:shadow-none`}>
                                <p className="text-xs text-gray-600 dark:text-gray-300">Combo</p><StarIcon className="w-6 h-6 mx-auto my-1"/><p className="text-xs text-gray-500">{isComboClaimedToday ? 'Claimed' : dailyTimer}</p>
                            </div>
                        </div>
                        <div className="text-center mb-2 flex flex-col justify-center flex-grow">
                            <div className="flex items-center justify-center gap-2"><TokenIcon token={rewardToken} className="w-12 h-12"/><h1 className="text-5xl font-extrabold">{formatNumber(Math.floor(score))}</h1></div>
                            {(isCipherMode || isCipherCompleted) && !isCipherClaimedToday && (
                                <div className="mt-4 flex items-center justify-center gap-2 bg-white/80 dark:bg-gray-800/80 rounded-xl p-2 max-w-sm mx-auto border border-purple-500 shadow-sm dark:shadow-none">
                                    {(isCipherCompleted ? (dailyConfig.cipher||'').toUpperCase() : (dailyConfig.cipher||'').toUpperCase().substring(0, cipherSolvedIndex)).split('').map((c,i)=><div key={i} className="w-8 h-8 flex items-center justify-center bg-purple-100 dark:bg-purple-600 text-purple-900 dark:text-white rounded font-bold">{c}</div>)}
                                    {!isCipherCompleted && <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"/>}
                                </div>
                            )}
                        </div>
                        <div className="relative w-full flex-grow flex items-center justify-center mb-6" style={{touchAction: 'none'}}>
                            {clickEffects.map(e => <div key={e.id} className="absolute text-5xl font-black text-blue-600 dark:text-white pointer-events-none animate-float-up z-30" style={{left:e.x, top:e.y, transform:'translate(-50%, -50%)'}}>+{e.val}</div>)}
                            <div className={`relative z-10 w-64 h-64 rounded-full cursor-pointer transition-transform duration-100 flex items-center justify-center ${isTapping?'scale-95':'scale-100'} ${isCipherMode?'ring-4 ring-red-500':''}`}
                                onPointerDown={isCipherMode ? (e) => { e.preventDefault(); if(isCipherCompleted)return; pressStartRef.current=Date.now(); } : (e) => { e.preventDefault(); handleTap(e); }}
                                onPointerUp={isCipherMode ? handleCipherEnd : undefined}
                            >
                                {game?.imageUrl ? (
                                    <img src={game.imageUrl} alt="Tap" className="w-full h-full object-cover rounded-full shadow-2xl pointer-events-none"/>
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl flex items-center justify-center">
                                        <TokenIcon token={rewardToken} className="w-32 h-32 text-white opacity-50" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="w-full flex justify-between items-center gap-4">
                            <div className={`flex-grow flex items-center gap-2 p-1 rounded-lg ${energyError?'animate-pulse text-red-500':''}`}>
                                <LightningIcon className="w-6 h-6 text-yellow-500 dark:text-yellow-400"/>
                                <div className="w-full"><div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2"><div className="bg-yellow-500 dark:bg-yellow-400 h-full rounded-full" style={{width: `${(energy/maxEnergy)*100}%`}}></div></div><span className="font-bold text-xs">{Math.floor(energy)}/{maxEnergy}</span></div>
                            </div>
                            <button onClick={() => { if((dailyBoosts||0)>0) setGameData(p=>({...p, energy:maxEnergy, dailyBoosts:(p.dailyBoosts||0)-1})); }} disabled={(dailyBoosts||0)===0} className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-xs disabled:opacity-50 shadow-sm dark:shadow-none border border-gray-200 dark:border-transparent"><BoostIcon className="w-4 h-4"/> Boost ({dailyBoosts})</button>
                        </div>
                    </div>
                )}
                {activeTab === 'mine' && (
                    <div className="h-full flex flex-col text-gray-900 dark:text-white animate-fade-in pb-20">
                        <div className="flex justify-between items-center mb-4">
                             <button onClick={onBack} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"><BackArrowIcon className="w-6 h-6"/></button>
                             <h2 className="text-lg font-bold">Mine & Upgrade</h2>
                             <div className="w-6"></div>
                        </div>
                        <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-4 mb-4 border border-yellow-500/20 shadow-sm dark:shadow-none">
                            <div className="flex justify-between items-center mb-3"><span className="text-sm font-bold">Daily Combo {dailyComboFound?.length}/3</span></div>
                            <div className="flex justify-between gap-2">{[0,1,2].map(i => {
                                const id=dailyConfig?.combo[i]; const found=dailyComboFound?.includes(id); const u=mineUpgrades.find(x=>x.id===id);
                                return <div key={i} className={`flex-1 aspect-[3/4] rounded-xl flex items-center justify-center border-2 ${found?'border-green-500 bg-green-100 dark:bg-green-900/20':'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800'}`}>{found&&u?<div className="text-2xl">{u.icon}</div>:<QuestionMarkIcon className="w-8 h-8 text-gray-400 dark:text-gray-500"/>}</div>
                            })}</div>
                            {dailyComboFound?.length===3 && !isComboClaimedToday && <button onClick={async ()=>{
                                // Show Ad
                                await triggerAd('interstitial');
                                const newTx: Transaction = { id: Date.now(), type: 'Earned', amount: comboReward.toLocaleString(), date: new Date().toISOString(), isPositive: true };
                                setGameData(p=>({...p,score:p.score+comboReward,lastComboClaim:new Date().toISOString(), history: [...(p.history || []), newTx]})); 
                                setShowComboSuccessModal(true);
                                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, zIndex: 9999 });
                            }} className="w-full mt-4 bg-yellow-500 text-black font-bold py-2 rounded-xl">Claim {formatNumber(comboReward)}</button>}
                        </div>
                        <div className="flex overflow-x-auto gap-2 pb-2 mb-2 scrollbar-hide">
                            {['PR&Team', 'Markets', 'Legal', 'Web3', 'Specials'].map(c => <button key={c} onClick={() => setActiveCategory(c)} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeCategory===c?'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white':'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-sm dark:shadow-none'}`}>{c}</button>)}
                        </div>
                        <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-20">
                            {mineUpgrades.filter(u => u.category === activeCategory).map(u => {
                                const lvl = mineLevel[u.id] || 0;
                                const cost = Math.floor(u.baseCost * Math.pow(u.costMultiplier||1.15, lvl));
                                return (
                                    <div key={u.id} onClick={() => setSelectedUpgrade(u)} className={`bg-white dark:bg-gray-800 p-3 rounded-xl border-b-4 shadow-sm dark:shadow-none ${score>=cost?'border-blue-500 dark:border-blue-900 cursor-pointer':'border-red-500 dark:border-red-900 opacity-60'}`}>
                                        <div className="flex gap-2 mb-2">
                                            <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                                {u.icon && (u.icon.startsWith('http') || u.icon.startsWith('https://'))
                                                    ? <img src={u.icon} alt={u.name} className="w-8 h-8 object-contain" />
                                                    : <span className="text-2xl">{u.icon}</span>
                                                }
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold">{u.name}</div>
                                                <div className="text-[10px] text-gray-500 dark:text-gray-400">Lvl {lvl}</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400"><span>Profit</span><span className="text-gray-900 dark:text-white">+{formatNumber(u.baseProfit)}</span></div>
                                        <div className="flex items-center gap-1 font-bold text-sm mt-1"><TokenIcon token={rewardToken} className="w-4 h-4"/>{formatNumber(cost)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {activeTab === 'wallet' && (
                    <div className="h-full flex flex-col p-4 pb-20 overflow-y-auto">
                         <div className="flex justify-between items-center mb-4 shrink-0">
                             <button onClick={onBack} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"><BackArrowIcon className="w-6 h-6"/></button>
                             <h2 className="text-lg font-bold">In-Game Wallet</h2>
                             <div className="w-6"></div>
                        </div>
                        {/* Balance Card */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900 p-6 rounded-2xl border border-blue-500/30 mb-6 text-center relative overflow-hidden shrink-0 shadow-lg dark:shadow-none">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 dark:bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                            <p className="text-blue-100 dark:text-blue-200 text-xs font-bold uppercase tracking-widest">Total Score</p>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <TokenIcon token={rewardToken} className="w-8 h-8"/>
                                <span className="text-4xl font-black text-white">{formatNumber(score)}</span>
                            </div>
                            <p className="text-xs text-blue-200 dark:text-blue-300 mt-1">Convert score to withdrawable tokens</p>
                        </div>

                        {/* Swap Section */}
                        <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 mb-6 shrink-0 shadow-sm dark:shadow-none">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <ExchangeIcon className="w-4 h-4" /> Swap to Main Wallet
                            </h3>
                            
                            {/* From (Score) */}
                            <div className="bg-gray-100 dark:bg-black/40 p-3 rounded-xl mb-2 border border-gray-200 dark:border-gray-600/50">
                                <div className="flex justify-between mb-1">
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">From (Game Score)</span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Avail: {formatNumber(score)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TokenIcon token={rewardToken} className="w-6 h-6" />
                                    <input 
                                        type="number" 
                                        value={swapScoreAmount} 
                                        onChange={e => setSwapScoreAmount(e.target.value)} 
                                        placeholder="0" 
                                        className="bg-transparent w-full text-right font-bold text-gray-900 dark:text-white outline-none"
                                    />
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex justify-center -my-3 relative z-10">
                                <div className="bg-white dark:bg-gray-700 p-1.5 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm dark:shadow-none">
                                    <svg className="w-4 h-4 text-gray-500 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                                </div>
                            </div>

                            {/* To (Wallet) */}
                            <div className="bg-gray-100 dark:bg-black/40 p-3 rounded-xl mt-2 mb-4 border border-gray-200 dark:border-gray-600/50">
                                <div className="flex justify-between mb-1">
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">To (Main Wallet)</span>
                                </div>
                                <div className="flex items-center gap-2 justify-between">
                                    <div className="flex items-center gap-2">
                                        <WalletIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                        <span className="text-sm font-bold">{state.tokenConfigs[rewardToken]?.name || rewardToken}</span>
                                    </div>
                                    <span className="font-bold text-green-600 dark:text-green-400">{swapScoreAmount || '0'}</span>
                                </div>
                            </div>

                            <button 
                                onClick={handleSwapScore} 
                                disabled={swapStatus === 'processing' || !swapScoreAmount || parseFloat(swapScoreAmount) <= 0}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition disabled:opacity-50 disabled:bg-gray-400 dark:disabled:bg-gray-600"
                            >
                                {swapStatus === 'processing' ? 'Swapping...' : 'Swap'}
                            </button>
                             {swapStatus === 'success' && <p className="text-green-600 dark:text-green-400 text-xs text-center mt-2 font-bold animate-pulse">Swap Successful!</p>}
                             {swapMessage && swapStatus !== 'success' && swapStatus !== 'processing' && <p className="text-red-500 dark:text-red-400 text-xs text-center mt-2">{swapMessage}</p>}
                        </div>

                        {/* History List */}
                        <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0 shadow-sm dark:shadow-none">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
                                <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300">Transaction History</h3>
                            </div>
                            <div className="divide-y divide-gray-200 dark:divide-gray-700/50">
                                {(gameData.history || []).length > 0 ? (
                                    (gameData.history || []).slice().reverse().map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${tx.isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                                    {tx.isPositive ? <DownloadIcon className="w-4 h-4" /> : <UploadIcon className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{tx.type}</p>
                                                    <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className={`font-mono font-bold ${tx.isPositive ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                                {tx.isPositive ? '+' : '-'}{tx.amount}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                        <HistoryIcon className="w-12 h-12 mb-3 opacity-20" />
                                        <p className="text-sm">No transactions yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'ranking' && (
                    <div className="h-full p-4 pb-20 overflow-y-auto">
                         <div className="flex justify-between items-center mb-4">
                             <button onClick={onBack} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"><BackArrowIcon className="w-6 h-6"/></button>
                             <h2 className="text-lg font-bold">Global Ranking</h2>
                             <div className="w-6"></div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm dark:shadow-none">
                            {leaderboard.map((u, i) => (
                                <div key={i} className="flex items-center p-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                                    <div className="w-8 text-center font-bold text-gray-500">{i+1}</div>
                                    <div className="flex-grow pl-2"><div className="font-bold text-sm truncate w-32">{u.email.split('@')[0]}</div><div className="text-[10px] text-gray-500">Grandmaster</div></div>
                                    <div className="text-yellow-600 dark:text-yellow-500 font-bold text-sm">{formatNumber(u.balance)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} token={rewardToken} />
            {rewardModal && <RewardClaimedModal isOpen={rewardModal.visible} onClose={() => setRewardModal(null)} reward={rewardModal.amount} token={rewardModal.token} />}
            {showCipherSuccessModal && <DailyCipherSuccessModal isOpen={showCipherSuccessModal} onClaim={handleClaimCipher} reward={cipherReward} token={rewardToken} />}
            {comboCardFound && <ComboCardFoundModal isOpen={!!comboCardFound} onClose={() => setComboCardFound(null)} card={comboCardFound.card} foundCount={comboCardFound.count} />}
            {showComboSuccessModal && <DailyComboSuccessModal isOpen={showComboSuccessModal} onClaim={() => setShowComboSuccessModal(false)} reward={comboReward} token={rewardToken} />}
            
            <DailyStreakModal 
                isOpen={isDailyStreakModalOpen} 
                onClose={() => setIsDailyStreakModalOpen(false)} 
                onClaim={handleClaimDailyReward} 
                streak={displayStreak}
                isClaimedToday={isDailyRewardClaimed}
            />

            {/* Upgrade Details Modal */}
            {selectedUpgrade && (
                <MineUpgradeDetailsModal 
                    isOpen={!!selectedUpgrade}
                    onClose={() => setSelectedUpgrade(null)}
                    onBuy={(u) => { handleBuyUpgrade(u); setSelectedUpgrade(null); }}
                    upgrade={selectedUpgrade}
                    currentLevel={mineLevel[selectedUpgrade.id] || 0}
                    userBalance={score}
                    token={rewardToken}
                />
            )}

            <style>{`
                @keyframes float-up { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-80px); } }
                .animate-float-up { animation: float-up 0.8s ease-out forwards; }
                .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
