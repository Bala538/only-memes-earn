import React, { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { MarketPair } from '../../types';

const MarketManager: React.FC = () => {
    const { state, addMarket, updateMarket, removeMarket } = useContext(AppContext);
    const [editingMarket, setEditingMarket] = useState<MarketPair | null>(null);
    const [base, setBase] = useState('');
    const [quote, setQuote] = useState('');
    const [price, setPrice] = useState('');
    const [change24h, setChange24h] = useState('');
    const [volume, setVolume] = useState('');

    const handleEdit = (market: MarketPair) => {
        setEditingMarket(market);
        setBase(market.base);
        setQuote(market.quote);
        setPrice(market.price.toString());
        setChange24h(market.change24h.toString());
        setVolume(market.volume?.toString() || '0');
    };

    const handleCancel = () => {
        setEditingMarket(null);
        setBase('');
        setQuote('');
        setPrice('');
        setChange24h('');
        setVolume('');
    };

    const handleSave = async () => {
        if (!base || !quote || !price) return;
        
        const marketData: MarketPair = {
            id: editingMarket ? editingMarket.id : `${base}-${quote}`,
            base,
            quote,
            price: parseFloat(price),
            change24h: parseFloat(change24h) || 0,
            volume: parseFloat(volume) || 0,
            candles: editingMarket?.candles || [],
            bids: editingMarket?.bids || [],
            asks: editingMarket?.asks || [],
            trades: editingMarket?.trades || []
        };

        try {
            if (editingMarket) {
                await updateMarket(marketData);
            } else {
                await addMarket(marketData);
            }
            handleCancel();
        } catch (e) {
            console.error(e);
            alert('Failed to save market');
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-[#0D1117] min-h-screen text-gray-900 dark:text-white">
            <h2 className="text-2xl font-bold mb-6">Market Manager</h2>

            <div className="bg-gray-50 dark:bg-[#161B22] p-6 rounded-xl border border-gray-200 dark:border-gray-700 mb-8">
                <h3 className="text-lg font-bold mb-4">{editingMarket ? 'Edit Market' : 'Add New Market'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Base Asset (e.g. BabyDoge)</label>
                        <input 
                            type="text" 
                            value={base} 
                            onChange={e => setBase(e.target.value)} 
                            className="w-full bg-white dark:bg-[#0D1117] border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white"
                            disabled={!!editingMarket}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Quote Asset (e.g. USHA)</label>
                        <input 
                            type="text" 
                            value={quote} 
                            onChange={e => setQuote(e.target.value)} 
                            className="w-full bg-white dark:bg-[#0D1117] border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white"
                            disabled={!!editingMarket}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Price</label>
                        <input 
                            type="number" 
                            value={price} 
                            onChange={e => setPrice(e.target.value)} 
                            className="w-full bg-white dark:bg-[#0D1117] border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white"
                            step="any"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">24h Change (%)</label>
                        <input 
                            type="number" 
                            value={change24h} 
                            onChange={e => setChange24h(e.target.value)} 
                            className="w-full bg-white dark:bg-[#0D1117] border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white"
                            step="any"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Volume</label>
                        <input 
                            type="number" 
                            value={volume} 
                            onChange={e => setVolume(e.target.value)} 
                            className="w-full bg-white dark:bg-[#0D1117] border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white"
                            step="any"
                        />
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button onClick={handleSave} className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 font-bold text-white">
                        {editingMarket ? 'Update' : 'Add Market'}
                    </button>
                    {editingMarket && (
                        <button onClick={handleCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 font-bold text-gray-900 dark:text-white">
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {(state.markets || []).map(market => (
                    <div key={market.id} className="bg-gray-50 dark:bg-[#161B22] p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-lg">{state.tokenConfigs[market.base]?.name || market.base}/{state.tokenConfigs[market.quote]?.name || market.quote}</h4>
                            <p className="text-gray-500 dark:text-gray-400">Price: {market.price} | 24h: {market.change24h}%</p>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => handleEdit(market)} className="p-2 bg-blue-600/20 text-blue-500 rounded hover:bg-blue-600/30">Edit</button>
                            <button onClick={() => removeMarket(market.id)} className="p-2 bg-red-600/20 text-red-500 rounded hover:bg-red-600/30">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MarketManager;
