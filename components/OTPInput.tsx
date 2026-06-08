import React, { useRef, useEffect } from 'react';

interface OTPInputProps {
    value: string;
    onChange: (value: string) => void;
    length?: number;
    disabled?: boolean;
}

const OTPInput: React.FC<OTPInputProps> = ({ value, onChange, length = 6, disabled = false }) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Clear if value is empty externally (e.g. reset)
        if (!value) {
            inputRefs.current.forEach(ref => {
                if (ref) ref.value = '';
            });
        }
    }, [value]);

    const handleInput = (e: React.FormEvent<HTMLInputElement>, index: number) => {
        const val = e.currentTarget.value;
        if (!/^\d*$/.test(val)) {
            e.currentTarget.value = '';
            return;
        }

        const newOTP = value.split('');
        newOTP[index] = val.slice(-1);
        const updatedValue = newOTP.join('');
        onChange(updatedValue);

        if (val && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('Text').slice(0, length);
        if (/^\d+$/.test(pastedData)) {
            onChange(pastedData);
            // Focus last input or next empty
            const lastIndex = Math.min(pastedData.length, length - 1);
            inputRefs.current[lastIndex]?.focus();
        }
    };

    return (
        <div className="flex justify-between gap-2 mb-4">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={value[index] || ''}
                    disabled={disabled}
                    onInput={(e) => handleInput(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    className="w-full h-12 text-center text-xl font-bold bg-gray-50 dark:bg-[#222] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:border-[#FFC107] focus:ring-1 focus:ring-[#FFC107] outline-none transition-all disabled:opacity-50"
                />
            ))}
        </div>
    );
};

export default OTPInput;
