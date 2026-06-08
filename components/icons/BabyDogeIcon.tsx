
import React from 'react';

const BabyDogeIcon: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ className, ...props }) => (
    <img 
        src="https://i.postimg.cc/htT87n8b/babydoge.jpg" 
        alt="BabyDoge" 
        className={`rounded-full object-cover ${className}`} 
        {...props} 
    />
);

export default BabyDogeIcon;