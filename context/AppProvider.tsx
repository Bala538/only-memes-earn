
import React, { useReducer, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { getApiBaseUrl } from '../utils/api';

axios.defaults.baseURL = getApiBaseUrl();

import { 
    AppState, AppAction, UserData, Token, Video, Game, Banner, PromoCode, 
    YouTubeTask, FacebookTask, InstagramTask, TwitterTask, TikTokTask, AppDownloadTask,
    WithdrawalSetting, ReferralConfig, AirdropConfig, MineUpgrade, AuthConfig, AdsConfig,
    Proof, Withdrawal, DEFAULT_TOKENS, Transaction, DailyConfig, AppNotification, MarketPair, OtherTask,
    Trade, OrderBookItem
} from '../types';
import { 
    auth, db, googleProvider,
    signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChangedWrapper,
    signInWithPopup, signInWithRedirect, getRedirectResult, sendEmailVerification, sendPasswordResetEmail, reload, signInWithCustomToken, 
    signInAnonymously, isSignInWithEmailLink, signInWithEmailLink,
    doc, setDoc, updateDoc, onSnapshot, collection, getDoc, getDocs, query, where, deleteDoc, runTransaction, addDoc,
    uploadFileToStorage
} from '../firebaseConfig';
import { AppContext, AppContextType } from './AppContext';
import confetti from 'canvas-confetti';
import { triggerHapticFeedback } from '../utils/telegramUtils';

const generateUniqueUID = async (): Promise<string> => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
};

const removeUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(removeUndefined);
    if (typeof obj === 'object') {
        if (obj.constructor !== Object) return obj;
        return Object.fromEntries(
            Object.entries(obj)
                .filter(([_, v]) => v !== undefined)
                .map(([k, v]) => [k, removeUndefined(v)])
        );
    }
    return obj;
};

import { DEFAULT_GET_STARTED_IMAGE, DEFAULT_LOGIN_SIGNUP_IMAGE } from './defaultImages';

