
import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import GoogleIcon from './icons/GoogleIcon';
import FacebookIcon from './icons/FacebookIcon';
import OTPInput from './OTPInput';

const AuthView: React.FC = () => {
    const { login, register, loginWithGoogle, loginWithFacebook, resetPassword, state } = useContext(AppContext);
    const { authConfig } = state;
    
    // View State: 'welcome' (Get Started screen) or 'auth' (Login/Signup form)
    const [view, setView] = useState<'welcome' | 'auth'>('welcome');
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [simulatedOtp, setSimulatedOtp] = useState('');

    // --- Slider Logic ---
    const sliderRef = useRef<HTMLDivElement>(null);
    const [sliderX, setSliderX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const thumbWidth = 72;
    const padding = 4;

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging || !sliderRef.current) return;
        const sliderRect = sliderRef.current.getBoundingClientRect();
        let newX = e.clientX - sliderRect.left - (thumbWidth / 2);
        const maxX = sliderRect.width - thumbWidth - (padding * 2);
        newX = Math.max(0, Math.min(newX, maxX));
        setSliderX(newX);
        if (newX >= maxX * 0.95) {
            setIsDragging(false);
            setSliderX(maxX);
            if (navigator.vibrate) navigator.vibrate(50);
            setTimeout(() => setView('auth'), 100);
        }
    };

    const handlePointerUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (sliderRef.current) {
             const sliderRect = sliderRef.current.getBoundingClientRect();
             const maxX = sliderRect.width - thumbWidth - (padding * 2);
             if (sliderX < maxX * 0.95) {
                 setSliderX(0);
             }
        } else {
            setSliderX(0);
        }
    };

    useEffect(() => {
        if (view === 'welcome') setSliderX(0);
    }, [view]);

    // --- Auth Handler ---
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authConfig.enableEmailAuth) return;
        if (mode === 'login') {
            // Login flow
            setError('');
            setIsLoading(true);
            try {
                await login(email, password);
            } catch (loginErr: any) {
                if (loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/invalid-credential' || loginErr.code === 'auth/wrong-password') {
                    setError('Invalid email or password. Please try again or Sign Up.');
                } else {
                    setError(loginErr.message);
                }
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // Signup or Forgot Password flow - send OTP
        if (mode === 'signup' && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setError('');
        setSuccessMessage('');
        setIsLoading(true);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const res = await fetch(API_BASE + '/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, mode })
            });
            
            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                const text = await res.text();
                console.error("Non-JSON response from /api/auth/send-otp:", text);
                throw new Error("Server returned an invalid response. Please ensure the backend is running.");
            }

            if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
            setOtpSent(true);
            if (data.isSimulated && data.otp) {
                setSimulatedOtp(data.otp);
                setSuccessMessage('Sandbox Mode: Test OTP generated! Find it below.');
            } else {
                setSimulatedOtp('');
                setSuccessMessage('OTP sent to your email!');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mode !== 'signup') return;

        setError('');
        setIsLoading(true);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const res = await fetch(API_BASE + '/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });
            
            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                const text = await res.text();
                console.error("Non-JSON response from /api/auth/verify-otp:", text);
                throw new Error("Server returned an invalid response. Please ensure the backend is running.");
            }

            if (!res.ok) throw new Error(data.error || 'Invalid OTP');

            try {
                await register(email, password);
            } catch (regErr: any) {
                if (regErr.code === 'auth/email-already-in-use') {
                    throw new Error('Account already exists. Please switch to Login.');
                }
                throw regErr;
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mode !== 'forgot-password') return;

        setError('');
        setIsLoading(true);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const res = await fetch(API_BASE + '/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword: password })
            });
            
            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                const text = await res.text();
                console.error("Non-JSON response from /api/auth/reset-password:", text);
                throw new Error("Server returned an invalid response. Please ensure the backend is running.");
            }

            if (!res.ok) throw new Error(data.error || 'Failed to reset password');

            setSuccessMessage('Password reset successfully! You can now login.');
            setMode('login');
            setOtpSent(false);
            setOtp('');
            setPassword('');
            setConfirmPassword('');
            setSimulatedOtp('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPasswordClick = () => {
        setMode('forgot-password');
        setOtpSent(false);
        setOtp('');
        setPassword('');
        setError('');
        setSuccessMessage('');
        setSimulatedOtp('');
    };

    // Use specific image or fallback to main image
    const authImageSource = authConfig.authImageUrl || authConfig.imageUrl;

    const isEmailDisabled = !authConfig.enableEmailAuth;

    const formatAuthError = (errMessage: string): React.ReactNode => {
        if (!errMessage) return null;
        if (errMessage.includes('auth/operation-not-allowed')) {
            return (
                <div className="text-left space-y-1">
                    <p className="font-extrabold text-red-400 text-center text-xs">Auth Provider Disabled</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal font-medium">
                        This sign-in method is not enabled in your Firebase Console. Please open your Firebase Console, click Authentication, go to the "Sign-in method" tab, and enable the <strong>Email/Password</strong> and <strong>Google</strong> providers.
                    </p>
                </div>
            );
        }
        if (errMessage.includes('auth/popup-blocked')) {
            return (
                <div className="text-left space-y-1">
                    <p className="font-extrabold text-[#FFC107] text-center text-xs">Popup Blocked</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-400 leading-normal font-medium">
                        The Google Sign-In popup was blocked by your browser's ad-blocker or security settings. Please allow popups for this site or open the app in a new tab.
                    </p>
                </div>
            );
        }
        if (errMessage.includes('auth/popup-closed-by-user')) {
            return 'Sign-In cancelled. The login popup was closed before completing.';
        }
        return errMessage;
    };

    return (
        <div className="h-[100dvh] w-full font-sans overflow-hidden relative flex flex-col bg-black">
            
            {/* --- WELCOME SCREEN (Slide 1) --- */}
            <div className={`absolute inset-0 z-10 w-full h-full transition-transform duration-500 ease-in-out ${view === 'welcome' ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="absolute inset-0 z-0">
                    <img src={authConfig.imageUrl} alt="Hero" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
                </div>
                <div className="absolute inset-0 z-10 flex flex-col h-full justify-between p-8 pb-12">
                    <div className="pt-12 text-center">
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] stroke-text">
                            <span className="text-[#FFC107]">Only</span> Memes
                        </h1>
                        <div className="mt-4">
                            <h2 className="text-xl font-bold text-white leading-snug drop-shadow-md text-shadow-sm">{authConfig.welcomeHeadline}</h2>
                        </div>
                    </div>
                    <div className="w-full max-w-sm mx-auto pb-8">
                        <div ref={sliderRef} className="relative w-full h-[80px] bg-[#FFC107] rounded-[40px] shadow-[0_10px_30px_rgba(255,193,7,0.4)] flex items-center p-1 cursor-pointer select-none border-b-4 border-[#e0a800] touch-none" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                <span className="text-gray-900 font-black text-xl uppercase tracking-widest animate-pulse opacity-80 pl-12">Slide to Start &gt;&gt;</span>
                            </div>
                            <div className="absolute top-1 left-1 h-[72px] w-[72px] bg-white rounded-full shadow-lg flex items-center justify-center z-10 cursor-grab active:cursor-grabbing pointer-events-none" style={{ transform: `translateX(${sliderX}px)`, transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6 text-[#FFC107]"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- AUTH SCREEN (Slide 2) --- */}
            <div className={`absolute inset-0 z-20 flex flex-col transition-transform duration-500 ease-in-out bg-white dark:bg-[#111] ${view === 'auth' ? 'translate-x-0' : 'translate-x-full'}`}>
                
                {/* Top Image Area - FULL COVER */}
                <div className="h-[35%] w-full relative overflow-hidden flex-shrink-0 bg-black">
                     <button onClick={() => setView('welcome')} className="absolute top-6 left-6 z-30 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition shadow-sm active:scale-90 border border-white/10 backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                     </button>

                     <div className="absolute inset-0 z-10">
                        <img 
                            src={authImageSource} 
                            alt="Auth Header" 
                            className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#111] via-transparent to-transparent opacity-90"></div>
                     </div>
                </div>

                {/* Bottom Form Area */}
                <div className="flex-grow bg-white dark:bg-[#111] rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] relative z-20 px-8 pt-8 pb-4 flex flex-col h-full overflow-hidden -mt-10 border-t border-gray-200 dark:border-white/5">
                    
                    <div className="flex justify-center mb-6 space-x-4">
                        {mode === 'forgot-password' ? (
                            <h2 className="text-xl font-black text-gray-900 dark:text-white border-b-2 border-[#FFC107]">
                                Reset Password
                            </h2>
                        ) : (
                            <>
                                <button 
                                    onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); setOtpSent(false); setOtp(''); setPassword(''); setConfirmPassword(''); setSimulatedOtp(''); }}
                                    className={`text-xl font-black transition-colors ${mode === 'login' ? 'text-gray-900 dark:text-white border-b-2 border-[#FFC107]' : 'text-gray-400'}`}
                                >
                                    Login
                                </button>
                                <button 
                                    onClick={() => { setMode('signup'); setError(''); setSuccessMessage(''); setOtpSent(false); setOtp(''); setPassword(''); setConfirmPassword(''); setSimulatedOtp(''); }}
                                    className={`text-xl font-black transition-colors ${mode === 'signup' ? 'text-gray-900 dark:text-white border-b-2 border-[#FFC107]' : 'text-gray-400'}`}
                                >
                                    Sign Up
                                </button>
                            </>
                        )}
                    </div>

                    {successMessage && <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 text-xs text-center font-bold shrink-0">{successMessage}</div>}

                    {simulatedOtp && otpSent && (
                        <div className="mb-4 p-3.5 bg-yellow-950/20 border border-[#FFC107]/25 rounded-xl text-center shrink-0">
                            <span className="text-[10px] font-black uppercase text-[#FFC107] tracking-wider bg-[#FFC107]/15 px-2 py-0.5 rounded font-mono">Sandbox Test Code</span>
                            <p className="text-gray-400 text-xs font-semibold mt-1">
                                Developer sandbox email mode active. Please authenticate using research test code:
                            </p>
                            <p className="text-2xl font-black text-[#FFC107] font-mono tracking-widest mt-1">
                                {simulatedOtp}
                            </p>
                        </div>
                    )}

                    {/* Form */}
                    <div className="overflow-y-auto flex-grow -mr-4 pr-4 custom-scrollbar">
                        {isEmailDisabled && (
                            <div className="mb-4 p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl flex items-center justify-center space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs font-bold text-gray-400 uppercase">
                                    Email login disabled
                                </span>
                            </div>
                        )}

                        <form onSubmit={(mode === 'signup' && otpSent) ? handleVerifyOtp : (mode === 'forgot-password' && otpSent) ? handleResetPassword : handleSendOtp} className={`space-y-4 pb-4 transition-opacity duration-300 ${isEmailDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1.5 pl-1">Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-500 group-focus-within:text-[#FFC107] transition-colors"><path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" /><path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" /></svg></div>
                                    <input 
                                        type="email" 
                                        required 
                                        disabled={isLoading || isEmailDisabled || ((mode === 'signup' || mode === 'forgot-password') && otpSent)}
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        className="w-full bg-gray-50 dark:bg-[#222] text-gray-900 dark:text-white pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-[#FFC107] focus:ring-1 focus:ring-[#FFC107] outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600 font-medium text-sm disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800" 
                                        placeholder="name@example.com" 
                                    />
                                </div>
                            </div>

                            {!(mode === 'forgot-password' && !otpSent) && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 pl-1">
                                        {mode === 'forgot-password' ? 'New Password' : 'Password'}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-500 group-focus-within:text-[#FFC107] transition-colors"><path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" /></svg></div>
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            required 
                                            disabled={isLoading || isEmailDisabled || (mode === 'signup' && otpSent)}
                                            value={password} 
                                            onChange={(e) => setPassword(e.target.value)} 
                                            className="w-full bg-gray-50 dark:bg-[#222] text-gray-900 dark:text-white pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-[#FFC107] focus:ring-1 focus:ring-[#FFC107] outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600 font-medium text-sm disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800" 
                                            placeholder="••••••••" 
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {mode === 'login' && (
                                        <div className="flex justify-end mt-2">
                                            <button 
                                                type="button" 
                                                onClick={handleForgotPasswordClick}
                                                className="text-xs font-bold text-[#FFC107] hover:text-yellow-400 transition-colors"
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {mode === 'signup' && !otpSent && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 pl-1">
                                        Confirm Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-500 group-focus-within:text-[#FFC107] transition-colors"><path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" /></svg></div>
                                        <input 
                                            type={showConfirmPassword ? "text" : "password"} 
                                            required 
                                            disabled={isLoading || isEmailDisabled || otpSent}
                                            value={confirmPassword} 
                                            onChange={(e) => setConfirmPassword(e.target.value)} 
                                            className="w-full bg-gray-50 dark:bg-[#222] text-gray-900 dark:text-white pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-[#FFC107] focus:ring-1 focus:ring-[#FFC107] outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600 font-medium text-sm disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800" 
                                            placeholder="••••••••" 
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {((mode === 'signup' || mode === 'forgot-password') && otpSent) && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 pl-1">6-Digit Code</label>
                                    <OTPInput
                                        value={otp}
                                        onChange={setOtp}
                                        disabled={isLoading || isEmailDisabled}
                                    />
                                </div>
                            )}
                            
                            {error && (
                                <div className="text-red-400 text-xs text-center font-bold bg-red-900/20 p-3 rounded-xl border border-red-900/30">
                                    {formatAuthError(error)}
                                </div>
                            )}
                            
                            <button 
                                type="submit" 
                                disabled={isLoading || isEmailDisabled || !email || (!(mode === 'forgot-password' && !otpSent) && !password) || (mode === 'signup' && !otpSent && !confirmPassword) || ((mode === 'signup' || mode === 'forgot-password') && otpSent && !otp)} 
                                className="w-full py-4 bg-[#FFC107] hover:bg-yellow-400 text-black font-extrabold rounded-xl shadow-lg shadow-yellow-900/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400 disabled:shadow-none text-base transform active:scale-[0.98] mt-2"
                            >
                                {isEmailDisabled ? 'Currently Disabled' : (isLoading ? 'Processing...' : (mode === 'login' ? 'Login' : (mode === 'forgot-password' ? (otpSent ? 'Reset Password' : 'Send Code') : (otpSent ? 'Verify & Sign Up' : 'Send Code'))))}
                            </button>
                            
                            {((mode === 'signup' || mode === 'forgot-password') && otpSent) && (
                                <button
                                    type="button"
                                    onClick={() => { setOtpSent(false); setOtp(''); setError(''); setSuccessMessage(''); }}
                                    className="w-full py-2 text-gray-500 hover:text-gray-900 dark:hover:text-white text-xs font-bold transition-colors"
                                >
                                    Change Email
                                </button>
                            )}
                            
                            {mode === 'forgot-password' && (
                                <button
                                    type="button"
                                    onClick={() => { setMode('login'); setOtpSent(false); setOtp(''); setError(''); setSuccessMessage(''); setPassword(''); setConfirmPassword(''); }}
                                    className="w-full py-2 text-gray-500 hover:text-gray-900 dark:hover:text-white text-xs font-bold transition-colors"
                                >
                                    Back to Login
                                </button>
                            )}
                        </form>

                        {mode !== 'forgot-password' && (
                            <div className="mt-6 mb-8">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
                                    <div className="relative flex justify-center text-xs"><span className="px-4 bg-white dark:bg-[#111] text-gray-500">or continue with</span></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => authConfig.enableGoogleAuth ? loginWithGoogle().catch(e => setError(e.message)) : null} 
                                        disabled={isLoading || !authConfig.enableGoogleAuth} 
                                        className={`flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-gray-700 rounded-xl transition-all ${
                                            !authConfig.enableGoogleAuth 
                                            ? 'opacity-40 cursor-not-allowed' 
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95'
                                        }`}
                                    >
                                        <GoogleIcon className="w-5 h-5" />
                                        <span className="text-gray-900 dark:text-white font-bold text-xs">{authConfig.enableGoogleAuth ? 'Google' : 'Disabled'}</span>
                                    </button>
                                    <button 
                                        onClick={() => authConfig.enableFacebookAuth ? loginWithFacebook().catch(e => setError(e.message)) : null} 
                                    disabled={isLoading || !authConfig.enableFacebookAuth} 
                                    className={`flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-gray-700 rounded-xl transition-all ${
                                        !authConfig.enableFacebookAuth 
                                        ? 'opacity-40 cursor-not-allowed' 
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95'
                                    }`}
                                >
                                    <FacebookIcon className="w-5 h-5 text-gray-900 dark:text-white" />
                                    <span className="text-gray-900 dark:text-white font-bold text-xs">{authConfig.enableFacebookAuth ? 'Facebook' : 'Disabled'}</span>
                                </button>
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            </div>
            
            <style>{`
                .stroke-text { text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; }
                .text-shadow-sm { text-shadow: 0 2px 4px rgba(0,0,0,0.8); }
                .custom-scrollbar::-webkit-scrollbar { display: none; }
                .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .touch-none { touch-action: none; }
            `}</style>
        </div>
    );
};

export default AuthView;
