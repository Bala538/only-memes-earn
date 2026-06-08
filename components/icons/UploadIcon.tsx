
import React from 'react';

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V21h18v-3.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5V6a3 3 0 013-3h12a3 3 0 013 3v7.5" />
    </svg>
);

export default UploadIcon;