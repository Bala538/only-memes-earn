
import React from 'react';

const AppStoreIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor"
        {...props}
    >
        <path d="M11.47 3.84a.75.75 0 011.06 0l8.635 8.635a.75.75 0 11-1.06 1.06l-7.5-7.5-7.5 7.5a.75.75 0 11-1.06-1.06L11.47 3.84zm-9.53 3.44a.75.75 0 01.75.75v11.25c0 .414.336.75.75.75h17.25c.414 0 .75-.336.75-.75V8.03a.75.75 0 011.5 0v11.25A2.25 2.25 0 0119.94 21.75H4.06A2.25 2.25 0 011.81 19.28V8.03a.75.75 0 01.75-.75zM12 9.75a.75.75 0 01.75.75v5.69l1.72-1.72a.75.75 0 111.06 1.06l-3 3a.75.75 0 01-1.06 0l-3-3a.75.75 0 111.06-1.06l1.72 1.72V10.5a.75.75 0 01.75-.75z"/>
    </svg>
);

export default AppStoreIcon;
