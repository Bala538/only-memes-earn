import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';

const AuthView: React.FC = () => {
    const { login, register, state } = useContext(AppContext);
    const { authConfig } = state;
    
    // View State: 'welcome' (Get Started screen) or 'auth' (Login/Signup form)
    const [view, setView] = useState<'welcome' | 'auth'>('welcome');
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [errorObj, setErrorObj] = useState<any>(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(true);

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
            setView('auth');
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

    // Use specific image or fallback to main image
    const authImageSource = authConfig.authImageUrl || authConfig.imageUrl;
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;

    const formatAuthError = (errMessage: string, errObj?: any): React.ReactNode => {
        if (!errMessage) return null;
        
        const rawObj = errObj || errorObj;
        const code = rawObj?.code || (typeof errMessage === 'string' && errMessage.includes('auth/') 
            ? errMessage.match(/auth\/[a-zA-Z0-9-]+/)?.[0] 
            : null);
            
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your preview domain';

        if (code === 'auth/unauthorized-domain' || errMessage.includes('unauthorized-domain')) {
            return (
                <div className="text-center space-y-1">
                    <p className="font-bold text-gray-900 dark:text-white text-xs">
                        Domain Not Authorized
                    </p>
                    <p className="text-[11px] text-gray-600 dark:text-zinc-400 leading-relaxed">
                        This preview domain ({currentDomain}) is not authorized in Firebase settings. Please register it in your Firebase Console or use the main domain.
                    </p>
                </div>
            );
        }

        if (code === 'auth/operation-not-allowed' || errMessage.includes('operation-not-allowed')) {
            return (
                <p className="text-[11px] text-gray-600 dark:text-zinc-400 text-center leading-relaxed">
                    This login method is currently disabled. Please contact support or use another method.
                </p>
            );
        }

        if (code === 'auth/invalid-api-key' || errMessage.includes('invalid-api-key') || errMessage.includes('API key')) {
            return (
                <p className="text-[11px] text-gray-600 dark:text-zinc-400 text-center leading-relaxed">
                    A configuration issue occurred. Please check back later or notify the administrator.
                </p>
            );
        }

        if (code === 'auth/iframe-sandbox-restriction' || errMessage.includes('iframe-sandbox-restriction') || errMessage.includes('preview pane')) {
            return (
                <div className="text-center space-y-2">
                    <p className="font-bold text-amber-600 dark:text-amber-400 text-xs">
                        Action Required
                    </p>
                    <p className="text-[11px] text-gray-600 dark:text-zinc-400 leading-relaxed">
                        To sign in securely, please open the application in a new browser tab.
                    </p>
                    <div className="pt-1">
                        <a 
                            href={typeof window !== 'undefined' ? window.location.href : '#'} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-block px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs transition-all active:scale-95 shadow-sm"
                        >
                            Open in New Tab 🚀
                        </a>
                    </div>
                </div>
            );
        }

        if (code === 'auth/webview-restriction' || errMessage.includes('webview-restriction') || errMessage.includes('mobile native')) {
            return (
                <p className="text-[11px] text-gray-600 dark:text-zinc-400 text-center leading-relaxed">
                    Please open onlymemesearn.store in a standard web browser (like Chrome or Safari) to complete sign-in.
                </p>
            );
        }

        if (code === 'auth/popup-blocked' || errMessage.includes('popup-blocked')) {
            return (
                <p className="text-[11px] text-gray-600 dark:text-zinc-400 text-center leading-relaxed font-medium">
                    The sign-in popup was blocked by your browser. Please allow popups or open the app in a new tab.
                </p>
            );
        }

        if (code === 'auth/popup-closed-by-user' || errMessage.includes('popup-closed-by-user')) {
            return (
                <p className="text-[11px] text-gray-600 dark:text-zinc-400 text-center leading-relaxed">
                    Sign-in cancelled. Please try again.
                </p>
            );
        }

        if (code === 'auth/network-request-failed' || errMessage.includes('network-request-failed')) {
            return (
                <p className="text-[11px] text-gray-600 dark:text-zinc-400 text-center leading-relaxed font-medium">
                    Unable to connect to login server. Please check your internet connection and try again.
                </p>
            );
        }

        if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password' || errMessage.includes('invalid-credential') || errMessage.includes('user-not-found') || errMessage.includes('wrong-password')) {
            return (
                <p className="text-[11px] text-gray-600 dark:text-zinc-400 text-center leading-relaxed font-medium">
                    Incorrect email or password. Please double check and try again.
                </p>
            );
        }

        if (code === 'auth/email-already-in-use' || errMessage.includes('email-already-in-use')) {
            return (
                <p className="text-[11px] text-gray-600 dark:text-zinc-400 text-center leading-relaxed font-medium">
                    This email is already registered. Please sign in instead.
                </p>
            );
        }

        if (code === 'auth/weak-password' || errMessage.includes('weak-password')) {
            return (
                <p className="text-[11px] text-gray-600 dark:text-zinc-400 text-center leading-relaxed font-medium">
                    Please choose a stronger password (at least 6 characters long).
                </p>
            );
        }

        if (code === 'auth/invalid-email' || errMessage.includes('invalid-email')) {
            return (
                <p className="text-[11px] text-gray-600 dark:text-zinc-400 text-center leading-relaxed font-medium">
                    Please enter a valid email address format.
                </p>
            );
        }

        if (code === 'auth/too-many-requests' || errMessage.includes('too-many-requests')) {
            return (
                <p className="text-[11px] text-gray-600 dark:text-zinc-400 text-center leading-relaxed font-medium">
                    Too many attempts. Access temporarily disabled. Please try again in a few minutes.
                </p>
            );
        }

        return (
            <p className="text-[11px] text-gray-600 dark:text-zinc-400 text-center leading-relaxed">
                {errMessage.replace(/^Firebase:\s*/i, '')}
            </p>
        );
    };

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setErrorObj(null);
        setSuccessMessage('');

        if (!email.trim() || !password.trim()) {
            setError("Please fill in all fields.");
            return;
        }

        if (!agreedToTerms) {
            setError("You must agree to the Terms and Conditions to continue.");
            return;
        }

        if (authMode === 'signup' && password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsLoading(true);
        try {
            if (authMode === 'login') {
                await login(email.trim(), password);
            } else {
                await register(email.trim(), password);
                setSuccessMessage("Account created successfully! A verification link has been sent to your email address. Please click the link to verify your email, then sign in below.");
                setAuthMode('login');
                setPassword('');
                setConfirmPassword('');
            }
        } catch (err: any) {
            console.error("Auth error:", err);
            setError(err.message || String(err));
            setErrorObj(err);
        } finally {
            setIsLoading(false);
        }
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
                 <div className="flex-grow bg-white dark:bg-[#111] rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] relative z-20 px-8 pt-8 pb-6 flex flex-col justify-between h-full overflow-y-auto -mt-10 border-t border-gray-200 dark:border-white/5 custom-scrollbar">
                     
                     <div className="w-full max-w-sm mx-auto space-y-6 my-auto">
                         <div className="text-center">
                             <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                                 {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                             </h2>
                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                                 {authMode === 'login' 
                                     ? 'Sign in with your email and password to continue earning.' 
                                     : 'Register with your email to start watching, playing, and earning!'}
                             </p>
                         </div>

                         {/* Segmented Control */}
                         <div className="flex p-1.5 bg-gray-100 dark:bg-zinc-900/80 rounded-2xl w-full">
                             <button
                                 type="button"
                                 onClick={() => { setAuthMode('login'); setError(''); setSuccessMessage(''); }}
                                 className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer ${authMode === 'login' ? 'bg-white dark:bg-zinc-800 text-gray-950 dark:text-white shadow-md' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                             >
                                 Sign In
                             </button>
                             <button
                                 type="button"
                                 onClick={() => { setAuthMode('signup'); setError(''); setSuccessMessage(''); }}
                                 className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer ${authMode === 'signup' ? 'bg-white dark:bg-zinc-800 text-gray-950 dark:text-white shadow-md' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                             >
                                 Sign Up
                             </button>
                         </div>

                         {successMessage && (
                              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs text-center font-bold p-4 rounded-2xl shadow-md">
                                  {successMessage}
                              </div>
                          )}

                          {/* Auth Form */}
                         <form onSubmit={handleAuthSubmit} className="space-y-4">
                             <div>
                                 <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                                 <input
                                     type="email"
                                     value={email}
                                     onChange={(e) => setEmail(e.target.value)}
                                     placeholder="Enter your email"
                                     required
                                     className="w-full px-4 py-3.5 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium text-sm transition-all"
                                 />
                             </div>

                             <div>
                                 <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                                 <input
                                     type="password"
                                     value={password}
                                     onChange={(e) => setPassword(e.target.value)}
                                     placeholder="Enter your password"
                                     required
                                     className="w-full px-4 py-3.5 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium text-sm transition-all"
                                 />
                             </div>

                             {authMode === 'signup' && (
                                 <div className="animate-fadeIn">
                                     <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Confirm Password</label>
                                     <input
                                         type="password"
                                         value={confirmPassword}
                                         onChange={(e) => setConfirmPassword(e.target.value)}
                                         placeholder="Confirm your password"
                                         required={authMode === 'signup'}
                                         className="w-full px-4 py-3.5 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium text-sm transition-all"
                                     />
                                 </div>
                             )}

                             <div className="pt-2">
                                 <button
                                     type="submit"
                                     disabled={isLoading}
                                     className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 active:scale-95 disabled:opacity-50 text-black font-extrabold text-base rounded-2xl shadow-xl shadow-amber-500/10 transition-all duration-300 cursor-pointer"
                                 >
                                     {isLoading ? (
                                         <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                                     ) : (
                                         <span>{authMode === 'login' ? 'Sign In 🚀' : 'Create Account ✨'}</span>
                                     )}
                                 </button>
                             </div>
                         </form>

                         {error && (
                             <div className="text-xs text-center bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/40 animate-fadeIn text-gray-700 dark:text-zinc-300">
                                 {formatAuthError(error)}
                             </div>
                         )}
                     </div>

                      <div className="text-center pt-6 border-t border-gray-100 dark:border-white/5 mt-6 flex justify-center">
                          <button
                              type="button"
                              onClick={() => setAgreedToTerms(!agreedToTerms)}
                              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all duration-200"
                          >
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                  agreedToTerms 
                                      ? 'bg-[#FFC107] border-[#FFC107] text-black shadow-sm shadow-[#FFC107]/20' 
                                      : 'border-gray-300 dark:border-zinc-700 text-transparent'
                              }`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                              </div>
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                  I agree to the Terms and Conditions
                              </span>
                          </button>
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
