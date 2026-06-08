
import React from 'react';

const ParachuteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 8.625c1.243 0 2.25 1.007 2.25 2.25v.75a2.25 2.25 0 11-4.5 0v-.75c0-1.243 1.007-2.25 2.25-2.25zM6.657 7.757l2.829 2.829m7.071 0l2.829-2.829" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5v4.5m-4.5-4.5l-2.25 3m9-3l2.25 3" />
    </svg>
);

export default ParachuteIcon;
