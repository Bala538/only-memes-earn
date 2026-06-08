
import React from 'react';

const LuckyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <path id="leaf" d="M40,50 C10,90 50,80 50,50 C50,80 90,90 60,50" fill="#34A853"/>
        </defs>
        <use href="#leaf" />
        <use href="#leaf" transform="rotate(90 50 50)" />
        <use href="#leaf" transform="rotate(180 50 50)" />
        <use href="#leaf" transform="rotate(270 50 50)" />
        <line x1="50" y1="50" x2="20" y2="20" stroke="#34A853" strokeWidth="4" strokeLinecap="round" />
    </svg>
);

export default LuckyIcon;
