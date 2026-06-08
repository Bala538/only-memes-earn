import React from 'react';
import { MineUpgrade } from '../types';
import TokenIcon from './icons/TokenIcon';

interface MineUpgradeDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBuy: (upgrade: MineUpgrade) => void;
    upgrade: MineUpgrade;
    currentLevel: number;
    userBalance: number;
    token: string;
}

const formatNumber = (num: number): string => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2).replace(/\.00$/, '') + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2).replace(/\.00$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2).replace(/\.00$/, '') + 'K';
    return num.toLocaleString();
};

const MineUpgradeDetailsModal: React.FC<MineUpgradeDetailsModalProps> = ({ 
    isOpen, onClose, onBuy, upgrade, currentLevel, userBalance, token 
}) => {
    if (!isOpen) return null;

    const calculateCost = (level: number) => {
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier ?? 1.15, level));
    };

    const nextLevelCost = calculateCost(currentLevel);
    const canAfford = userBalance >= nextLevelCost;
    
    // Generate progression table data (Next 10 levels)
    const progression = [];
    for (let i = 1; i <= 10; i++) {
        const lvl = currentLevel + i;
        const cost = calculateCost(currentLevel + i - 1);
        const profit = upgrade.baseProfit * lvl; // Total PPH for that level
        progression.push({ level: lvl, cost, profit });
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-gray-200 dark:border-gray-700 shadow-2xl transform transition-transform" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-6 relative text-center border-b border-gray-200 dark:border-gray-800">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 rounded-full p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                    
                    <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl flex items-center justify-center shadow-inner border border-gray-200 dark:border-gray-700">
                        {upgrade.icon && (upgrade.icon.startsWith('http') || upgrade.icon.startsWith('https://'))
                            ? <img src={upgrade.icon} alt={upgrade.name} className="w-20 h-20 object-contain" />
                            : <span className="text-6xl">{upgrade.icon}</span>
                        }
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{upgrade.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 px-4 line-clamp-2">{upgrade.description || "Increase your profit per hour by upgrading this card."}</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Profit / Hour</p>
                            <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500 font-bold">
                                <span>+{formatNumber(upgrade.baseProfit * (currentLevel + 1))}</span>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Current Level</p>
                            <div className="text-gray-900 dark:text-white font-bold">{currentLevel}</div>
                        </div>
                    </div>

                    {/* Level Progression Table */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Level Progression</h3>
                        <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 sticky top-0">
                                    <tr>
                                        <th className="p-2 pl-4">Lvl</th>
                                        <th className="p-2">Cost</th>
                                        <th className="p-2 text-right pr-4">Total PPH</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900/30">
                                    {progression.map((row) => (
                                        <tr key={row.level} className={row.level === currentLevel + 1 ? "bg-purple-100 dark:bg-purple-900/20" : ""}>
                                            <td className="p-2 pl-4 font-mono text-gray-500">{row.level}</td>
                                            <td className="p-2">
                                                <div className="flex items-center gap-1">
                                                    <TokenIcon token={token} className="w-3 h-3" />
                                                    <span className={row.level === currentLevel + 1 ? "text-gray-900 dark:text-white font-bold" : "text-gray-500 dark:text-gray-400"}>
                                                        {formatNumber(row.cost)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-2 text-right pr-4 text-yellow-600 dark:text-yellow-500">+{formatNumber(row.profit)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div className="pt-2">
                        <div className="flex justify-between items-center text-sm mb-3">
                            <span className="text-gray-500 dark:text-gray-400">Upgrade Cost:</span>
                            <div className="flex items-center gap-1 font-bold text-gray-900 dark:text-white">
                                <TokenIcon token={token} className="w-5 h-5" />
                                <span className={canAfford ? "text-gray-900 dark:text-white" : "text-red-500"}>{formatNumber(nextLevelCost)}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => onBuy(upgrade)}
                            disabled={!canAfford}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98] ${
                                canAfford 
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-blue-500/20' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {canAfford ? "Go ahead" : "Insufficient Funds"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MineUpgradeDetailsModal;