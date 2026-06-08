
import React from 'react';

const TwitterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor"
        {...props}
    >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231L18.244 2.25zM17.5 19.5h1.56l-9.56-12.864H7.882l9.618 12.864z"/>
    </svg>
);

export default TwitterIcon;
