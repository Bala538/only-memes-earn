import React, { useRef, useEffect, useState } from 'react';

interface OTPInputProps {
    value: string;
    onChange: (value: string) => void;
    length?: number;
    disabled?: boolean;
}

const OTPInput: React.FC<OTPInputProps> = ({ value, onChange, length = 6, disabled = false }) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    
    // Maintain a local array of characters to prevent shifting/scrambling digits
    const [otpArray, setOtpArray] = useState<string[]>(() => {
        const arr = Array(length).fill('');
        for (let i = 0; i < Math.min(value.length, length); i++) {
            arr[i] = value[i] || '';
        }
        return arr;
    });

    // Synchronize local state with prop only if it changed externally
    useEffect(() => {
        const joinedLocal = otpArray.join('');
        if (value !== joinedLocal) {
            const arr = Array(length).fill('');
            for (let i = 0; i < Math.min(value.length, length); i++) {
                arr[i] = value[i] || '';
            }
            setOtpArray(arr);
        }
    }, [value, length]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (disabled) return;

        if (e.key === 'Backspace') {
            e.preventDefault();
            const newArr = [...otpArray];
            
            if (otpArray[index] !== '') {
                // If current box is not empty, clear it, keeping focus here
                newArr[index] = '';
                setOtpArray(newArr);
                onChange(newArr.join(''));
            } else if (index > 0) {
                // If current box is already empty, backspace clears previous and moves focus
                newArr[index - 1] = '';
                setOtpArray(newArr);
                onChange(newArr.join(''));
                inputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            e.preventDefault();
            inputRefs.current[index + 1]?.focus();
        } else if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            const newArr = [...otpArray];
            newArr[index] = e.key;
            setOtpArray(newArr);
            onChange(newArr.join(''));
            
            // Move focus to next input
            if (index < length - 1) {
                inputRefs.current[index + 1]?.focus();
            }
        } else if (e.key === 'Delete') {
            e.preventDefault();
            const newArr = [...otpArray];
            newArr[index] = '';
            setOtpArray(newArr);
            onChange(newArr.join(''));
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        if (disabled) return;
        e.preventDefault();
        
        const pastedData = e.clipboardData.getData('Text').replace(/\D/g, '').slice(0, length);
        if (pastedData.length > 0) {
            const newArr = Array(length).fill('');
            for (let i = 0; i < pastedData.length; i++) {
                newArr[i] = pastedData[i];
            }
            setOtpArray(newArr);
            onChange(newArr.join(''));
            
            // Focus on the next empty field or the very last one
            const focusIndex = Math.min(pastedData.length, length - 1);
            inputRefs.current[focusIndex]?.focus();
        }
    };

    return (
        <div className="flex justify-between gap-2.5 mb-4">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={otpArray[index] || ''}
                    disabled={disabled}
                    onChange={() => {}} // Controlled input, events handled onKeyDown
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    className="w-full h-12 text-center text-xl font-bold bg-gray-50 dark:bg-[#222] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:border-[#FFC107] focus:ring-1 focus:ring-[#FFC107] outline-none transition-all disabled:opacity-50 select-none cursor-pointer"
                />
            ))}
        </div>
    );
};

export default OTPInput;
