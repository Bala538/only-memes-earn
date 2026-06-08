import React, { useState, useMemo, useRef, useEffect, useContext } from 'react';
import { MarketPair } from '../types';
import { createChart, ColorType, ISeriesApi, LineSeries, CandlestickSeries } from 'lightweight-charts';
import { formatPrice, formatNumber } from '../utils/format';
import { AppContext } from '../context/AppContext';

interface MarketDetailViewProps {
    market: MarketPair;
    onBack: () => void;
    onTrade: (type: 'buy' | 'sell') => void;
}

const MAIN_TIMEFRAMES = ['Line', '1M', '3M', '5M', '10M', '15M'];
const MORE_TIMEFRAMES = ['30M', '1H', '2H', '4H', '6H', '8H', '12H', '1D', '5D', 'Month'];

const getIntervalMs = (tf: string) => {
    if (tf === 'Line') return 60 * 1000;
    if (tf.endsWith('M') && tf !== 'Month') return parseInt(tf) * 60 * 1000;
    if (tf.endsWith('H')) return parseInt(tf) * 60 * 60 * 1000;
    if (tf.endsWith('D')) return parseInt(tf) * 24 * 60 * 60 * 1000;
    if (tf === 'Month') return 30 * 24 * 60 * 60 * 1000;
    return 60 * 1000;
};

