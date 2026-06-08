import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import MarketDetailView from './MarketDetailView';
import { formatPrice, formatNumber } from '../utils/format';

const MarketsView: React.FC = () => {
    const { state, executeTrade, cancelOrder } = useContext(AppContext);
    const [view, setView] = useState<'list' | 'trade' | 'chart'>('list');
    const [selectedPair, setSelectedPair] = useState<string | null>(null);
    const [amount, setAmount] = useState('');
    const [priceInput, setPriceInput] = useState('');
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
    const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
    const [sliderValue, setSliderValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'favorites' | 'spot' | 'futures'>('spot');
    const [bottomTab, setBottomTab] = useState<'openOrders' | 'positions'>('openOrders');

    const market = (state.markets || []).find(m => `${m.base}/${m.quote}` === selectedPair);

    // Filter markets based on available tokens
    const filteredMarkets = (state.markets || []).filter(m => state.availableTokens.includes(m.base));

    // Update price input when market changes or switches to Limit
    useEffect(() => {
        if (market) {
            let pStr = market.price.toFixed(20).replace(/\.?0+$/, "");
            if (pStr === "0") pStr = "0.00000001";
            setPriceInput(pStr);
        }
    }, [market]);

    const handlePairClick = (pair: string) => {
        setSelectedPair(pair);
        setView('chart');
    };

    const handleBack = () => {
        if (view === 'trade') {
            setView('chart');
        } else {
            setView('list');
            setSelectedPair(null);
            setAmount('');
            setError('');
            setPriceInput('');
        }
    };

    const handleChartBack = () => {
        setView('list');
        setSelectedPair(null);
    };

    const handleTradeClick = (type: 'buy' | 'sell') => {
        setTradeType(type);
        setView('trade');
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setSliderValue(val);
        
        if (!market || !state.currentUser) return;

        const balanceToken = tradeType === 'buy' ? market.quote : market.base;
        const balance = state.currentUser.balance[balanceToken] || 0;
        const currentPrice = parseFloat(priceInput) || market.price;

        if (tradeType === 'buy') {
            // Calculate amount of Base token we can buy with (Balance * val%)
            const spendAmount = balance * (val / 100);
            const buyAmount = currentPrice > 0 ? spendAmount / currentPrice : 0;
            setAmount(buyAmount.toFixed(20).replace(/\.?0+$/, "") || "0");
        } else {
            // Calculate amount of Base token to sell (Balance * val%)
            const sellAmount = balance * (val / 100);
            setAmount(sellAmount.toFixed(20).replace(/\.?0+$/, "") || "0");
        }
    };

    const handleTrade = async () => {
        if (!market || !amount) return;
        setLoading(true);
        setError('');
        try {
            const tradePrice = orderType === 'limit' ? parseFloat(priceInput) : market.price;
            const tradeAmount = parseFloat(amount);
            
            if (isNaN(tradeAmount) || tradeAmount <= 0) throw new Error("Invalid amount");
            if (isNaN(tradePrice) || tradePrice <= 0) throw new Error("Invalid price");

            await executeTrade(selectedPair!, tradeType, orderType, tradeAmount, tradePrice);
            setAmount('');
            setSliderValue(0);
            alert('Order placed successfully!');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const renderOrderBook = () => {
        if (!market) return null;
        
        // Aggregate orders by price for display
        const aggregateOrders = (orders: any[]) => {
            const aggregated: { [price: number]: number } = {};
            orders.forEach(o => {
                aggregated[o.price] = (aggregated[o.price] || 0) + o.amount;
            });
            return Object.entries(aggregated).map(([price, amount]) => ({
                price: parseFloat(price),
                amount: amount as number
            }));
        };

        const sellOrders = aggregateOrders(market.asks || []).sort((a, b) => a.price - b.price);
        const buyOrders = aggregateOrders(market.bids || []).sort((a, b) => b.price - a.price);

        return (
            <div className="text-xs font-mono">
                <div className="grid grid-cols-2 text-gray-500 dark:text-gray-400 mb-1 px-1 text-[10px]">
                    <span>Price</span>
                    <span className="text-right">Amount</span>
                </div>
                
                {/* Sell Orders */}
                <div className="space-y-1 mb-2">
                    {sellOrders.slice(0, 6).reverse().map((o, i) => (
                        <div key={`sell-${i}`} className="grid grid-cols-2 text-red-500 dark:text-[#f6465d] relative">
                            <div className="absolute right-0 top-0 bottom-0 bg-red-500/10 dark:bg-[#f6465d]/10" style={{ width: `${Math.random() * 50}%` }}></div>
                            <span className="relative z-10">{formatPrice(o.price)}</span>
                            <span className="relative z-10 text-gray-600 dark:text-gray-300 text-right">{formatNumber(o.amount)}</span>
                        </div>
                    ))}
                </div>

                {/* Current Price */}
                <div className={`text-lg font-bold text-center my-2 ${market.change24h >= 0 ? 'text-green-500 dark:text-[#2ebd85]' : 'text-red-500 dark:text-[#f6465d]'}`}>
                    {formatPrice(market.price)}
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-normal">≈ {formatPrice(market.price)} {market.quote}</div>
                </div>

                {/* Buy Orders */}
                <div className="space-y-1">
                    {buyOrders.slice(0, 6).map((o, i) => (
                        <div key={`buy-${i}`} className="grid grid-cols-2 text-green-600 dark:text-[#2ebd85] relative">
                            <div className="absolute right-0 top-0 bottom-0 bg-green-500/10 dark:bg-[#2ebd85]/10" style={{ width: `${Math.random() * 50}%` }}></div>
                            <span className="relative z-10">{formatPrice(o.price)}</span>
                            <span className="relative z-10 text-gray-600 dark:text-gray-300 text-right">{formatNumber(o.amount)}</span>
                        </div>
                    ))}
                </div>
                
                {/* Order Book Options */}
                <div className="flex justify-end mt-2 text-gray-400">
                    <span className="bg-gray-100 dark:bg-[#161B22] px-2 py-1 rounded text-[10px] border border-gray-200 dark:border-gray-700">0.0{'{8}'}1</span>
                </div>
            </div>
        );
    };

    if (view === 'list') {
        if (loading) {
            return (
                <div className="pt-20 pb-24 px-4 max-w-screen-md mx-auto min-h-screen bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white flex items-center justify-center transition-colors duration-300">
                    <p>Loading markets...</p>
                </div>
            );
        }
        return (
            <div className="pt-20 pb-24 px-4 max-w-screen-md mx-auto min-h-screen bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white transition-colors duration-300">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Markets</h1>
                    <div className="flex space-x-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        <button onClick={() => setActiveTab('favorites')} className={activeTab === 'favorites' ? 'text-gray-900 dark:text-white border-b-2 border-yellow-500 pb-1' : 'hover:text-gray-700 dark:hover:text-gray-300'}>Favorites</button>
                        <button onClick={() => setActiveTab('spot')} className={activeTab === 'spot' ? 'text-gray-900 dark:text-white border-b-2 border-yellow-500 pb-1' : 'hover:text-gray-700 dark:hover:text-gray-300'}>Spot</button>
                        <button onClick={() => setActiveTab('futures')} className={activeTab === 'futures' ? 'text-gray-900 dark:text-white border-b-2 border-yellow-500 pb-1' : 'hover:text-gray-700 dark:hover:text-gray-300'}>Futures</button>
                    </div>
                </div>

                {/* List Header */}
                <div className="grid grid-cols-3 text-xs text-gray-500 dark:text-gray-400 mb-2 px-2 uppercase tracking-wider">
                    <div className="text-left">Name / Vol</div>
                    <div className="text-center">Last Price</div>
                    <div className="text-right">Change</div>
                </div>

                {/* List Items */}
                <div className="space-y-1">
                    {filteredMarkets.map((m, i) => (
                        <div 
                            key={m.id || i} 
                            onClick={() => handlePairClick(`${m.base}/${m.quote}`)}
                            className="grid grid-cols-3 items-center py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#161B22] rounded-lg cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800/50"
                        >
                            <div className="text-left">
                                <div className="font-bold text-sm text-gray-900 dark:text-white">{m.base}<span className="text-gray-500 text-xs">/{m.quote}</span></div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Vol {formatNumber(m.volume || 0)}</div>
                            </div>
                                                        <div className="text-center font-medium text-sm text-gray-900 dark:text-white">
                                {formatPrice(m.price)}
                            </div>
                            <div className="text-right">
                                <span className={`inline-block px-3 py-1.5 rounded text-xs font-bold w-20 text-center ${m.change24h >= 0 ? 'bg-green-100 text-green-700 dark:bg-[#1e3a2a] dark:text-[#2ebd85]' : 'bg-red-100 text-red-700 dark:bg-[#3a1e1e] dark:text-[#f6465d]'}`}>
                                    {m.change24h >= 0 ? '+' : ''}{m.change24h}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (view === 'chart' && market) {
        return <MarketDetailView market={market} onBack={handleChartBack} onTrade={handleTradeClick} />;
    }

    // Trade View
    return (
        <div className="pt-20 pb-24 px-2 max-w-screen-md mx-auto min-h-screen bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white transition-colors duration-300">
            {/* Top Navigation */}
            <div className="flex items-center justify-between mb-4 px-2">
                <button onClick={handleBack} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex space-x-6 font-bold text-sm">
                    <span className="text-gray-900 dark:text-white border-b-2 border-yellow-500 pb-1">Spot</span>
                    <span className="text-gray-500 dark:text-gray-400">Futures</span>
                    <span className="text-gray-500 dark:text-gray-400">P2P</span>
                </div>
                <div className="w-6"></div> {/* Spacer */}
            </div>

            {market ? (
                <>
                    {/* Pair Header */}
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center space-x-2">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{state.tokenConfigs[market.base]?.name || market.base}/{state.tokenConfigs[market.quote]?.name || market.quote}</h2>
                            <span className={`text-xs font-bold ${market.change24h >= 0 ? 'text-green-600 dark:text-[#2ebd85]' : 'text-red-600 dark:text-[#f6465d]'}`}>
                                {market.change24h >= 0 ? '+' : ''}{market.change24h}%
                            </span>
                            <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] px-1 py-0.5 rounded border border-gray-200 dark:border-gray-700">200X</span>
                        </div>
                        <div className="flex space-x-4 text-gray-500 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                        </div>
                    </div>

                    {/* Main Trading Layout */}
                    <div className="flex space-x-4 mb-6">
                        {/* Left Column: Form */}
                        <div className="w-7/12 space-y-4">
                            {/* Buy/Sell Toggles */}
                            <div className="flex rounded-md overflow-hidden bg-gray-100 dark:bg-[#161B22]">
                                <button 
                                    onClick={() => setTradeType('buy')}
                                    className={`flex-1 py-2 font-bold text-sm transition-all ${tradeType === 'buy' ? 'bg-[#2ebd85] text-white' : 'bg-transparent dark:bg-[#161B22] text-gray-500 dark:text-gray-400'}`}
                                >
                                    Buy
                                </button>
                                <button 
                                    onClick={() => setTradeType('sell')}
                                    className={`flex-1 py-2 font-bold text-sm transition-all ${tradeType === 'sell' ? 'bg-[#f6465d] text-white' : 'bg-transparent dark:bg-[#161B22] text-gray-500 dark:text-gray-400'}`}
                                >
                                    Sell
                                </button>
                            </div>

                            {/* Order Type */}
                            <div className="relative">
                                <select 
                                    value={orderType}
                                    onChange={(e) => setOrderType(e.target.value as 'limit' | 'market')}
                                    className="w-full bg-gray-50 dark:bg-[#161B22] text-gray-900 dark:text-white text-sm py-2 px-3 rounded border border-gray-200 dark:border-gray-700 appearance-none focus:outline-none"
                                >
                                    <option value="limit">Limit</option>
                                    <option value="market">Market</option>
                                    <option value="stop_limit">Stop Limit</option>
                                </select>
                                <div className="absolute right-3 top-3 pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>

                            {/* Price Input */}
                            <div className="flex items-center bg-gray-50 dark:bg-[#161B22] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                                <button className="px-3 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => setPriceInput((parseFloat(priceInput || '0') * 0.99).toFixed(20).replace(/\.?0+$/, "") || "0")}>-</button>
                                <input 
                                    type="number" 
                                    value={priceInput}
                                    onChange={(e) => setPriceInput(e.target.value)}
                                    className="w-full bg-transparent text-center text-gray-900 dark:text-white text-sm py-2 focus:outline-none"
                                    placeholder="Price"
                                />
                                <button className="px-3 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => setPriceInput((parseFloat(priceInput || '0') * 1.01).toFixed(20).replace(/\.?0+$/, "") || "0")}>+</button>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">≈ {formatPrice(parseFloat(priceInput || '0'))} {market.quote}</div>

                            {/* Quantity Input */}
                            <div className="flex items-center bg-gray-50 dark:bg-[#161B22] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                                <button className="px-3 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => setAmount((parseFloat(amount || '0') * 0.9).toFixed(20).replace(/\.?0+$/, "") || "0")}>-</button>
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-transparent text-center text-gray-900 dark:text-white text-sm py-2 focus:outline-none"
                                    placeholder="Amount"
                                />
                                <button className="px-3 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => setAmount((parseFloat(amount || '0') * 1.1).toFixed(20).replace(/\.?0+$/, "") || "0")}>+</button>
                            </div>

                            {/* Slider */}
                            <div className="px-1">
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    step="25"
                                    value={sliderValue} 
                                    onChange={handleSliderChange}
                                    className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gray-400"
                                />
                                <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                    <span>0%</span>
                                    <span>25%</span>
                                    <span>50%</span>
                                    <span>75%</span>
                                    <span>100%</span>
                                </div>
                            </div>

                            {/* Total Input */}
                            <div className="bg-gray-50 dark:bg-[#161B22] border border-gray-200 dark:border-gray-700 rounded px-3 py-2 flex flex-col justify-center">
                                <div className="flex justify-between items-center w-full">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Total({market.quote})</span>
                                    <span className="text-sm text-gray-900 dark:text-white font-mono">
                                        {amount && priceInput ? formatNumber(parseFloat(amount) * parseFloat(priceInput)) : '0.00'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center w-full mt-1">
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Total(USH)</span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                                        ≈ {amount && priceInput ? formatPrice(parseFloat(amount) * parseFloat(priceInput) * (market.quote === 'USHA' ? state.ushaPrice : 1)) : '0.00'}
                                    </span>
                                </div>
                            </div>

                            {/* TP/SL Checkbox */}
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="tpsl" className="rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-[#161B22] text-blue-500 focus:ring-0" />
                                <label htmlFor="tpsl" className="text-xs text-gray-500 dark:text-gray-400">TP/SL</label>
                            </div>

                            {/* Available Balance */}
                            <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400">
                                <span>Avail.</span>
                                <div className="flex items-center space-x-1">
                                    <span className="text-gray-900 dark:text-white font-mono">
                                        {formatNumber(state.currentUser?.balance[tradeType === 'buy' ? market.quote : market.base] || 0)} {tradeType === 'buy' ? market.quote : market.base}
                                    </span>
                                    <button className="bg-blue-600 rounded-full p-0.5 text-white">
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Action Button */}
                            {error && (
                                <div className="mb-2 p-2 bg-red-50 dark:bg-[#3a1e1e] border border-red-200 dark:border-[#f6465d]/20 rounded text-red-600 dark:text-[#f6465d] text-xs">
                                    {error}
                                </div>
                            )}
                            <button 
                                onClick={handleTrade}
                                disabled={loading}
                                className={`w-full py-3 rounded font-bold text-white text-lg shadow-lg transition-all ${tradeType === 'buy' ? 'bg-[#2ebd85] hover:bg-[#2ebd85]/90' : 'bg-[#f6465d] hover:bg-[#f6465d]/90'}`}
                            >
                                {loading ? 'Processing...' : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${state.tokenConfigs[market.base]?.name || market.base}`}
                            </button>
                        </div>

                        {/* Right Column: Order Book */}
                        <div className="w-5/12">
                            <div className="flex space-x-2 mb-2 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                <button 
                                    className="flex-1 pb-1 border-b-2 text-gray-900 dark:text-white border-yellow-500"
                                >
                                    Order Book
                                </button>
                            </div>
                            {renderOrderBook()}
                        </div>
                    </div>

                    {/* Bottom Section: Open Orders */}
                    <div className="mt-4">
                        <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-800 pb-2 mb-4">
                            <button 
                                onClick={() => setBottomTab('openOrders')}
                                className={`text-sm font-bold pb-2 -mb-2.5 border-b-2 transition-colors ${bottomTab === 'openOrders' ? 'text-gray-900 dark:text-white border-yellow-500' : 'text-gray-500 dark:text-gray-400 border-transparent'}`}
                            >
                                Open Orders({state.currentUser?.openOrders?.length || 0})
                            </button>
                            <button 
                                onClick={() => setBottomTab('positions')}
                                className={`text-sm font-bold pb-2 -mb-2.5 border-b-2 transition-colors ${bottomTab === 'positions' ? 'text-gray-900 dark:text-white border-yellow-500' : 'text-gray-500 dark:text-gray-400 border-transparent'}`}
                            >
                                Positions({state.currentUser?.positions?.length || 0})
                            </button>
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-4">
                            <input type="checkbox" id="hidePairs" className="rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-[#161B22] text-gray-500 focus:ring-0" />
                            <label htmlFor="hidePairs" className="text-xs text-gray-500 dark:text-gray-400">Hide other pairs</label>
                        </div>

                        {bottomTab === 'openOrders' && (
                            <div>
                                {state.currentUser?.openOrders && state.currentUser.openOrders.length > 0 ? (
                                    <div className="space-y-2">
                                        {state.currentUser.openOrders.map(order => (
                                            <div key={order.id} className="bg-gray-50 dark:bg-[#161B22] p-3 rounded-lg text-xs border border-gray-100 dark:border-transparent">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <span className={`font-bold ${order.type === 'buy' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>{order.type.toUpperCase()}</span>
                                                        <span className="ml-2 font-bold text-gray-900 dark:text-white">{order.pair}</span>
                                                    </div>
                                                    <button onClick={() => cancelOrder(order.id)} className="text-red-500 hover:underline">Cancel</button>
                                                </div>
                                                <div className="flex justify-between mt-2 text-gray-500 dark:text-gray-400">
                                                    <span>Amount: {order.amount}</span>
                                                    <span>Price: {order.price}</span>
                                                    <span>Total: {formatNumber(order.amount * order.price)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm bg-gray-50 dark:bg-[#161B22] rounded-lg border border-gray-100 dark:border-transparent">
                                        <div className="mb-2">No open orders</div>
                                        <p className="text-xs text-gray-400 dark:text-gray-600">Your active orders will appear here</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {bottomTab === 'positions' && (
                             <div className="bg-gray-50 dark:bg-[#161B22] p-3 rounded-lg text-xs border border-gray-100 dark:border-transparent">
                                <div className="grid grid-cols-3 text-gray-500 dark:text-gray-400 mb-2">
                                    <span>Asset</span>
                                    <span className="text-right">Total Balance</span>
                                    <span className="text-right">Available</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-3 items-center border-b border-gray-200 dark:border-gray-800 pb-2">
                                        <span className="font-bold text-gray-900 dark:text-white">{market.base}</span>
                                        <span className="text-right text-gray-600 dark:text-gray-300">{formatNumber(state.currentUser?.balance[market.base] || 0)}</span>
                                        <span className="text-right text-gray-600 dark:text-gray-300">{formatNumber(state.currentUser?.balance[market.base] || 0)}</span>
                                    </div>
                                    <div className="grid grid-cols-3 items-center">
                                        <span className="font-bold text-gray-900 dark:text-white">{market.quote}</span>
                                        <span className="text-right text-gray-600 dark:text-gray-300">{formatNumber(state.currentUser?.balance[market.quote] || 0)}</span>
                                        <span className="text-right text-gray-600 dark:text-gray-300">{formatNumber(state.currentUser?.balance[market.quote] || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                    Market not found
                </div>
            )}
        </div>
    );
};

export default MarketsView;
