import React, { useEffect, useRef, useMemo, useContext } from 'react';
import { createChart, ColorType, ISeriesApi, CandlestickSeries } from 'lightweight-charts';
import { MarketPair } from '../types';
import { AppContext } from '../context/AppContext';

interface SwapChartProps {
    market: MarketPair;
}

const SwapChart: React.FC<SwapChartProps> = ({ market }) => {
    const { state } = useContext(AppContext);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);

    const candles = useMemo(() => {
        if (!market.candles || market.candles.length === 0) return [];
        
        const sortedCandles = [...market.candles].sort((a: any, b: any) => a.time - b.time);
        
        return sortedCandles.map((d: any) => {
            return {
                time: (d.time / 1000) as any,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
            };
        });
    }, [market.candles]);

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
            height: 200, // Fixed height for swap view
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
                });
            }
        };

        window.addEventListener('resize', handleResize);

        const currentSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#0ECB81',
            downColor: '#f6465d',
            borderVisible: false,
            wickUpColor: '#0ECB81',
            wickDownColor: '#f6465d',
        });
        
        if (candles.length > 0) {
            currentSeries.setData(candles);
            chart.timeScale().fitContent();
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [candles, state.theme]);

    return (
        <div className="w-full h-[200px] relative" ref={chartContainerRef}>
        </div>
    );
};

export default SwapChart;