const MarketDetailView: React.FC<MarketDetailViewProps> = ({ market, onBack, onTrade }) => {
    const { state } = useContext(AppContext);
    const [timeframe, setTimeframe] = useState('15M');
    const [showMore, setShowMore] = useState(false);
    
    const moreButtonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);

    const candles = useMemo(() => {
        if (!market.candles || market.candles.length === 0) return [];
        
        const intervalMs = getIntervalMs(timeframe);
        const aggregated: any[] = [];
        let currentCandle: any = null;
        
        // Sort candles by time to ensure strictly increasing timestamps
        const sortedCandles = [...market.candles].sort((a: any, b: any) => a.time - b.time);
        
        sortedCandles.forEach((c: any) => {
            const periodStart = Math.floor(c.time / intervalMs) * intervalMs;
            
            if (!currentCandle || currentCandle.time !== periodStart) {
                if (currentCandle) aggregated.push(currentCandle);
                currentCandle = {
                    time: periodStart,
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close,
                    volume: c.volume || 0
                };
            } else {
                currentCandle.high = Math.max(currentCandle.high, c.high);
                currentCandle.low = Math.min(currentCandle.low, c.low);
                currentCandle.close = c.close;
                currentCandle.volume += (c.volume || 0);
            }
        });
        if (currentCandle) aggregated.push(currentCandle);

        // Remove duplicates if any (shouldn't happen with sorted and aggregated data, but just in case)
        const uniqueAggregated = aggregated.filter((v, i, a) => a.findIndex(t => (t.time === v.time)) === i);

        return uniqueAggregated.map((d: any) => {
            const open = d.open;
            const high = d.high;
            const low = d.low;
            const close = d.close;
            const volume = d.volume || 0;
            
            return {
                time: (d.time / 1000) as any, // Timestamp in seconds for lightweight-charts
                open, high, low, close, value: close, volume
            };
        });
    }, [market.candles, timeframe]);

    // Order book removed from view

    const recentTrades = useMemo(() => {
        if (!market.trades) return [];
        return market.trades.map((t: any) => ({
            id: t.id,
            time: new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            price: t.price,
            amount: t.amount,
            type: t.type
        })).reverse();
    }, [market.trades]);
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
                moreButtonRef.current && !moreButtonRef.current.contains(event.target as Node)) {
                setShowMore(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Initialize Chart and Update Data
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const isDark = state.theme === 'dark';

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: isDark ? '#d1d5db' : '#374151',
            },
            grid: {
                vertLines: { color: isDark ? '#1f2937' : '#e5e7eb' },
                horzLines: { color: isDark ? '#1f2937' : '#e5e7eb' },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
        });

        chartRef.current = chart;

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight,
                });
            }
        };

        window.addEventListener('resize', handleResize);

        let currentSeries: ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | null = null;

        if (timeframe === 'Line') {
            currentSeries = chart.addSeries(LineSeries, {
                color: '#0ECB81',
                lineWidth: 2,
            });
            currentSeries.setData(candles);
        } else {
            currentSeries = chart.addSeries(CandlestickSeries, {
                upColor: '#0ECB81',
                downColor: '#f6465d',
                borderVisible: false,
                wickUpColor: '#0ECB81',
                wickDownColor: '#f6465d',
            });
            currentSeries.setData(candles);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [candles, timeframe, state.theme]);

    // Calculate Stats
    const candleHigh = candles.length > 0 ? Math.max(...candles.slice(-24).map(c => c.high)) : market.price * 1.05;
    const candleLow = candles.length > 0 ? Math.min(...candles.slice(-24).map(c => c.low)) : market.price * 0.95;
    
    const high24h = formatPrice(candleHigh);
    const low24h = formatPrice(candleLow);

    const volBase = formatNumber(market.volume || 0);
    const volQuote = formatNumber((market.volume || 0) * market.price);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white transition-colors duration-300">
            {/* Header */}
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button onClick={onBack} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-lg font-bold">{state.tokenConfigs[market.base]?.name || market.base}/{state.tokenConfigs[market.quote]?.name || market.quote}</h1>
                    </div>
                </div>
                <div className="flex justify-between items-start mt-2">
                    <div>
                        <div className={`text-3xl font-bold ${market.change24h >= 0 ? 'text-green-600 dark:text-[#0ECB81]' : 'text-red-600 dark:text-[#f6465d]'}`}>
                            {formatPrice(market.price)}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">≈ {formatPrice(market.price)}</span>
                            <span className={`text-sm font-medium ${market.change24h >= 0 ? 'text-green-600 dark:text-[#0ECB81]' : 'text-red-600 dark:text-[#f6465d]'}`}>
                                {market.change24h >= 0 ? '+' : ''}{market.change24h}%
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-right">
                        <div className="text-gray-500 dark:text-gray-400">24h High</div>
                        <div className="text-gray-900 dark:text-white">{high24h}</div>
                        <div className="text-gray-500 dark:text-gray-400">24h Low</div>
                        <div className="text-gray-900 dark:text-white">{low24h}</div>
                        <div className="text-gray-500 dark:text-gray-400">24h Vol({market.base})</div>
                        <div className="text-gray-900 dark:text-white">{volBase}</div>
                        <div className="text-gray-500 dark:text-gray-400">24h Vol({market.quote})</div>
                        <div className="text-gray-900 dark:text-white">{volQuote}</div>
                    </div>
                </div>
            </div>

            {/* Timeframe Selector */}
            <div className="relative flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 pb-2 mb-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex space-x-4 overflow-x-auto no-scrollbar">
                    {MAIN_TIMEFRAMES.map((tf) => (
                        <button 
                            key={tf}
                            onClick={() => { setTimeframe(tf); setShowMore(false); }}
                            className={`pb-1 whitespace-nowrap ${timeframe === tf ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white' : 'hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            {tf}
                        </button>
                    ))}
                    <button 
                        ref={moreButtonRef}
                        onClick={() => setShowMore(!showMore)}
                        className={`pb-1 whitespace-nowrap ${MORE_TIMEFRAMES.includes(timeframe) ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white' : 'hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        More
                    </button>
                </div>
                <button className="text-gray-400 pl-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                </button>

                {/* More Dropdown */}
                {showMore && (
                    <div ref={dropdownRef} className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700 rounded shadow-xl z-50 w-full max-w-xs grid grid-cols-4 gap-2 p-2">
                        {MORE_TIMEFRAMES.map((tf) => (
                            <button
                                key={tf}
                                onClick={() => { setTimeframe(tf); setShowMore(false); }}
                                className={`py-1 px-2 text-center rounded text-xs ${timeframe === tf ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Chart Area */}
            <div 
                className="flex-1 w-full relative" 
                ref={chartContainerRef}
            >
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                    <span className="text-6xl font-bold text-gray-900 dark:text-white">ONLY MEMES</span>
                </div>
            </div>

            {/* Recent Trades */}
            <div className="px-4 border-t border-gray-200 dark:border-gray-800 flex-none h-[120px] overflow-hidden flex flex-col">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 py-2 border-b border-gray-200 dark:border-gray-800">
                    Recent Trades
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                    <div className="text-xs">
                        <div className="grid grid-cols-3 text-gray-500 dark:text-gray-400 mb-2 sticky top-0 bg-white dark:bg-[#0D1117]">
                            <span>Time</span>
                            <span className="text-center">Price</span>
                            <span className="text-right">Amount</span>
                        </div>
                        {recentTrades.map((trade, i) => (
                            <div key={trade.id || i} className="grid grid-cols-3 py-1">
                                <span className="text-gray-600 dark:text-gray-300">{trade.time}</span>
                                <span className={`text-center ${trade.type === 'buy' ? 'text-green-600 dark:text-[#0ECB81]' : 'text-red-600 dark:text-[#f6465d]'}`}>
                                    {formatPrice(trade.price)}
                                </span>
                                <span className="text-right text-gray-600 dark:text-gray-300">{formatNumber(trade.amount)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-[#161B22] border-t border-gray-200 dark:border-gray-800 flex space-x-3">
                <div className="flex flex-col items-center justify-center px-2 text-gray-500 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span className="text-[10px]">Futures</span>
                </div>
                <button 
                    onClick={() => onTrade('buy')}
                    className="flex-1 bg-[#0ECB81] hover:bg-[#0ECB81]/90 text-white font-bold py-3 rounded-lg text-lg transition-colors"
                >
                    Buy
                </button>
                <button 
                    onClick={() => onTrade('sell')}
                    className="flex-1 bg-[#f6465d] hover:bg-[#f6465d]/90 text-white font-bold py-3 rounded-lg text-lg transition-colors"
                >
                    Sell
                </button>
            </div>
        </div>
    );
};

export default MarketDetailView;