const initialState: AppState = {
    availableTokens: DEFAULT_TOKENS,
    tokenConfigs: {},
    tokenLogos: {
        'BabyDoge': 'https://i.postimg.cc/htT87n8b/babydoge.jpg'
    },
    markets: [
        {
            id: 'SHIBUSHA',
            base: 'SHIB',
            quote: 'USHA',
            price: 0.000025,
            change24h: 1.5,
            volume: 0,
            candles: Array.from({ length: 50 }).map((_, i) => {
                const time = Date.now() - (50 - i) * 60000;
                const basePrice = 0.000025;
                const open = basePrice + (Math.random() - 0.5) * 0.000002;
                const close = open + (Math.random() - 0.5) * 0.000002;
                const high = Math.max(open, close) + Math.random() * 0.000001;
                const low = Math.min(open, close) - Math.random() * 0.000001;
                return { time: Math.floor(time / 60000) * 60000, open, high, low, close, volume: Math.random() * 1000000 };
            }),
            bids: [],
            asks: [],
            trades: []
        }
    ],
    videos: [],
    games: [],
    mineUpgrades: [],
    dailyComboCards: [],
    dailyCipherCode: '',
    dailySchedule: {},
    banners: [],
    promoCodes: [],
    youtubeTasks: [],
    telegramTasks: [],
    facebookTasks: [],
    instagramTasks: [],
    twitterTasks: [],
    tiktokTasks: [],
    appDownloadTasks: [],
    otherTasks: [],
    withdrawalSettings: {
        'BabyDoge': {
            minAmount: 1000000,
            dailyLimit: 500000000,
            exchangeName: 'MEXC',
            methodLabel: 'MEXC UID',
            network: 'BEP20',
            enabled: true,
            swapRate: 0,
            swapFee: 2,
            depositEnabled: false
        }
    },
    referralConfig: { amount: 100, token: 'USHA', enabled: true },
    airdropConfig: { title: 'Airdrop Coming Soon', description: 'Join our community to be eligible.', imageUrl: '', isActive: true, allowAddressSubmission: false },
    authConfig: {
        imageUrl: DEFAULT_GET_STARTED_IMAGE,
        authImageUrl: DEFAULT_LOGIN_SIGNUP_IMAGE, 
        welcomeTitle: 'Only Memes',
        welcomeHeadline: 'Earn crypto by watching videos and playing games',
        enableEmailAuth: true,
        enableGoogleAuth: true,
        enableFacebookAuth: false,
        maintenanceMode: false,
        maintenanceMessage: 'We are currently undergoing scheduled maintenance. Please check back later.'
    },
    adsConfig: { 
        enabled: true,
        adMobPublisherId: 'pub-1506885447459049', 
        bannerUnitId: 'ca-app-pub-1506885447459049/5436818912', 
        interstitialUnitId: 'ca-app-pub-1506885447459049/2810655571', 
        rewardedUnitId: 'ca-app-pub-1506885447459049/1672893795',
        rewardTitle: 'Watch Video Earn +1,000',
        rewardAmount: 1000,
        rewardToken: 'USHA'
    },
    currentUser: null,
    allUsers: [],
    isAdminView: false,
    imagePreview: { visible: false, imageUrl: '' },
    playingGame: null,
    theme: 'light',
    adModal: { visible: false, type: 'interstitial' },
    ushaPrice: 1,
    loading: true,
    exchanges: [
        { name: 'Binance', enabled: true },
        { name: 'MEXC', enabled: true },
        { name: 'Bitget', enabled: true },
        { name: 'Bybit', enabled: true }
    ],
    adminLogs: []
};

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'LOGIN_SUCCESS': return { ...state, currentUser: action.payload };
        case 'LOGOUT': return { ...state, currentUser: null, isAdminView: false };
        case 'SET_VIDEOS': return { ...state, videos: action.payload };
        case 'SET_GAMES': return { ...state, games: action.payload };
        case 'SET_YOUTUBE_TASKS': return { ...state, youtubeTasks: action.payload };
        case 'SET_TELEGRAM_TASKS': return { ...state, telegramTasks: action.payload };
        case 'SET_FACEBOOK_TASKS': return { ...state, facebookTasks: action.payload };
        case 'SET_INSTAGRAM_TASKS': return { ...state, instagramTasks: action.payload };
        case 'SET_TWITTER_TASKS': return { ...state, twitterTasks: action.payload };
        case 'SET_TIKTOK_TASKS': return { ...state, tiktokTasks: action.payload };
        case 'SET_APP_DOWNLOAD_TASKS': return { ...state, appDownloadTasks: action.payload };
        case 'SET_OTHER_TASKS': return { ...state, otherTasks: action.payload };
        case 'SET_BANNERS': return { ...state, banners: action.payload };
        case 'SET_PROMO_CODES': return { ...state, promoCodes: action.payload };
        case 'UPDATE_WITHDRAWAL_SETTINGS': return { ...state, withdrawalSettings: { ...state.withdrawalSettings, ...action.payload } };
        case 'UPDATE_REFERRAL_CONFIG': return { ...state, referralConfig: { ...state.referralConfig, ...action.payload } };
        case 'UPDATE_AIRDROP_CONFIG': return { ...state, airdropConfig: { ...state.airdropConfig, ...action.payload } };
        case 'UPDATE_AUTH_CONFIG': return { ...state, authConfig: { ...state.authConfig, ...action.payload } };
        case 'UPDATE_ADS_CONFIG': return { ...state, adsConfig: { ...state.adsConfig, ...action.payload } };
        case 'SET_AVAILABLE_TOKENS': return { ...state, availableTokens: action.payload };
        case 'SET_TOKEN_CONFIGS': return { ...state, tokenConfigs: action.payload };
        case 'UPDATE_TOKEN_LOGO': return { ...state, tokenLogos: { ...state.tokenLogos, [action.payload.token]: action.payload.url } };
        case 'SET_MINE_UPGRADES': return { ...state, mineUpgrades: action.payload };
        case 'SET_DAILY_SCHEDULE': return { ...state, dailySchedule: action.payload };
        case 'SET_ALL_USERS': return { ...state, allUsers: action.payload };
        case 'SET_ADMIN_LOGS': return { ...state, adminLogs: action.payload };
        case 'TOGGLE_VIEW': return { ...state, isAdminView: !state.isAdminView };
        case 'SHOW_IMAGE_PREVIEW': return { ...state, imagePreview: { visible: true, imageUrl: action.payload } };
        case 'HIDE_IMAGE_PREVIEW': return { ...state, imagePreview: { visible: false, imageUrl: '' } };
        case 'START_GAME': return { ...state, playingGame: action.payload };
        case 'END_GAME': return { ...state, playingGame: null };
        case 'TOGGLE_THEME': {
            const newTheme = state.theme === 'light' ? 'dark' : 'light';
            if (typeof document !== 'undefined') {
                document.documentElement.classList.toggle('dark', newTheme === 'dark');
            }
            return { ...state, theme: newTheme };
        }
        case 'REFRESH_USER_STATE':
            if (!state.currentUser) return state;
            return { ...state, currentUser: { ...state.currentUser, ...action.payload } };
        case 'SHOW_AD': return { ...state, adModal: { visible: true, type: action.payload } };
        case 'HIDE_AD': return { ...state, adModal: { visible: false, type: 'interstitial' } };
        case 'SET_MARKETS': return { ...state, markets: action.payload };
        case 'UPDATE_MARKET_PRICE':
            return {
                ...state,
                markets: state.markets.map(m => {
                    if (`${m.base}/${m.quote}` === action.payload.pair) {
                        const newPrice = action.payload.price;
                        const candles = m.candles || [];
                        const lastCandle = candles[candles.length - 1];
                        const newCandles = [...candles];
                        const now = Date.now();
                        const currentMinute = Math.floor(now / 60000) * 60000;
                        
                        if (!lastCandle || lastCandle.time !== currentMinute) {
                            newCandles.push({
                                time: currentMinute,
                                open: newPrice,
                                high: newPrice,
                                low: newPrice,
                                close: newPrice
                            });
                        } else {
                            newCandles[newCandles.length - 1] = {
                                ...lastCandle,
                                high: Math.max(lastCandle.high, newPrice),
                                low: Math.min(lastCandle.low, newPrice),
                                close: newPrice
                            };
                        }
                        
                        return {
                            ...m,
                            price: newPrice,
                            candles: newCandles
                        };
                    }
                    return m;
                })
            };
        case 'SET_USHA_PRICE': return { ...state, ushaPrice: action.payload };
        case 'SET_LOADING': return { ...state, loading: action.payload };
        case 'SET_EXCHANGES': return { ...state, exchanges: action.payload };
        default: return state;
    }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const adResolver = useRef<(() => void) | null>(null);

    const fetchVideos = async () => {
        try {
            const res = await axios.get("/api/videos");
            if (typeof res.data === 'string' && res.data.trim().startsWith('<')) {
                throw new Error("Received HTML content instead of JSON.");
            }
            dispatch({ type: 'SET_VIDEOS', payload: res.data });
        } catch (err: any) {
            console.warn("Backend /api/videos failed or blocked, falling back to direct Firestore fetch:", err.message);
            try {
                const snap = await getDocs(collection(db, "videos"));
                const list: Video[] = [];
                snap.forEach(docSnap => {
                    list.push({ id: docSnap.id, ...docSnap.data() } as any);
                });
                dispatch({ type: 'SET_VIDEOS', payload: list });
            } catch (fsErr: any) {
                console.error("Firestore direct fetch of videos failed too:", fsErr.message);
            }
        }
    };

    const fetchGames = async () => {
        try {
            const res = await axios.get("/api/games");
            if (typeof res.data === 'string' && res.data.trim().startsWith('<')) {
                throw new Error("Received HTML content instead of JSON.");
            }
            dispatch({ type: 'SET_GAMES', payload: res.data });
        } catch (err: any) {
            console.warn("Backend /api/games failed or blocked, falling back to direct Firestore fetch:", err.message);
            try {
                const snap = await getDocs(collection(db, "games"));
                const list: Game[] = [];
                snap.forEach(docSnap => {
                    list.push({ id: docSnap.id, ...docSnap.data() } as any);
                });
                dispatch({ type: 'SET_GAMES', payload: list });
            } catch (fsErr: any) {
                console.error("Firestore direct fetch of games failed too:", fsErr.message);
            }
        }
    };
    
    useEffect(() => {
        // Handle redirect result if we just returned from Google redirect
        const checkRedirectResult = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result?.user) {
                    console.log("Successfully signed in via Google redirect:", result.user.email);
                }
            } catch (err: any) {
                console.error("Firebase redirect result error:", err);
            } finally {
                try {
                    localStorage.removeItem('google_auth_redirecting');
                } catch (e) {}
            }
        };
        
        if (localStorage.getItem('google_auth_redirecting') === 'true') {
            checkRedirectResult();
        }

        const checkSignInLink = async () => {
            if (isSignInWithEmailLink(auth, window.location.href)) {
                let email = window.localStorage.getItem('emailForSignIn');
                if (!email) {
                    const urlParams = new URLSearchParams(window.location.search);
                    email = urlParams.get('email');
                }
                if (!email) {
                    email = window.prompt('Please enter your email to confirm sign-in:');
                }
                if (email) {
                    try {
                        dispatch({ type: 'SET_LOADING', payload: true });
                        await signInWithEmailLink(auth, email, window.location.href);
                        window.localStorage.removeItem('emailForSignIn');
                    } catch (err: any) {
                        console.error("Error signing in with email link:", err);
                    } finally {
                        dispatch({ type: 'SET_LOADING', payload: false });
                    }
                }
            }
        };
        checkSignInLink();

        let unsubUser: (() => void) | null = null;
        const unsubscribe = onAuthStateChangedWrapper(auth, async (user) => {
            if (user) {
                const isAdmin = user.email === 'balakumar7654@gmail.com';
                let userData: UserData;
                const userKey = user.email || user.uid;
                const userRef = doc(db, "users", userKey);
                try {
                    const userSnap = await getDoc(userRef);

                    if (userSnap && userSnap.exists()) {
                        userData = userSnap.data() as UserData;
                        if (!userData.balance['USHA'] || userData.balance['USHA'] < 100) {
                             userData.balance['USHA'] = (userData.balance['USHA'] || 0) + 10000;
                             await updateDoc(userRef, { balance: userData.balance });
                        }
                        userData.emailVerified = user.emailVerified;
                        userData.uid = user.uid;
                        userData.isAdmin = isAdmin; 
                        const updatePayload: any = { lastActive: new Date().toISOString(), emailVerified: user.emailVerified, uid: user.uid, isAdmin };
                        if (user.displayName) updatePayload.displayName = user.displayName;
                        else if (user.isAnonymous && !userData.displayName) updatePayload.displayName = 'Guest User';
                        if (user.photoURL) updatePayload.photoURL = user.photoURL;
                        await updateDoc(userRef, updatePayload);
                    } else {
                        const newUID = user.isAnonymous ? user.uid : await generateUniqueUID();
                        userData = {
                            uid: newUID,
                            email: user.email || user.uid,
                            displayName: user.displayName || (user.isAnonymous ? 'Guest User' : ''),
                            photoURL: user.photoURL || '',
                            isAdmin: isAdmin,
                            emailVerified: user.emailVerified,
                            balance: { 'USHA': 10000 },
                            videoProofs: {},
                            youtubeTaskProofs: {},
                            telegramTaskProofs: {},
                            facebookTaskProofs: {},
                            instagramTaskProofs: {},
                            twitterTaskProofs: {},
                            tiktokTaskProofs: {},
                            appDownloadTaskProofs: {},
                            otherTaskProofs: {},
                            depositProofs: {},
                            withdrawals: [],
                            referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                            referralStats: { totalReferrals: 0, totalEarned: {} },
                            notifications: [],
                            tapGameData: { 
                                score: 0, energy: 5000, remainingLimit: 0, lastUpdated: new Date().toISOString(), 
                                history: [], mineLevel: {}, dailyComboFound: [], dailyRewardStreak: 0, dailyBoosts: 3 
                            },
                            lastActive: new Date().toISOString()
                        };
                        await setDoc(userRef, userData);
                    }
                    if (userData.isBlocked) {
                        dispatch({ type: 'LOGOUT' });
                        await signOut(auth);
                        return;
                    }
                    dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
                    dispatch({ type: 'SET_LOADING', payload: false });
                    
                    if (unsubUser) unsubUser();
                    unsubUser = onSnapshot(userRef, (doc) => {
                        if (doc.exists()) {
                            const updated = doc.data() as UserData;
                            if (updated.isBlocked) {
                                dispatch({ type: 'LOGOUT' });
                                signOut(auth);
                                return;
                            }
                            dispatch({ type: 'REFRESH_USER_STATE', payload: updated });
                        }
                    }, (error: any) => {
                        console.error("User snapshot error:", error?.message || String(error));
                    });
                } catch (error: any) {
                    console.warn("Firestore user document loading failed (possibly database not provisioned in Firebase console). Using client fallback state:", error);
                    // Generate local fallback user state so the user is not stuck on loading forever
                    userData = {
                        uid: user.uid,
                        email: user.email || user.uid,
                        displayName: user.displayName || (user.isAnonymous ? 'Guest User' : ''),
                        photoURL: user.photoURL || '',
                        isAdmin: isAdmin,
                        emailVerified: user.emailVerified,
                        balance: { 'USHA': 10000 },
                        videoProofs: {},
                        youtubeTaskProofs: {},
                        telegramTaskProofs: {},
                        facebookTaskProofs: {},
                        instagramTaskProofs: {},
                        twitterTaskProofs: {},
                        tiktokTaskProofs: {},
                        appDownloadTaskProofs: {},
                        otherTaskProofs: {},
                        depositProofs: {},
                        withdrawals: [],
                        referralCode: user.uid.substring(0, 6).toUpperCase(),
                        referralStats: { totalReferrals: 0, totalEarned: {} },
                        notifications: [],
                        tapGameData: { 
                            score: 0, energy: 5000, remainingLimit: 0, lastUpdated: new Date().toISOString(), 
                            history: [], mineLevel: {}, dailyComboFound: [], dailyRewardStreak: 0, dailyBoosts: 3 
                        },
                        lastActive: new Date().toISOString()
                    };
                    dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
                    dispatch({ type: 'SET_LOADING', payload: false });
                }
            } else {
                if (unsubUser) {
                    unsubUser();
                    unsubUser = null;
                }
                dispatch({ type: 'LOGOUT' });
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        });
        return () => {
            if (unsubUser) unsubUser();
            unsubscribe();
        };
    }, []);

    // Telegram auto-login
    useEffect(() => {
        const initTelegram = async () => {
            if (typeof window === 'undefined') return;
            const tg = (window as any).Telegram?.WebApp;
            
            if (tg && tg.initData) {
                try {
                    const response = await axios.post('/api/auth/telegram', {
                        initData: tg.initData
                    });
                    
                    if (response.data && response.data.token) {
                        try {
                            await signInWithCustomToken(auth, response.data.token);
                        } catch (authErr) {
                            console.error("Firebase custom auth failed:", authErr);
                        }
                    }
                } catch (error) {
                    console.error("Telegram auto-login backend request failed:", error);
                }
            }
        };
        initTelegram();
    }, []);

    useEffect(() => {
        if (!state.currentUser) return;

        fetchVideos();
        fetchGames();

        const unsubVideos = () => {};
        const unsubGames = () => {};
        const unsubYoutube = onSnapshot(collection(db, "youtubeTasks"), (snap) => { const list: any[] = []; snap.forEach(d => list.push({ ...d.data(), id: d.id })); dispatch({ type: 'SET_YOUTUBE_TASKS', payload: list }); }, (e: any) => console.error(e?.message || String(e)));
        const unsubTelegram = onSnapshot(collection(db, "telegramTasks"), (snap) => { const list: any[] = []; snap.forEach(d => list.push({ ...d.data(), id: d.id })); dispatch({ type: 'SET_TELEGRAM_TASKS', payload: list }); }, (e: any) => console.error(e?.message || String(e)));
        const unsubFacebook = onSnapshot(collection(db, "facebookTasks"), (snap) => { const list: any[] = []; snap.forEach(d => list.push({ ...d.data(), id: d.id })); dispatch({ type: 'SET_FACEBOOK_TASKS', payload: list }); }, (e: any) => console.error(e?.message || String(e)));
        const unsubInstagram = onSnapshot(collection(db, "instagramTasks"), (snap) => { const list: any[] = []; snap.forEach(d => list.push({ ...d.data(), id: d.id })); dispatch({ type: 'SET_INSTAGRAM_TASKS', payload: list }); }, (e: any) => console.error(e?.message || String(e)));
        const unsubTwitter = onSnapshot(collection(db, "twitterTasks"), (snap) => { const list: any[] = []; snap.forEach(d => list.push({ ...d.data(), id: d.id })); dispatch({ type: 'SET_TWITTER_TASKS', payload: list }); }, (e: any) => console.error(e?.message || String(e)));
        const unsubTikTok = onSnapshot(collection(db, "tiktokTasks"), (snap) => { const list: any[] = []; snap.forEach(d => list.push({ ...d.data(), id: d.id })); dispatch({ type: 'SET_TIKTOK_TASKS', payload: list }); }, (e: any) => console.error(e?.message || String(e)));
        const unsubAppDL = onSnapshot(collection(db, "appDownloadTasks"), (snap) => { const list: any[] = []; snap.forEach(d => list.push({ ...d.data(), id: d.id })); dispatch({ type: 'SET_APP_DOWNLOAD_TASKS', payload: list }); }, (e: any) => console.error(e?.message || String(e)));
        const unsubOther = onSnapshot(collection(db, "otherTasks"), (snap) => { const list: any[] = []; snap.forEach(d => list.push({ ...d.data(), id: d.id })); dispatch({ type: 'SET_OTHER_TASKS', payload: list }); }, (e: any) => console.error(e?.message || String(e)));
        
        const unsubBanners = onSnapshot(collection(db, "banners"), (snap) => { const list: any[] = []; snap.forEach(d => list.push({ ...d.data(), id: d.id })); dispatch({ type: 'SET_BANNERS', payload: list }); }, (e: any) => console.error(e?.message || String(e)));
        const unsubPromos = onSnapshot(collection(db, "promoCodes"), (snap) => { const list: any[] = []; snap.forEach(d => list.push({ ...d.data(), id: d.id })); dispatch({ type: 'SET_PROMO_CODES', payload: list }); }, (e: any) => console.error(e?.message || String(e)));
        
        const unsubMarkets = onSnapshot(collection(db, "markets"), (snap) => {
            const list: MarketPair[] = [];
            snap.forEach(doc => list.push({ ...(doc.data() as MarketPair), id: doc.id }));
            dispatch({ type: 'SET_MARKETS', payload: list });
        }, (e: any) => console.error("markets snap error", e?.message || String(e)));

        const unsubConfigs = onSnapshot(collection(db, "configs"), (snap) => {
            snap.forEach(doc => {
                if (doc.id === 'withdrawals') dispatch({ type: 'UPDATE_WITHROLLER_SETTINGS' in state ? 'UPDATE_WITHROLLER_SETTINGS' : 'UPDATE_WITHDRAWAL_SETTINGS', payload: doc.data() as any });
                if (doc.id === 'referral') dispatch({ type: 'UPDATE_REFERRAL_CONFIG', payload: doc.data() as any });
                if (doc.id === 'airdrop') dispatch({ type: 'UPDATE_AIRDROP_CONFIG', payload: doc.data() as any });
                if (doc.id === 'auth') dispatch({ type: 'UPDATE_AUTH_CONFIG', payload: doc.data() as any });
                if (doc.id === 'ads') dispatch({ type: 'UPDATE_ADS_CONFIG', payload: doc.data() as any });
                if (doc.id === 'ushaPrice') dispatch({ type: 'SET_USHA_PRICE', payload: doc.data().value });
                if (doc.id === 'coins') {
                    const data = doc.data();
                    if (data.list) dispatch({ type: 'SET_AVAILABLE_TOKENS', payload: data.list });
                    if (data.configs) dispatch({ type: 'SET_TOKEN_CONFIGS', payload: data.configs });
                    if (data.logos) Object.entries(data.logos).forEach(([k, v]) => dispatch({ type: 'UPDATE_TOKEN_LOGO', payload: { token: k, url: v as string } }));
                }
                if (doc.id === 'dailySchedule') dispatch({ type: 'SET_DAILY_SCHEDULE', payload: doc.data() as any });
                if (doc.id === 'exchanges') dispatch({ type: 'SET_EXCHANGES', payload: doc.data().list || [] });
            });
        }, (e: any) => console.error("configs snap error", e?.message || String(e)));

        const unsubMine = onSnapshot(collection(db, "mineUpgrades"), (snap) => {
            const list: any[] = []; snap.forEach(d => list.push(d.data())); 
            dispatch({ type: 'SET_MINE_UPGRADES', payload: list });
        }, (e: any) => console.error("mineUpgrades snap error", e?.message || String(e)));

        let unsubAllUsers = () => {};
        let unsubAdminLogs = () => {};
        if (state.currentUser?.isAdmin) {
             unsubAllUsers = onSnapshot(collection(db, "users"), (snap) => {
                const list: UserData[] = [];
                snap.forEach(doc => {
                    const data = doc.data() as UserData;
                    list.push({ ...data, docId: doc.id });
                });
                dispatch({ type: 'SET_ALL_USERS', payload: list });
            }, (error: any) => {
                console.error("All users snapshot error:", error?.message || String(error));
            });

             unsubAdminLogs = onSnapshot(collection(db, "adminLogs"), (snap) => {
                const list: AdminLog[] = [];
                snap.forEach(doc => {
                    const data = doc.data();
                    list.push({
                        id: doc.id,
                        adminEmail: data.adminEmail || '',
                        action: data.action || '',
                        details: data.details || '',
                        timestamp: data.timestamp || ''
                    });
                });
                list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                dispatch({ type: 'SET_ADMIN_LOGS', payload: list });
            }, (error: any) => {
                console.error("Admin logs snapshot error:", error?.message || String(error));
            });
        }

        return () => {
            unsubVideos(); unsubGames(); unsubYoutube(); unsubTelegram(); unsubFacebook();
            unsubInstagram(); unsubTwitter(); unsubTikTok(); unsubAppDL();
            unsubBanners(); unsubPromos(); unsubMarkets(); unsubConfigs(); unsubMine(); unsubAllUsers(); unsubAdminLogs();
        };
    }, [state.currentUser, state.currentUser?.isAdmin]);

    const login = async (email: string, pass: string) => { 
        await signInWithEmailAndPassword(auth, email, pass); 
    };

    const register = async (email: string, pass: string) => {
        try {
            return await createUserWithEmailAndPassword(auth, email, pass);
        } catch (err: any) {
            const errMessage = err?.message || String(err);
            const code = err?.code || '';
            if (code === 'auth/email-already-in-use' || errMessage.includes('email-already-in-use')) {
                console.log("Email already in use during signup. Attempting automatic sign-in instead...");
                try {
                    return await signInWithEmailAndPassword(auth, email, pass);
                } catch (signInErr: any) {
                    console.warn("Automatic sign-in failed during signup:", signInErr);
                    const originalError = new Error("This email is already registered. Please sign in instead.");
                    (originalError as any).code = 'auth/email-already-in-use';
                    throw originalError;
                }
            }
            throw err;
        }
    };
    const sendSignInLink = async (email: string) => {
        try {
            const response = await axios.post('/api/auth/send-signin-link', { email });
            window.localStorage.setItem('emailForSignIn', email);
            return response.data;
        } catch (error: any) {
            console.error("sendSignInLink failed:", error);
            throw new Error(error.response?.data?.error || error.message || String(error));
        }
    };
    const loginWithGoogle = async () => { 
        const isIframe = typeof window !== 'undefined' && window.self !== window.top;
        const isNativeApp = typeof window !== 'undefined' && (
            window.location.protocol === 'capacitor:' || 
            window.location.protocol === 'file:' || 
            (window as any).Capacitor !== undefined
        );
        const isWebView = typeof navigator !== 'undefined' && /wv|WebView|Android.*Version\/[0-9.]+/i.test(navigator.userAgent);
        const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isIframe) {
            const err = new Error("Google Sign-In is restricted inside the preview pane iframe due to browser security restrictions. Please click 'Open in New Tab' to sign in.");
            (err as any).code = 'auth/iframe-sandbox-restriction';
            throw err;
        }

        if (isNativeApp || isWebView) {
            const err = new Error("Google Sign-In is restricted inside mobile native apps/WebViews due to Google's security policy. Please use an external web browser to sign in.");
            (err as any).code = 'auth/webview-restriction';
            throw err;
        }

        if (isMobile) {
            // Highly recommended for mobile browsers: redirect directly to avoid popup block/closed errors.
            try {
                localStorage.setItem('google_auth_redirecting', 'true');
            } catch (e) {}
            await signInWithRedirect(auth, googleProvider);
            return;
        }

        try {
            await signInWithPopup(auth, googleProvider); 
        } catch (popupErr: any) {
            console.warn("Google popup login failed/blocked, checking fallback options...", popupErr);

            if (popupErr?.code === 'auth/unauthorized-domain' || popupErr?.message?.includes('unauthorized-domain')) {
                throw popupErr;
            }

            // Fallback to redirect on desktop if popups are blocked or closed/cancelled before sign-in could finish
            if (
                popupErr?.code === 'auth/popup-blocked' ||
                popupErr?.code === 'auth/popup-closed-by-user' ||
                popupErr?.code === 'auth/cancelled-popup-request' ||
                popupErr?.code === 'auth/operation-not-supported-in-this-environment'
            ) {
                try {
                    localStorage.setItem('google_auth_redirecting', 'true');
                } catch (e) {}
                await signInWithRedirect(auth, googleProvider);
            } else {
                throw popupErr;
            }
        }
    };
    const loginWithFacebook = () => Promise.reject(new Error("Facebook Login not configured in this demo."));
    const loginAsGuest = async () => {
        try {
            const existingGuestId = localStorage.getItem('only_memes_guest_id');
            const res = await axios.post('/api/auth/guest', { guestId: existingGuestId || undefined });
            if (res.data && res.data.success && res.data.token) {
                const { token, guestId } = res.data;
                localStorage.setItem('only_memes_guest_id', guestId);
                await signInWithCustomToken(auth, token);
            } else {
                throw new Error(res.data?.error || "Failed to obtain guest login token from server.");
            }
        } catch (err: any) {
            console.error("Guest login failed, trying anonymous fallback:", err);
            try {
                await signInAnonymously(auth);
            } catch (fallbackErr) {
                console.error("Guest fallback anonymous sign in also failed:", fallbackErr);
                throw err;
            }
        }
    };
    const logout = () => signOut(auth).then(() => {
        dispatch({ type: 'LOGOUT' });
        dispatch({ type: 'SET_LOADING', payload: false });
    });
    const resendVerificationEmail = async () => {
        if (auth.currentUser && auth.currentUser.email) {
            try {
                await axios.post('/api/auth/send-verification-email', { email: auth.currentUser.email });
            } catch (err) {
                console.warn("Custom verification email endpoint failed. Falling back to standard Firebase verification", err);
                await sendEmailVerification(auth.currentUser);
            }
        }
    };
    const resetPassword = async (email: string) => { await sendPasswordResetEmail(auth, email); };
    const reloadUser = async () => { if (auth.currentUser) await reload(auth.currentUser); };

    const uploadProofAttachment = async (file: File): Promise<string> => {
        if (!state.currentUser) throw new Error("Must be logged in to upload.");
        const userId = state.currentUser.uid || state.currentUser.email.replace(/[^a-zA-Z0-9]/g, '_');
        const timestamp = Date.now();
        const extension = file.name.split('.').pop() || 'jpg';
        const path = `proofs/${userId}/${timestamp}.${extension}`;
        return uploadFileToStorage(file, path);
    };

    const _getProofField = (taskType: string) => {
        if (taskType === 'video') return 'videoProofs';
        if (taskType === 'youtube') return 'youtubeTaskProofs';
        if (taskType === 'telegram') return 'telegramTaskProofs';
        if (taskType === 'facebook') return 'facebookTaskProofs';
        if (taskType === 'instagram') return 'instagramTaskProofs';
        if (taskType === 'twitter') return 'twitterTaskProofs';
        if (taskType === 'tiktok') return 'tiktokTaskProofs';
        if (taskType === 'app_download' || taskType === 'appDownload') return 'appDownloadTaskProofs';
        if (taskType === 'other') return 'otherTaskProofs';
        return 'videoProofs'; 
    };

    const startTask = async (taskId: string, title: string, taskType: string) => {
        if (!state.currentUser) return;
        const field = _getProofField(taskType);
        const proof: Proof = {
            proofUrl: '',
            status: 'started',
            taskTitle: title,
            reward: 0,
            rewardToken: 'USHA',
            submittedAt: new Date().toISOString(),
            startedAt: new Date().toISOString()
        };
        const userRef = doc(db, "users", state.currentUser.email);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const userData = userSnap.data();
            const currentProofs = userData[field] || {};
            if (!currentProofs[taskId] || (currentProofs[taskId].status !== 'claimed' && currentProofs[taskId].status !== 'approved')) {
                const updatedProofs = { ...currentProofs, [taskId]: proof };
                await updateDoc(userRef, { [field]: updatedProofs });
            }
        }
    };

    const cancelTask = async (taskId: string, taskType: string) => {
        if (!state.currentUser) return;
        const field = _getProofField(taskType);
        const userRef = doc(db, "users", state.currentUser.email);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const userData = userSnap.data();
            const currentProofs = userData[field] || {};
            if (currentProofs[taskId] && currentProofs[taskId].status === 'started') {
                const updatedProofs = { ...currentProofs };
                delete updatedProofs[taskId];
                await updateDoc(userRef, { [field]: updatedProofs });
            }
        }
    };

    const _submitProof = async (proofType: string, id: string, title: string, proofUrl: string, reward: number, token: Token, code?: string, status: Proof['status'] = 'pending') => {
        if (!state.currentUser) return;
        const userRef = doc(db, "users", state.currentUser.email);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const userData = userSnap.data();
            const currentProofs = userData[proofType] || {};
            const existingProof = currentProofs[id] || {};
            const proof: Proof = {
                ...existingProof,
                proofUrl,
                codeSubmitted: code,
                status,
                taskTitle: title,
                reward,
                rewardToken: token,
                submittedAt: new Date().toISOString()
            };
            const updatedProofs = { ...currentProofs, [id]: proof };
            await updateDoc(userRef, removeUndefined({ [proofType]: updatedProofs }));
        }
    };

    const submitVideoProof = (id: string, t: string, url: string, r: number, c: Token, code?: string, status?: Proof['status']) => _submitProof('videoProofs', id, t, url, r, c, code, status);
    const submitYouTubeProof = (id: string, t: string, url: string, r: number, c: Token, code?: string, status?: Proof['status']) => _submitProof('youtubeTaskProofs', id, t, url, r, c, code, status);
    const submitFacebookProof = (id: string, t: string, url: string, r: number, c: Token, code?: string, status?: Proof['status']) => _submitProof('facebookTaskProofs', id, t, url, r, c, code, status);
    const submitInstagramProof = (id: string, t: string, url: string, r: number, c: Token, code?: string, status?: Proof['status']) => _submitProof('instagramTaskProofs', id, t, url, r, c, code, status);
    const submitTwitterProof = (id: string, t: string, url: string, r: number, c: Token, code?: string, status?: Proof['status']) => _submitProof('twitterTaskProofs', id, t, url, r, c, code, status);
    const submitTikTokProof = (id: string, t: string, url: string, r: number, c: Token, code?: string, status?: Proof['status']) => _submitProof('tiktokTaskProofs', id, t, url, r, c, code, status);
    const submitAppDownloadProof = (id: string, t: string, url: string, r: number, c: Token, code?: string, status?: Proof['status']) => _submitProof('appDownloadTaskProofs', id, t, url, r, c, code, status);
    const submitOtherProof = (id: string, t: string, url: string, r: number, c: Token, code?: string, status?: Proof['status']) => _submitProof('otherTaskProofs', id, t, url, r, c, code, status);
    const submitDepositProof = (id: string, t: string, url: string, r: number, c: Token) => _submitProof('depositProofs', id, t, url, r, c);

    const initiateWithdrawal = async (address: string, token: Token, amount: number, method: Withdrawal['method'], exchange?: string, gameUid?: string, uidScreenshotUrl?: string): Promise<string> => {
        if (!state.currentUser) throw new Error("Not logged in");

        // Validate gameUid uniqueness via server proxy if gameUid is specified
        if (gameUid) {
            try {
                const response = await axios.post('/api/withdraw/check-uid', { uid: gameUid, email: state.currentUser.email });
                if (response.data && response.data.exists) {
                    throw new Error("This UID already exists and is linked to another account.");
                }
            } catch (err: any) {
                if (err.message === "This UID already exists and is linked to another account.") {
                    throw err;
                }
                console.error("Failed to verify UID uniqueness:", err);
            }
        }

        const withdrawal: Withdrawal = { 
            id: Date.now().toString(), 
            amount, 
            recipientAddress: address, 
            timestamp: new Date().toISOString(), 
            status: 'pending', 
            token, 
            method, 
            exchange,
            gameUid,
            uidScreenshotUrl
        };
        const newBalance = (state.currentUser.balance[token] || 0) - amount;
        if (newBalance < 0) throw new Error("Insufficient balance");
        const userRef = doc(db, "users", state.currentUser.email);

        const tapGameData = state.currentUser.tapGameData || {};
        const history = tapGameData.history || [];
        const newTx = {
            id: Date.now(),
            type: 'Withdraw' as const,
            amount: amount.toLocaleString(),
            token,
            date: new Date().toISOString(),
            isPositive: false
        };

        const updateData: any = {
            withdrawals: [...state.currentUser.withdrawals, withdrawal],
            [`balance.${token}`]: newBalance,
            tapGameData: {
                ...tapGameData,
                history: [...history, newTx]
            }
        };

        if (gameUid) {
            updateData.gameUid = gameUid;
        }
        if (uidScreenshotUrl) {
            updateData.uidScreenshotUrl = uidScreenshotUrl;
        }

        await updateDoc(userRef, removeUndefined(updateData));
        return withdrawal.id;
    };

    const swapBalance = async (from: Token, to: Token, amount: number, received: number) => {
        if (!state.currentUser) return;
        const currentFrom = state.currentUser.balance[from] || 0;
        if (currentFrom < amount) throw new Error("Insufficient balance");
        const currentTo = state.currentUser.balance[to] || 0;
        const userRef = doc(db, "users", state.currentUser.email);

        const tapGameData = state.currentUser.tapGameData || {};
        const history = tapGameData.history || [];
        const fromTx = {
            id: Date.now(),
            type: 'Swap' as const,
            amount: amount.toLocaleString(),
            token: from,
            date: new Date().toISOString(),
            isPositive: false
        };
        const toTx = {
            id: Date.now() + 1,
            type: 'Swap' as const,
            amount: received.toLocaleString(),
            token: to,
            date: new Date().toISOString(),
            isPositive: true
        };

        await updateDoc(userRef, {
            [`balance.${from}`]: currentFrom - amount,
            [`balance.${to}`]: currentTo + received,
            tapGameData: {
                ...tapGameData,
                history: [...history, fromTx, toTx]
            }
        });
    };

    const applyReferralCode = async (code: string) => {
        if (!state.currentUser) throw new Error("Not logged in.");
        const q = query(collection(db, "users"), where("referralCode", "==", code));
        const snap = await getDocs(q);
        if (snap.empty) throw new Error("Invalid referral code.");
        const referrerDoc = snap.docs[0];
        const referrerData = referrerDoc.data() as UserData;
        const userRef = doc(db, "users", state.currentUser.email);
        await updateDoc(userRef, { referredByEmail: referrerData.email });
        await reloadUser();
    };

    const redeemPromoCode = async (code: string) => {
        if (!state.currentUser) throw new Error("Not logged in");
        const promo = state.promoCodes.find(p => p.code === code);
        if (!promo) throw new Error("Invalid code");
        const userRef = doc(db, "users", state.currentUser.email);
        await updateDoc(userRef, { [`balance.${promo.rewardToken}`]: (state.currentUser.balance[promo.rewardToken] || 0) + promo.reward });
        return { reward: promo.reward, token: promo.rewardToken };
    };

    const updateTapGameData = useCallback(async (data: any) => {
        if (!state.currentUser?.email) return;
        const userRef = doc(db, "users", state.currentUser.email);
        await updateDoc(userRef, removeUndefined({ tapGameData: data })).catch(e => console.warn("Failed to save game data", e));
    }, [state.currentUser]);

    const submitAirdropAddress = async (addr: string) => {
        if (!state.currentUser) return;
        const userRef = doc(db, "users", state.currentUser.email);
        await updateDoc(userRef, { airdropAddress: addr });
    };

    const updateProfile = async (displayName: string, photoURL: string) => {
        if (!state.currentUser) return;
        const userRef = doc(db, "users", state.currentUser.email);
        await updateDoc(userRef, { displayName, photoURL });
    };

    const updatePassword = async (curr: string, newPass: string) => {
        alert("Password update check.");
    };

    const getProofUrl = async (url: string) => url; 

    const getLeaderboard = useCallback(() => {
        return state.allUsers.map(u => ({ email: u.email, balance: u.tapGameData?.score || 0 })).sort((a, b) => b.balance - a.balance).slice(0, 100);
    }, [state.allUsers]);

    const notifyNewTask = async (title: string, body: string) => {
        try {
            await fetch('/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: 'all_users',
                    title,
                    body
                })
            });
        } catch (e) {
            console.error('Failed to notify new task', e);
        }
    };

    const logAdminAction = async (action: string, details: string) => {
        try {
            const adminEmail = state.currentUser?.email || 'unknown_admin';
            await addDoc(collection(db, "adminLogs"), {
                adminEmail,
                action,
                details,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            console.error("Failed to log admin action:", err);
        }
    };

    const _addDoc = async (col: string, data: any) => {
        await setDoc(doc(db, col, data.id), removeUndefined(data));
        if (col.toLowerCase().includes('task') || col.toLowerCase().includes('video')) {
            await notifyNewTask('New Task Available!', `Check out the new task: ${data.title || 'Earn more rewards'}`);
        }
        const actionType = col.endsWith('Tasks') ? `ADD_OR_UPDATE_TASK` : `ADD_OR_UPDATE_${col.toUpperCase()}`;
        await logAdminAction(actionType, `Saved entry to collection "${col}" with ID "${data.id}" (${data.title || data.name || 'no title'})`);
    };
    const _delDoc = async (col: string, id: string) => {
        await deleteDoc(doc(db, col, id));
        const actionType = col.endsWith('Tasks') ? `REMOVE_TASK` : `REMOVE_${col.toUpperCase()}`;
        await logAdminAction(actionType, `Deleted entry from collection "${col}" with ID "${id}"`);
    };
    
    const addVideo = async (v: Video) => {
        await axios.post("/api/videos", v);
        await fetchVideos();
        await notifyNewTask('New Video Available!', `Watch and earn: ${v.title || 'New Video'}`);
        await logAdminAction('ADD_VIDEO', `Added new video: ${v.title || v.id}`);
    };
    const removeVideo = async (id: string) => {
        await axios.delete(`/api/videos/${id}`);
        await fetchVideos();
        await logAdminAction('REMOVE_VIDEO', `Removed video with ID: ${id}`);
    };
    const addGame = async (g: Game) => {
        await axios.post("/api/games", g);
        await fetchGames();
        await logAdminAction('ADD_GAME', `Added new game: ${g.title || g.id}`);
    };
    const updateGame = async (g: Game) => {
        await axios.post("/api/games", g);
        await fetchGames();
        await logAdminAction('UPDATE_GAME', `Updated game: ${g.title || g.id}`);
    };
    const removeGame = async (id: string) => {
        await axios.delete(`/api/games/${id}`);
        await fetchGames();
        await logAdminAction('REMOVE_GAME', `Removed game with ID: ${id}`);
    };
    const addBanner = (b: Banner) => _addDoc("banners", b);
    const updateBanner = (b: Banner) => _addDoc("banners", b);
    const removeBanner = (id: string) => _delDoc("banners", id);
    const addPromoCode = (p: PromoCode) => _addDoc("promoCodes", p);
    const removePromoCode = (id: string) => _delDoc("promoCodes", id);

    const addYouTubeTask = (t: YouTubeTask) => _addDoc("youtubeTasks", t);
    const updateYouTubeTask = (t: YouTubeTask) => _addDoc("youtubeTasks", t);
    const removeYouTubeTask = (id: string) => _delDoc("youtubeTasks", id);
    const addFacebookTask = (t: FacebookTask) => _addDoc("facebookTasks", t);
    const updateFacebookTask = (t: FacebookTask) => _addDoc("facebookTasks", t);
    const removeFacebookTask = (id: string) => _delDoc("facebookTasks", id);
    const addInstagramTask = (t: InstagramTask) => _addDoc("instagramTasks", t);
    const updateInstagramTask = (t: InstagramTask) => _addDoc("instagramTasks", t);
    const removeInstagramTask = (id: string) => _delDoc("instagramTasks", id);
    const addTwitterTask = (t: TwitterTask) => _addDoc("twitterTasks", t);
    const updateTwitterTask = (t: TwitterTask) => _addDoc("twitterTasks", t);
    const removeTwitterTask = (id: string) => _delDoc("twitterTasks", id);
    const addTikTokTask = (t: TikTokTask) => _addDoc("tiktokTasks", t);
    const updateTikTokTask = (t: TikTokTask) => _addDoc("tiktokTasks", t);
    const removeTikTokTask = (id: string) => _delDoc("tiktokTasks", id);
    const addAppDownloadTask = (t: AppDownloadTask) => _addDoc("appDownloadTasks", t);
    const updateAppDownloadTask = (t: AppDownloadTask) => _addDoc("appDownloadTasks", t);
    const removeAppDownloadTask = (id: string) => _delDoc("appDownloadTasks", id);
    const addOtherTask = (t: OtherTask) => _addDoc("otherTasks", t);
    const updateOtherTask = (t: OtherTask) => _addDoc("otherTasks", t);
    const removeOtherTask = (id: string) => _delDoc("otherTasks", id);

    const adminUpdateUshaPrice = async (price: number) => {
        if (!state.currentUser?.isAdmin) throw new Error("Unauthorized");
        await setDoc(doc(db, "configs", "ushaPrice"), { value: price });
        await logAdminAction('UPDATE_USHA_PRICE', `Updated USHA price to $${price}`);
    };

    const adminUpdateWithdrawalSettings = async (s: any) => {
        await setDoc(doc(db, "configs", "withdrawals"), removeUndefined(s));
        await logAdminAction('UPDATE_WITHDRAWAL_SETTINGS', `Updated system withdrawal settings`);
    };
    const adminUpdateReferralConfig = async (c: any) => {
        await setDoc(doc(db, "configs", "referral"), removeUndefined(c));
        await logAdminAction('UPDATE_REFERRAL_CONFIG', `Updated system referral config`);
    };
    const adminUpdateAirdropConfig = async (c: any) => {
        await setDoc(doc(db, "configs", "airdrop"), removeUndefined(c));
        await logAdminAction('UPDATE_AIRDROP_CONFIG', `Updated system airdrop config`);
    };
    const adminUpdateAuthConfig = async (c: any) => {
        await setDoc(doc(db, "configs", "auth"), removeUndefined(c));
        await logAdminAction('UPDATE_AUTH_CONFIG', `Updated verification/auth settings`);
    };
    const adminUpdateAdsConfig = async (c: any) => {
        await setDoc(doc(db, "configs", "ads"), removeUndefined(c));
        await logAdminAction('UPDATE_ADS_CONFIG', `Updated advertisement and rewarded video configs`);
    };
    
    const addToken = async (c: string, name?: string) => {
        const list = [...state.availableTokens, c];
        const configs = { ...state.tokenConfigs, [c]: { symbol: c, name: name || c, logoUrl: state.tokenLogos[c] || '' } };
        await setDoc(doc(db, "configs", "coins"), { list, configs }, { merge: true });
        await logAdminAction('ADD_TOKEN', `Listed new token ${name || c} (${c})`);

        try {
            await fetch('/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: 'all_users',
                    title: '🔥 New Meme Coin Available!',
                    body: `The new high-paying meme token ${name || c} (${c}) has been listed. Join now to watch and earn!`
                })
            });
        } catch (err) {
            console.error("Failed to send new token push notification:", err);
        }
    };
    const updateTokenName = async (c: string, name: string) => {
        const configs = { ...state.tokenConfigs, [c]: { ...state.tokenConfigs[c], symbol: c, name: name } };
        await setDoc(doc(db, "configs", "coins"), { configs }, { merge: true });
        await logAdminAction('UPDATE_TOKEN_NAME', `Renamed token ${c} to "${name}"`);
    };
    const removeToken = async (c: string) => {
        const list = state.availableTokens.filter(x => x !== c);
        const configs = { ...state.tokenConfigs };
        delete configs[c];
        await setDoc(doc(db, "configs", "coins"), { list, configs }, { merge: true });
        await logAdminAction('REMOVE_TOKEN', `De-listed/Removed token ${c}`);
    };
    const updateTokenLogo = async (c: string, url: string) => {
        const ref = doc(db, "configs", "coins");
        const snap = await getDoc(ref);
        if (snap.exists()) {
            await updateDoc(ref, { [`logos.${c}`]: url });
        } else {
            await setDoc(ref, { list: DEFAULT_TOKENS, logos: { [c]: url } });
        }
        await logAdminAction('UPDATE_TOKEN_LOGO', `Updated logo URL for token ${c}`);
    };
    
    const addMineUpgrade = (u: MineUpgrade) => _addDoc("mineUpgrades", u);
    const updateMineUpgrade = (u: MineUpgrade) => _addDoc("mineUpgrades", u);
    const removeMineUpgrade = (id: string) => _delDoc("mineUpgrades", id);
    
    const updateDailySchedule = async (date: string, cipher: string, combo: string[], cipherReward?: number, comboReward?: number) => {
        const config: DailyConfig = { cipher, combo, cipherReward, comboReward };
        const schedule = { ...state.dailySchedule, [date]: config };
        await setDoc(doc(db, "configs", "dailySchedule"), removeUndefined(schedule));
        await logAdminAction('UPDATE_DAILY_SCHEDULE', `Updated daily schedule for date ${date}`);
    };

    const getUserRef = async (emailOrId: string) => {
        let userRef = doc(db, "users", emailOrId);
        let userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return { userRef, userSnap, data: userSnap.data() as UserData };
        }
        
        const match = state.allUsers.find(u => 
            u.docId === emailOrId || 
            u.email === emailOrId || 
            u.uid === emailOrId
        );
        if (match && match.docId && match.docId !== emailOrId) {
            userRef = doc(db, "users", match.docId);
            userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                return { userRef, userSnap, data: userSnap.data() as UserData };
            }
        }
        
        return { userRef, userSnap, data: null };
    };

    const adminDeleteUser = async (emailOrId: string) => {
        if (!state.currentUser?.isAdmin) throw new Error("Unauthorized");
        const { userRef, userSnap, data } = await getUserRef(emailOrId);
        if (userSnap.exists()) {
            const docId = userSnap.id;
            const userEmail = data?.email || docId;
            await deleteDoc(userRef);
            await logAdminAction('DELETE_USER', `Deleted user account ${userEmail} (docId: ${docId})`);
        } else {
            throw new Error(`Could not find user document to delete: ${emailOrId}`);
        }
    };

    const adminUpdateTaskProofStatus = async (email: string, taskId: string, type: string, status: Proof['status']) => {
        const { userRef, userSnap, data: u } = await getUserRef(email);
        if (!u) return;
        const field = _getProofField(type);
        const proofs = u[field as keyof UserData] as Record<string, Proof> || {};
        const proof = proofs[taskId];
        if (!proof) return;

        const isRefAlreadyApproved = proof.status === 'approved' || proof.status === 'claimed';
        const updateData: any = {
            [field]: { ...proofs, [taskId]: { ...proof, status } }
        };

        if (type === 'deposit' && status === 'approved' && !isRefAlreadyApproved) {
            const depositAmount = proof.reward || 0;
            const token = proof.rewardToken || 'USHA';
            const currentBalance = u.balance?.[token] || 0;
            updateData[`balance.${token}`] = currentBalance + depositAmount;

            const tapGameData = u.tapGameData || {};
            const history = tapGameData.history || [];
            const newTx = {
                id: Date.now(),
                type: 'Deposit' as const,
                amount: depositAmount.toLocaleString(),
                token,
                date: new Date().toISOString(),
                isPositive: true
            };
            updateData.tapGameData = {
                ...tapGameData,
                history: [...history, newTx]
            };
        }

        await updateDoc(userRef, updateData);

        const actionName = status === 'approved' ? 'APPROVE_PROOF' : 'REJECT_PROOF';
        await logAdminAction(actionName, `${status === 'approved' ? 'Approved' : 'Rejected'} proof for task "${proof.taskTitle || taskId}" (type: ${type}) submitted by user ${email}`);

        if (status === 'approved' || status === 'rejected') {
            const isApproved = status === 'approved';
            const title = isApproved ? '🏆 Task Approved!' : '❌ Task Proof Rejected';
            const body = isApproved 
                ? `Your proof for "${proof.taskTitle || 'Task'}" was approved! +${proof.reward || 0} ${proof.rewardToken || 'USHA'}`
                : `Your proof for "${proof.taskTitle || 'Task'}" was rejected by the admin.`;
            try {
                await fetch('/api/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uid: email,
                        title,
                        body
                    })
                });
            } catch (err) {
                console.error("Failed to send task push notification:", err);
            }
        }
    };

    const adminApproveProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'video', 'approved');
    const adminRejectProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'video', 'rejected');
    const adminApproveYouTubeProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'youtube', 'approved');
    const adminRejectYouTubeProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'youtube', 'rejected');
    const adminApproveFacebookProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'facebook', 'approved');
    const adminRejectFacebookProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'facebook', 'rejected');
    const adminApproveInstagramProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'instagram', 'approved');
    const adminRejectInstagramProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'instagram', 'rejected');
    const adminApproveTwitterProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'twitter', 'approved');
    const adminRejectTwitterProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'twitter', 'rejected');
    const adminApproveTikTokProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'tiktok', 'approved');
    const adminRejectTikTokProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'tiktok', 'rejected');
    const adminApproveAppDownloadProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'app_download', 'approved');
    const adminRejectAppDownloadProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'app_download', 'rejected');
    const adminApproveOtherProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'other', 'approved');
    const adminRejectOtherProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'other', 'rejected');
    const adminApproveDepositProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'deposit', 'approved');
    const adminRejectDepositProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'deposit', 'rejected');

    const adminRemoveProof = async (email: string, taskId: string, type: string) => {
        const field = _getProofField(type);
        const { userRef, data } = await getUserRef(email);
        if (data) {
            const proofs = data[field] || {};
            delete proofs[taskId];
            await updateDoc(userRef, { [field]: proofs });
            await logAdminAction('REMOVE_PROOF', `Removed proof for task "${taskId}" (type: ${type}) for user ${email}`);
        }
    };

    const adminUpdateWithdrawalStatus = async (email: string, id: string, status: Withdrawal['status']) => {
        const { userRef, data } = await getUserRef(email);
        if (data) {
            const withdrawal = data.withdrawals.find(w => w.id === id);
            if (!withdrawal) return;

            const isRefunding = status === 'rejected' && withdrawal.status !== 'rejected';
            const updated = data.withdrawals.map(w => w.id === id ? { ...w, status } : w);
            const updatePayload: any = { withdrawals: updated };

            if (isRefunding) {
                const token = withdrawal.token;
                const currentBalance = data.balance?.[token] || 0;
                updatePayload[`balance.${token}`] = currentBalance + withdrawal.amount;

                // Add a Refund transaction to history
                const tapGameData = data.tapGameData || {};
                const history = tapGameData.history || [];
                const newTx = {
                    id: Date.now(),
                    type: 'Refund' as const,
                    amount: withdrawal.amount.toLocaleString(),
                    token,
                    date: new Date().toISOString(),
                    isPositive: true
                };
                updatePayload.tapGameData = {
                    ...tapGameData,
                    history: [...history, newTx]
                };
            }

            await updateDoc(userRef, updatePayload);

            await logAdminAction('UPDATE_WITHDRAWAL_STATUS', `Updated withdrawal status for ${email} to "${status}" (Withdrawal ID: ${id})`);
            
            // Send push notification when processed
            if (status === 'completed' || status === 'rejected' || status === 'processing') {
                try {
                    await fetch('/api/notify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            uid: email,
                            title: 'Withdrawal Update',
                            body: `Your withdrawal request is now ${status}.`
                        })
                    });
                } catch (err) {
                    console.error('Failed to send push notification', err);
                }
            }
        }
    };

    const adminToggleUserBlock = async (email: string, block: boolean) => {
        const { userRef } = await getUserRef(email);
        await updateDoc(userRef, { isBlocked: block });
        await logAdminAction(block ? 'BLOCK_USER' : 'UNBLOCK_USER', `${block ? 'Blocked' : 'Unblocked'} user ${email}`);
    };

    const adminUpdateUserBalance = async (email: string, token: string, newBalance: number) => {
        const { userRef } = await getUserRef(email);
        await updateDoc(userRef, { [`balance.${token}`]: newBalance });
        await logAdminAction('UPDATE_USER_BALANCE', `Updated user ${email}'s balance of ${token} to ${newBalance}`);
    };

    const adminUpdateExchanges = async (list: { name: string; enabled: boolean }[]) => {
        if (!state.currentUser?.isAdmin) throw new Error("Unauthorized");
        await setDoc(doc(db, "configs", "exchanges"), { list });
        await logAdminAction('UPDATE_EXCHANGES', `Updated available system exchanges configurations`);
    };

    const adminApproveUserUid = async (email: string, verifiedUid: string, exchangeName?: string) => {
        if (!state.currentUser?.isAdmin) throw new Error("Unauthorized");
        
        const cleanUid = verifiedUid.trim();
        // Check if another user already has this UID in exchangeUids or gameUid
        const duplicateUser = state.allUsers.find(u => {
            if (u.email === email) return false;
            if (u.gameUid && u.gameUid.trim() === cleanUid) return true;
            if (u.exchangeUids && Object.values(u.exchangeUids).some(v => v && v.trim() === cleanUid)) return true;
            return false;
        });

        if (duplicateUser) {
            throw new Error(`The UID "${cleanUid}" is already verified or registered by another user (${duplicateUser.email}).`);
        }

        const { userRef, data } = await getUserRef(email);
        if (data) {
            const exchangeUids = { ...(data.exchangeUids || {}) };
            const targetExchange = exchangeName || data.pendingExchange;
            
            if (targetExchange) {
                exchangeUids[targetExchange] = verifiedUid;
            } else {
                state.exchanges.forEach(exch => {
                    exchangeUids[exch.name] = verifiedUid;
                });
            }
            
            const pendingExchangeUids = { ...(data.pendingExchangeUids || {}) };
            const pendingExchangeScreenshots = { ...(data.pendingExchangeScreenshots || {}) };
            if (targetExchange) {
                delete pendingExchangeUids[targetExchange];
                delete pendingExchangeScreenshots[targetExchange];
            }

            const hasMorePending = Object.keys(pendingExchangeUids).length > 0;
            let nextPendingExchange = "";
            let nextGameUid = "";
            let nextUidScreenshotUrl = "";
            if (hasMorePending) {
                const nextExchName = Object.keys(pendingExchangeUids)[0];
                nextPendingExchange = nextExchName;
                nextGameUid = pendingExchangeUids[nextExchName];
                nextUidScreenshotUrl = pendingExchangeScreenshots[nextExchName] || "";
            }

            await updateDoc(userRef, {
                isUidVerified: true,
                gameUid: nextGameUid || verifiedUid,
                uidScreenshotUrl: nextUidScreenshotUrl || data.uidScreenshotUrl || "",
                exchangeUids: exchangeUids,
                pendingExchange: nextPendingExchange,
                pendingExchangeUids: pendingExchangeUids,
                pendingExchangeScreenshots: pendingExchangeScreenshots
            });

            await logAdminAction('APPROVE_UID', `Approved UID verification for ${email} (${targetExchange || 'default exchange'}: ${verifiedUid})`);

            await addNotification(email, {
                title: "🏆 Exchange UID Verified",
                message: `Your UID (${verifiedUid}) for ${targetExchange || 'selected exchange'} has been successfully verified! You can now proceed with withdrawals.`,
                type: "uid"
            });
        }
    };

    const adminRejectUserUid = async (email: string, exchangeName?: string) => {
        if (!state.currentUser?.isAdmin) throw new Error("Unauthorized");
        const { userRef, data } = await getUserRef(email);
        if (data) {
            const targetExchange = exchangeName || data.pendingExchange || "";
            
            const exchangeUids = { ...(data.exchangeUids || {}) };
            const hasOtherVerified = Object.keys(exchangeUids).length > 0;

            const pendingExchangeUids = { ...(data.pendingExchangeUids || {}) };
            const pendingExchangeScreenshots = { ...(data.pendingExchangeScreenshots || {}) };
            if (targetExchange) {
                delete pendingExchangeUids[targetExchange];
                delete pendingExchangeScreenshots[targetExchange];
            }

            const hasMorePending = Object.keys(pendingExchangeUids).length > 0;
            let nextPendingExchange = "";
            let nextGameUid = "";
            let nextUidScreenshotUrl = "";
            if (hasMorePending) {
                const nextExchName = Object.keys(pendingExchangeUids)[0];
                nextPendingExchange = nextExchName;
                nextGameUid = pendingExchangeUids[nextExchName];
                nextUidScreenshotUrl = pendingExchangeScreenshots[nextExchName] || "";
            }

            const rejectedExchangeUids = { ...(data.rejectedExchangeUids || {}) };
            if (targetExchange) {
                rejectedExchangeUids[targetExchange] = true;
            }

            await updateDoc(userRef, {
                gameUid: nextGameUid,
                uidScreenshotUrl: nextUidScreenshotUrl,
                pendingExchange: nextPendingExchange,
                isUidVerified: hasOtherVerified,
                pendingExchangeUids: pendingExchangeUids,
                pendingExchangeScreenshots: pendingExchangeScreenshots,
                rejectedExchangeUids: rejectedExchangeUids
            });

            await logAdminAction('REJECT_UID', `Rejected UID verification request for ${email} (${targetExchange || 'pending exchange'})`);

            await addNotification(email, {
                title: "❌ Exchange UID Verification Rejected",
                message: `Your UID verification request for ${targetExchange || 'selected exchange'} was rejected by the administrator. Please make sure to submit the correct screenshot of your profile for this specific exchange.`,
                type: "uid"
            });
        }
    };

    const adminReverifyUserUid = async (emailOrId: string, exchangeName?: string) => {
        if (!state.currentUser?.isAdmin) throw new Error("Unauthorized");
        const { userRef, userSnap } = await getUserRef(emailOrId);
        if (userSnap.exists()) {
            const data = userSnap.data() as UserData;
            if (exchangeName) {
                // Remove from verified
                const exchangeUids = { ...(data.exchangeUids || {}) };
                delete exchangeUids[exchangeName];

                const exchangeScreenshotUrls = { ...(data.exchangeScreenshotUrls || {}) };
                delete exchangeScreenshotUrls[exchangeName];

                // Remove from pending
                const pendingExchangeUids = { ...(data.pendingExchangeUids || {}) };
                delete pendingExchangeUids[exchangeName];

                const pendingExchangeScreenshots = { ...(data.pendingExchangeScreenshots || {}) };
                delete pendingExchangeScreenshots[exchangeName];

                // Remove from rejected
                const rejectedExchangeUids = { ...(data.rejectedExchangeUids || {}) };
                delete rejectedExchangeUids[exchangeName];

                // If currently showing as pending, find next pending or clear
                let nextPendingExchange = data.pendingExchange || "";
                let nextGameUid = data.gameUid || "";
                let nextUidScreenshotUrl = data.uidScreenshotUrl || "";
                
                if (nextPendingExchange === exchangeName) {
                    const hasMorePending = Object.keys(pendingExchangeUids).length > 0;
                    if (hasMorePending) {
                        const nextExchName = Object.keys(pendingExchangeUids)[0];
                        nextPendingExchange = nextExchName;
                        nextGameUid = pendingExchangeUids[nextExchName];
                        nextUidScreenshotUrl = pendingExchangeScreenshots[nextExchName] || "";
                    } else {
                        nextPendingExchange = "";
                        nextGameUid = "";
                        nextUidScreenshotUrl = "";
                    }
                }

                // Is UID verified at all? Verified if at least one verified exchange exists
                const isUidVerified = Object.keys(exchangeUids).length > 0;

                await updateDoc(userRef, {
                    isUidVerified,
                    gameUid: nextGameUid,
                    uidScreenshotUrl: nextUidScreenshotUrl,
                    exchangeUids,
                    exchangeScreenshotUrls,
                    pendingExchange: nextPendingExchange,
                    pendingExchangeUids,
                    pendingExchangeScreenshots,
                    rejectedExchangeUids
                });

                await logAdminAction('REVERIFY_UID', `Requested UID re-verification for ${emailOrId} for exchange ${exchangeName}.`);

                await addNotification(emailOrId, {
                    title: `⚠️ ${exchangeName} UID Re-verification Required`,
                    message: `The administrator has requested you to re-verify your UID for ${exchangeName}. Please submit a new, correct screenshot of your exchange profile with your UID.`,
                    type: "uid"
                });
            } else {
                await updateDoc(userRef, {
                    isUidVerified: false,
                    gameUid: "",
                    exchangeUids: {},
                    pendingExchange: "",
                    uidScreenshotUrl: "",
                    exchangeScreenshotUrls: {},
                    pendingExchangeUids: {},
                    pendingExchangeScreenshots: {},
                    rejectedExchangeUids: {}
                });

                await logAdminAction('REVERIFY_UID', `Requested UID re-verification for ${emailOrId}. Cleared all verified UIDs.`);

                await addNotification(emailOrId, {
                    title: "⚠️ UID Re-verification Required",
                    message: "The administrator has requested you to re-verify your Exchange UID. Please submit a new, correct screenshot of your exchange profile with your UID.",
                    type: "uid"
                });
            }
        } else {
            throw new Error(`Could not locate user document for: ${emailOrId}`);
        }
    };

    const submitUidForVerification = async (uid: string, screenshotUrl: string, exchange?: string) => {
        if (!state.currentUser) throw new Error("Not logged in");
        if (!uid.trim()) throw new Error("UID cannot be empty");
        if (!screenshotUrl) throw new Error("Screenshot is required");

        // Validate gameUid uniqueness via server proxy
        try {
            const response = await axios.post('/api/withdraw/check-uid', { uid: uid.trim(), email: state.currentUser.email });
            if (response.data && response.data.exists) {
                throw new Error("This UID already exists and is linked to another account.");
            }
        } catch (err: any) {
            if (err.message === "This UID already exists and is linked to another account.") {
                throw err;
            }
            console.error("Failed to verify UID uniqueness:", err);
        }

        const userRef = doc(db, "users", state.currentUser.email);
        const exchangeScreenshotUrls = { ...(state.currentUser.exchangeScreenshotUrls || {}) };
        if (exchange) {
            exchangeScreenshotUrls[exchange] = screenshotUrl;
        }

        const pendingExchangeUids = { ...(state.currentUser.pendingExchangeUids || {}) };
        const pendingExchangeScreenshots = { ...(state.currentUser.pendingExchangeScreenshots || {}) };
        const targetExchange = exchange || "Default";
        pendingExchangeUids[targetExchange] = uid.trim();
        pendingExchangeScreenshots[targetExchange] = screenshotUrl;

        const rejectedExchangeUids = { ...(state.currentUser.rejectedExchangeUids || {}) };
        if (targetExchange in rejectedExchangeUids) {
            delete rejectedExchangeUids[targetExchange];
        }

        await updateDoc(userRef, {
            gameUid: uid.trim(),
            uidScreenshotUrl: screenshotUrl,
            exchangeScreenshotUrls: exchangeScreenshotUrls,
            isUidVerified: false,
            pendingExchange: exchange || "",
            pendingExchangeUids: pendingExchangeUids,
            pendingExchangeScreenshots: pendingExchangeScreenshots,
            rejectedExchangeUids: rejectedExchangeUids
        });
    };

    const toggleTheme = () => dispatch({ type: 'TOGGLE_THEME' });
    const playGame = (game: Game) => dispatch({ type: 'START_GAME', payload: game });
    const closeGame = () => dispatch({ type: 'END_GAME' });
    const addBalance = async (amount: number, token: Token) => {
        if (!state.currentUser) return;
        await updateDoc(doc(db, "users", state.currentUser.email), { [`balance.${token}`]: (state.currentUser.balance[token] || 0) + amount });
    };

    const triggerAd = (type: 'interstitial' | 'rewarded'): Promise<void> => {
        return new Promise((resolve) => {
            adResolver.current = resolve;
            dispatch({ type: 'SHOW_AD', payload: type });
        });
    };

    const closeAd = () => {
        dispatch({ type: 'HIDE_AD' });
        if (adResolver.current) { adResolver.current(); adResolver.current = null; }
    };

    const addNotification = async (userId: string, notification: any) => {
        const userRef = doc(db, "users", userId);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const list = snap.data().notifications || [];
            list.unshift({ ...notification, id: Date.now().toString(), timestamp: new Date().toISOString(), read: false });
            await updateDoc(userRef, { notifications: list.slice(0, 50) });
        }
    };

    const markNotificationRead = async (userId: string, id: string) => {
        const userRef = doc(db, "users", userId);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const list = snap.data().notifications || [];
            const updated = list.map((n: any) => n.id === id ? { ...n, read: true } : n);
            await updateDoc(userRef, { notifications: updated });
        }
    };

    const clearNotifications = async (userId: string) => { await updateDoc(doc(db, "users", userId), { notifications: [] }); };

    const claimTaskReward = async (taskId: string, type: string, reward?: number, rewardToken?: Token, taskTitle?: string) => {
        if (!state.currentUser) return;
        try {
            await axios.post('/api/task/claim', {
                email: state.currentUser.email,
                taskId,
                type,
                reward,
                rewardToken,
                taskTitle
            });
            await reloadUser();
            triggerHapticFeedback('success');
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 },
                zIndex: 9999
            });
        } catch (error: any) {
            console.warn("Claim task failed on backend, running client-side Firestore transaction fallback...", error.message);
            // Fallback: update user record directly via client-side Firestore
            try {
                const userRef = doc(db, "users", state.currentUser.email || 'unknown');
                const userSnap = await getDoc(userRef);
                if (!userSnap.exists()) throw new Error("User does not exist");
                const userData = userSnap.data();
                
                const field = type === 'youtube' ? 'youtubeTaskProofs' : 
                              type === 'telegram' ? 'telegramTaskProofs' : 
                              type === 'facebook' ? 'facebookTaskProofs' : 
                              type === 'instagram' ? 'instagramTaskProofs' : 
                              type === 'twitter' ? 'twitterTaskProofs' : 
                              type === 'tiktok' ? 'tiktokTaskProofs' : 
                              type === 'appDownload' || type === 'app_download' ? 'appDownloadTaskProofs' : 
                              type === 'video' ? 'videoProofs' :
                              type === 'other' ? 'otherTaskProofs' :
                              'otherTaskProofs';

                const proofs = userData[field] || {};
                const proof = proofs[taskId];

                if (proof && proof.status === 'claimed') {
                    throw new Error("Task already claimed");
                }

                let rewardAmount = 0;
                let tokenSymbol = '';

                if (proof && proof.status === 'approved') {
                    rewardAmount = proof.reward || 0;
                    tokenSymbol = proof.rewardToken || 'USHA';
                } else if (reward !== undefined) {
                    rewardAmount = reward;
                    tokenSymbol = rewardToken || 'USHA';
                } else {
                    throw new Error("No approved proof found");
                }

                const newBalances = { ...userData.balance };
                newBalances[tokenSymbol] = (newBalances[tokenSymbol] || 0) + rewardAmount;
                
                const updatedProof = {
                    ...(proof || {
                        proofUrl: 'auto_approved_claim_fallback',
                        taskTitle: taskTitle || 'Task Reward',
                        submittedAt: new Date().toISOString(),
                        startedAt: new Date().toISOString()
                    }),
                    status: 'claimed',
                    reward: rewardAmount,
                    rewardToken: tokenSymbol
                };
                const newProofs = { ...proofs, [taskId]: updatedProof };
                
                const tapGameData = userData.tapGameData || {};
                const history = tapGameData.history || [];
                const newTx = { id: Date.now(), type: 'Earned', amount: rewardAmount.toString(), token: tokenSymbol, date: new Date().toISOString(), isPositive: true };
                const newTapGameData = { ...tapGameData, history: [...history, newTx] };

                await updateDoc(userRef, { balance: newBalances, [field]: newProofs, tapGameData: newTapGameData });

                await reloadUser();
                triggerHapticFeedback('success');
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    zIndex: 9999
                });
            } catch (fsErr: any) {
                console.error("Direct Firestore claim fallback failed too:", fsErr.message);
                alert("Claim fallback failed: " + fsErr.message);
            }
        }
    };

    const updateMarketPrice = (pair: string, price: number) => { dispatch({ type: 'UPDATE_MARKET_PRICE', payload: { pair, price } }); };
    const addMarket = async (m: MarketPair) => { const { id, ...d } = m; await setDoc(doc(db, "markets", id || `${m.base}-${m.quote}`), removeUndefined(d)); };
    const updateMarket = async (m: MarketPair) => { const { id, ...d } = m; await updateDoc(doc(db, "markets", id), removeUndefined(d)); };
    const removeMarket = async (id: string) => { await deleteDoc(doc(db, "markets", id)); };
    const executeTrade = async (pair: string, type: 'buy' | 'sell', orderType: 'limit' | 'market', amount: number, price: number) => {
        if (!state.currentUser) return;
        try {
            const res = await axios.post('/api/trade', {
                email: state.currentUser.email,
                pair,
                type,
                orderType,
                amount,
                price
            });
            // If response is HTML, throw error to trigger self-healing fallback
            if (res && res.data && typeof res.data === 'string' && res.data.startsWith('<!DOCTYPE')) {
                throw new Error("HTML response received from backend");
            }
            await reloadUser();
        } catch (error: any) {
            console.warn("Backend trade service failed or returned HTML. Activating client-side self-healing fallback...", error.message);
            
            // Client-side self-healing trade handler
            const [base, quote] = pair.split('/');
            const totalCost = amount * price;
            const balance = { ...(state.currentUser.balance || {}) };
            const currentBase = balance[base] || 0;
            const currentQuote = balance[quote] || 0;

            if (type === 'buy') {
                if (currentQuote < totalCost) throw new Error(`Insufficient ${quote} balance`);
                balance[quote] = currentQuote - totalCost;
                balance[base] = currentBase + amount;
            } else {
                if (currentBase < amount) throw new Error(`Insufficient ${base} balance`);
                balance[base] = currentBase - amount;
                balance[quote] = currentQuote + totalCost;
            }

            const tradeLog = {
                id: `trade_${Date.now()}`,
                pair,
                type,
                orderType,
                amount,
                price,
                total: totalCost,
                timestamp: new Date().toISOString()
            };

            const userRef = doc(db, "users", state.currentUser.email);
            await updateDoc(userRef, {
                balance,
                trades: [tradeLog, ...(state.currentUser.trades || [])]
            });
            await reloadUser();
        }
    };

    const cancelOrder = async (orderId: string) => {
        if (!state.currentUser) return;
        try {
            const res = await axios.post('/api/trade/cancel', {
                email: state.currentUser.email,
                orderId
            });
            // If response is HTML, throw error to trigger self-healing fallback
            if (res && res.data && typeof res.data === 'string' && res.data.startsWith('<!DOCTYPE')) {
                throw new Error("HTML response received from backend");
            }
            await reloadUser();
        } catch (error: any) {
            console.warn("Backend cancel trade failed or returned HTML. Activating client-side self-healing fallback...", error.message);
            
            const openOrders = [...(state.currentUser.openOrders || [])];
            const orderIdx = openOrders.findIndex((o: any) => o.id === orderId);
            if (orderIdx === -1) return;

            const order = openOrders[orderIdx];
            openOrders.splice(orderIdx, 1);

            const balance = { ...(state.currentUser.balance || {}) };
            const [base, quote] = order.pair.split('/');
            const totalCost = order.amount * order.price;

            if (order.type === 'buy') {
                balance[quote] = (balance[quote] || 0) + totalCost;
            } else {
                balance[base] = (balance[base] || 0) + order.amount;
            }

            const userRef = doc(db, "users", state.currentUser.email);
            await updateDoc(userRef, {
                balance,
                openOrders
            });
            await reloadUser();
        }
    };

    const contextValue: AppContextType = {
        state, dispatch, login, register, sendSignInLink, loginWithGoogle, loginWithFacebook, loginAsGuest, logout, resendVerificationEmail, resetPassword, reloadUser,
        uploadProofAttachment, startTask, cancelTask, submitVideoProof, submitYouTubeProof, submitFacebookProof, 
        submitInstagramProof, submitTwitterProof, submitTikTokProof, submitAppDownloadProof, submitOtherProof,
        submitDepositProof, initiateWithdrawal, swapBalance, applyReferralCode, redeemPromoCode,
        updateTapGameData, playGame, closeGame, submitAirdropAddress, updateProfile, updatePassword, getProofUrl, getLeaderboard,
        addVideo, removeVideo, addGame, updateGame, removeGame, addBanner, updateBanner, removeBanner,
        addPromoCode, removePromoCode, addYouTubeTask, updateYouTubeTask, removeYouTubeTask,
        addFacebookTask, updateFacebookTask, removeFacebookTask,
        addInstagramTask, updateInstagramTask, removeInstagramTask, addTwitterTask, updateTwitterTask, removeTwitterTask,
        addTikTokTask, updateTikTokTask, removeTikTokTask, addAppDownloadTask, updateAppDownloadTask, removeAppDownloadTask,
        addOtherTask, updateOtherTask, removeOtherTask,
        adminUpdateWithdrawalSettings, adminUpdateReferralConfig, adminUpdateAirdropConfig, adminUpdateAuthConfig, adminUpdateAdsConfig,
        executeTrade, updateMarketPrice, addMarket, updateMarket, removeMarket, cancelOrder,
        addToken, updateTokenName, removeToken, updateTokenLogo, addMineUpgrade, updateMineUpgrade, removeMineUpgrade, updateDailySchedule,
        adminApproveProof, adminRejectProof, adminApproveYouTubeProof, adminRejectYouTubeProof,
        adminApproveFacebookProof, adminRejectFacebookProof,
        adminApproveInstagramProof, adminRejectInstagramProof, adminApproveTwitterProof, adminRejectTwitterProof,
        adminApproveTikTokProof, adminRejectTikTokProof, adminApproveAppDownloadProof, adminRejectAppDownloadProof,
        adminApproveOtherProof, adminRejectOtherProof,
        adminApproveDepositProof, adminRejectDepositProof, adminRemoveProof, adminUpdateTaskProofStatus,
        adminUpdateWithdrawalStatus, adminUpdateUserBalance, adminToggleUserBlock, toggleTheme, addBalance, triggerAd, closeAd, adminUpdateUshaPrice,
        adminUpdateExchanges, adminApproveUserUid, adminRejectUserUid, adminReverifyUserUid, adminDeleteUser, submitUidForVerification,
        claimTaskReward, addNotification, markNotificationRead, clearNotifications
    };

    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};
