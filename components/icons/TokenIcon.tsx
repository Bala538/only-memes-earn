
import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Token } from '../../types';
import BabyDogeIcon from './BabyDogeIcon';
import SHIBIcon from './SHIBIcon';
import PEPEIcon from './PEPEIcon';
import LuckyIcon from './LuckyIcon';
import QuackIcon from './QuackIcon';
import KishuIcon from './KishuIcon';
import UshaIcon from './UshaIcon';

interface TokenIconProps extends React.HTMLAttributes<HTMLElement> {
    token: Token;
    className?: string;
}

const TokenIcon: React.FC<TokenIconProps> = ({ token, className, ...props }) => {
    const { state } = useContext(AppContext);
    const [imgError, setImgError] = useState(false);
    const [prevToken, setPrevToken] = useState(token);

    if (token !== prevToken) {
        setPrevToken(token);
        setImgError(false);
    }

    // Safety check for undefined/null token
    if (!token) {
        return <div className={`rounded-full bg-gray-600 ${className || 'w-6 h-6'}`} {...props} />;
    }

    const customLogo = state.tokenLogos[token];

    // Priority 1: Custom Logo from Context (Admin overrides)
    // Only render if we haven't encountered an error loading it
    if (customLogo && !imgError) {
        return (
            <img 
                src={customLogo} 
                alt={`${token} Logo`} 
                className={`rounded-full object-contain ${className || 'w-6 h-6'}`} 
                style={{ verticalAlign: 'middle' }}
                onError={() => setImgError(true)}
                {...props}
            />
        );
    }

    // Priority 2: Hardcoded Icons (SVG Components)
    switch (token) {
        case 'USHA':
        case 'Usha': return <UshaIcon className={className} {...props as any} />;
        case 'SHIB': return <SHIBIcon className={className} {...props as any} />;
        case 'PEPE': return <PEPEIcon className={className} {...props as any} />;
        case 'Lucky': return <LuckyIcon className={className} {...props as any} />;
        case 'Quack': return <QuackIcon className={className} {...props as any} />;
        case 'Kishu': return <KishuIcon className={className} {...props as any} />;
        case 'BabyDoge': return <BabyDogeIcon className={className} {...props as any} />;
    }

    // Priority 3: Fallback for unknown tokens
    return (
        <div className={`rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-[10px] uppercase overflow-hidden ${className || 'w-6 h-6'}`} {...props}>
            {token.substring(0, 2)}
        </div>
    );
};

export default TokenIcon;
