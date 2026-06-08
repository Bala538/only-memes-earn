
import React from 'react';

const UshaIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" {...props}>
        <defs>
            <linearGradient id="ushaGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#FDB931" />
            </linearGradient>
        </defs>
        
        {/* Main Background - Reduced radius to prevent clipping stroke */}
        <circle cx="100" cy="100" r="97" fill="url(#ushaGold)" />
        
        {/* Outer Ring Pattern */}
        <circle cx="100" cy="100" r="94" fill="none" stroke="#1a1a1a" strokeWidth="6" />
        <circle cx="100" cy="100" r="88" fill="none" stroke="#FFD700" strokeWidth="2" strokeDasharray="3 4" />

        {/* Ring of Stars */}
        {[...Array(14)].map((_, i) => {
            const angle = (i * (360 / 14)) * (Math.PI / 180);
            const r = 76;
            const x = 100 + r * Math.cos(angle);
            const y = 100 + r * Math.sin(angle);
            return (
                <path 
                    key={i}
                    transform={`translate(${x}, ${y}) rotate(${i * (360 / 14) + 90}) scale(0.6)`}
                    d="M0,-10 L2.3,-3.1 L9.5,-3.1 L3.6,1.2 L5.9,8.1 L0,3.8 L-5.9,8.1 L-3.6,1.2 L-9.5,-3.1 L-2.3,-3.1 Z" 
                    fill="#1a1a1a" 
                />
            );
        })}

        {/* Inner Decorative Circle */}
        <circle cx="100" cy="80" r="38" fill="none" stroke="#D64B4B" strokeWidth="1" />
        <circle cx="100" cy="80" r="35" fill="none" stroke="#D64B4B" strokeWidth="2" strokeDasharray="2 2" />

        {/* Text: Usha */}
        <text 
            x="100" 
            y="90" 
            textAnchor="middle" 
            fontFamily="'Brush Script MT', cursive" 
            fontSize="32" 
            fill="#1a1a1a" 
        >
            Usha
        </text>

        {/* Text: BALA */}
        <text 
            x="100" 
            y="150" 
            textAnchor="middle" 
            fontFamily="serif" 
            fontSize="42" 
            fill="#000" 
            fontWeight="normal" 
            letterSpacing="2"
        >
            BALA
        </text>
    </svg>
);

export default UshaIcon;
