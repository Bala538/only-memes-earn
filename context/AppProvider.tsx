
import React, { useReducer, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
    AppState, AppAction, UserData, Token, Video, Game, Banner, PromoCode, 
    YouTubeTask, TelegramTask, FacebookTask, InstagramTask, TwitterTask, TikTokTask, AppDownloadTask,
    WithdrawalSetting, ReferralConfig, AirdropConfig, MineUpgrade, AuthConfig, AdsConfig,
    Proof, Withdrawal, DEFAULT_TOKENS, Transaction, DailyConfig, AppNotification, MarketPair, OtherTask,
    Trade, OrderBookItem
} from '../types';
import { 
    auth, db, googleProvider,
    signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChangedWrapper,
    signInWithPopup, sendEmailVerification, sendPasswordResetEmail, reload, 
    doc, setDoc, updateDoc, onSnapshot, collection, getDoc, getDocs, query, where, deleteDoc, runTransaction,
    uploadFileToStorage
} from '../firebaseConfig';
import { AppContext, AppContextType } from './AppContext';

const generateUniqueUID = async (): Promise<string> => {
    let uid = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
        attempts++;
        uid = Math.floor(10000000 + Math.random() * 90000000).toString();
        try {
            const q = query(collection(db, "users"), where("uid", "==", uid));
            const snap = await getDocs(q);
            isUnique = snap ? snap.empty : true;
        } catch (e) {
            console.warn("Firestore connection check failed in generateUniqueUID, using generated code:", e);
            return uid;
        }
    }
    return uid;
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

const DEFAULT_IMAGE = 'https://drive.google.com/uc?export=view&id=1WfVRPCftQCH9HK-wheUqhcXSaWbEhiAS';

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
            swapRate: 1000,
            swapFee: 2,
            depositEnabled: true
        }
    },
    referralConfig: { amount: 100, token: 'USHA', enabled: true },
    airdropConfig: { title: 'Airdrop Coming Soon', description: 'Join our community to be eligible.', imageUrl: '', isActive: true, allowAddressSubmission: false },
    authConfig: {
        imageUrl: DEFAULT_IMAGE,
        authImageUrl: DEFAULT_IMAGE, 
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
    loading: true
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
        default: return state;
    }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const adResolver = useRef<(() => void) | null>(null);
    
    useEffect(() => {
        let unsubUser: (() => void) | null = null;
        const unsubscribe = onAuthStateChangedWrapper(auth, async (user) => {
            if (user) {
                const isAdmin = user.email === 'balakumar7654@gmail.com';
                let userData: UserData;
                const userRef = doc(db, "users", user.email || 'unknown');
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
                        await updateDoc(userRef, { lastActive: new Date().toISOString(), emailVerified: user.emailVerified, uid: user.uid, isAdmin });
                    } else {
                        const newUID = await generateUniqueUID();
                        userData = {
                            uid: newUID,
                            email: user.email || '',
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
                        email: user.email || '',
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

    useEffect(() => {
        const tryTelegramAutoLogin = async () => {
            const tg = (window as any).Telegram?.WebApp;
            const tgUser = tg?.initDataUnsafe?.user;
            if (tgUser && !auth.currentUser) {
                dispatch({ type: 'SET_LOADING', payload: true });
                const tgEmail = `tg${tgUser.id}@tg.onlymemesearn.com`;
                const tgPassword = `tg_secure_pass_${tgUser.id}_salt_onlymemes`;
                
                try {
                    await signInWithEmailAndPassword(auth, tgEmail, tgPassword);
                    console.log("Telegram Auto-login Succeeded:", tgEmail);
                } catch (err: any) {
                    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                        try {
                            const creds = await createUserWithEmailAndPassword(auth, tgEmail, tgPassword);
                            const user = creds.user;
                            const isAdmin = tgEmail === 'balakumar7654@gmail.com';
                            const newUID = await generateUniqueUID();
                            const userData = {
                                uid: newUID,
                                email: tgEmail,
                                isAdmin: isAdmin,
                                displayName: tgUser.username ? `@${tgUser.username}` : `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
                                photoURL: tgUser.photo_url || '',
                                emailVerified: true,
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
                            await setDoc(doc(db, "users", tgEmail), userData);
                            console.log("Telegram User registered in Firestore successfully!");
                        } catch (regErr) {
                            console.error("Failed to register Telegram user:", regErr);
                        }
                    } else {
                        console.error("Telegram Auto-login error:", err);
                    }
                } finally {
                    dispatch({ type: 'SET_LOADING', payload: false });
                }
            }
        };

        // Delay slightly of 500ms so Telegram SDK has loaded fully
        setTimeout(tryTelegramAutoLogin, 500);
    }, []);

    useEffect(() => {
        const unsubVideos = onSnapshot(collection(db, "videos"), (snap) => {
            const list: Video[] = [];
            snap.forEach(doc => list.push(doc.data() as Video));
            dispatch({ type: 'SET_VIDEOS', payload: list });
        }, (e: any) => console.error("videos snap error", e?.message || String(e)));
        const unsubGames = onSnapshot(collection(db, "games"), (snap) => {
            const list: Game[] = [];
            snap.forEach(doc => list.push({ ...(doc.data() as Game), id: doc.id }));
            dispatch({ type: 'SET_GAMES', payload: list });
        }, (e: any) => console.error("games snap error", e?.message || String(e)));
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
                if (doc.id === 'withdrawals') dispatch({ type: 'UPDATE_WITHDRAWAL_SETTINGS', payload: doc.data() as any });
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
            });
        }, (e: any) => console.error("configs snap error", e?.message || String(e)));

        const unsubMine = onSnapshot(collection(db, "mineUpgrades"), (snap) => {
            const list: any[] = []; snap.forEach(d => list.push(d.data())); 
            dispatch({ type: 'SET_MINE_UPGRADES', payload: list });
        }, (e: any) => console.error("mineUpgrades snap error", e?.message || String(e)));

        let unsubAllUsers = () => {};
        if (state.currentUser?.isAdmin) {
             unsubAllUsers = onSnapshot(collection(db, "users"), (snap) => {
                const list: UserData[] = [];
                snap.forEach(doc => list.push(doc.data() as UserData));
                dispatch({ type: 'SET_ALL_USERS', payload: list });
            }, (error: any) => {
                console.error("All users snapshot error:", error?.message || String(error));
            });
        }

        return () => {
            unsubVideos(); unsubGames(); unsubYoutube(); unsubTelegram(); unsubFacebook();
            unsubInstagram(); unsubTwitter(); unsubTikTok(); unsubAppDL();
            unsubBanners(); unsubPromos(); unsubMarkets(); unsubConfigs(); unsubMine(); unsubAllUsers();
        };
    }, [state.currentUser?.isAdmin]);

    const login = async (email: string, pass: string) => { await signInWithEmailAndPassword(auth, email, pass); };
    const register = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
    const loginWithGoogle = async () => { await signInWithPopup(auth, googleProvider); };
    const loginWithFacebook = () => Promise.reject(new Error("Facebook Login not configured in this demo."));
    const logout = () => signOut(auth).then(() => dispatch({ type: 'LOGOUT' }));
    const resendVerificationEmail = async () => { if (auth.currentUser) await sendEmailVerification(auth.currentUser); };
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
        if (taskType === 'app_download') return 'appDownloadTaskProofs';
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

    const _submitProof = async (proofType: string, id: string, title: string, proofUrl: string, reward: number, token: Token, code?: string) => {
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
                status: 'pending',
                taskTitle: title,
                reward,
                rewardToken: token,
                submittedAt: new Date().toISOString()
            };
            const updatedProofs = { ...currentProofs, [id]: proof };
            await updateDoc(userRef, removeUndefined({ [proofType]: updatedProofs }));
        }
    };

    const submitVideoProof = (id: string, t: string, url: string, r: number, c: Token, code?: string) => _submitProof('videoProofs', id, t, url, r, c, code);
    const submitYouTubeProof = (id: string, t: string, url: string, r: number, c: Token, code?: string) => _submitProof('youtubeTaskProofs', id, t, url, r, c, code);
    const submitTelegramProof = (id: string, t: string, url: string, r: number, c: Token, code?: string) => _submitProof('telegramTaskProofs', id, t, url, r, c, code);
    const submitFacebookProof = (id: string, t: string, url: string, r: number, c: Token, code?: string) => _submitProof('facebookTaskProofs', id, t, url, r, c, code);
    const submitInstagramProof = (id: string, t: string, url: string, r: number, c: Token, code?: string) => _submitProof('instagramTaskProofs', id, t, url, r, c, code);
    const submitTwitterProof = (id: string, t: string, url: string, r: number, c: Token, code?: string) => _submitProof('twitterTaskProofs', id, t, url, r, c, code);
    const submitTikTokProof = (id: string, t: string, url: string, r: number, c: Token, code?: string) => _submitProof('tiktokTaskProofs', id, t, url, r, c, code);
    const submitAppDownloadProof = (id: string, t: string, url: string, r: number, c: Token, code?: string) => _submitProof('appDownloadTaskProofs', id, t, url, r, c, code);
    const submitOtherProof = (id: string, t: string, url: string, r: number, c: Token, code?: string) => _submitProof('otherTaskProofs', id, t, url, r, c, code);
    const submitDepositProof = (id: string, t: string, url: string, r: number, c: Token) => _submitProof('depositProofs', id, t, url, r, c);

    const initiateWithdrawal = async (address: string, token: Token, amount: number, method: Withdrawal['method'], exchange?: string): Promise<string> => {
        if (!state.currentUser) throw new Error("Not logged in");
        const withdrawal: Withdrawal = { id: Date.now().toString(), amount, recipientAddress: address, timestamp: new Date().toISOString(), status: 'pending', token, method, exchange };
        const newBalance = (state.currentUser.balance[token] || 0) - amount;
        if (newBalance < 0) throw new Error("Insufficient balance");
        const userRef = doc(db, "users", state.currentUser.email);
        await updateDoc(userRef, removeUndefined({
            withdrawals: [...state.currentUser.withdrawals, withdrawal],
            [`balance.${token}`]: newBalance
        }));
        return withdrawal.id;
    };

    const swapBalance = async (from: Token, to: Token, amount: number, received: number) => {
        if (!state.currentUser) return;
        const currentFrom = state.currentUser.balance[from] || 0;
        if (currentFrom < amount) throw new Error("Insufficient balance");
        const currentTo = state.currentUser.balance[to] || 0;
        const userRef = doc(db, "users", state.currentUser.email);
        await updateDoc(userRef, {
            [`balance.${from}`]: currentFrom - amount,
            [`balance.${to}`]: currentTo + received
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

    const _addDoc = (col: string, data: any) => setDoc(doc(db, col, data.id), removeUndefined(data));
    const _delDoc = (col: string, id: string) => deleteDoc(doc(db, col, id));
    
    const addVideo = (v: Video) => _addDoc("videos", v);
    const removeVideo = (id: string) => _delDoc("videos", id);
    const addGame = (g: Game) => _addDoc("games", g);
    const updateGame = (g: Game) => _addDoc("games", g);
    const removeGame = (id: string) => _delDoc("games", id);
    const addBanner = (b: Banner) => _addDoc("banners", b);
    const updateBanner = (b: Banner) => _addDoc("banners", b);
    const removeBanner = (id: string) => _delDoc("banners", id);
    const addPromoCode = (p: PromoCode) => _addDoc("promoCodes", p);
    const removePromoCode = (id: string) => _delDoc("promoCodes", id);

    const addYouTubeTask = (t: YouTubeTask) => _addDoc("youtubeTasks", t);
    const updateYouTubeTask = (t: YouTubeTask) => _addDoc("youtubeTasks", t);
    const removeYouTubeTask = (id: string) => _delDoc("youtubeTasks", id);
    const addTelegramTask = (t: TelegramTask) => _addDoc("telegramTasks", t);
    const updateTelegramTask = (t: TelegramTask) => _addDoc("telegramTasks", t);
    const removeTelegramTask = (id: string) => _delDoc("telegramTasks", id);
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
    };

    const adminUpdateWithdrawalSettings = (s: any) => setDoc(doc(db, "configs", "withdrawals"), removeUndefined(s));
    const adminUpdateReferralConfig = (c: any) => setDoc(doc(db, "configs", "referral"), removeUndefined(c));
    const adminUpdateAirdropConfig = (c: any) => setDoc(doc(db, "configs", "airdrop"), removeUndefined(c));
    const adminUpdateAuthConfig = (c: any) => setDoc(doc(db, "configs", "auth"), removeUndefined(c));
    const adminUpdateAdsConfig = (c: any) => setDoc(doc(db, "configs", "ads"), removeUndefined(c));
    
    const addToken = (c: string, name?: string) => {
        const list = [...state.availableTokens, c];
        const configs = { ...state.tokenConfigs, [c]: { symbol: c, name: name || c, logoUrl: state.tokenLogos[c] || '' } };
        return setDoc(doc(db, "configs", "coins"), { list, configs }, { merge: true });
    };
    const updateTokenName = (c: string, name: string) => {
        const configs = { ...state.tokenConfigs, [c]: { ...state.tokenConfigs[c], symbol: c, name: name } };
        return setDoc(doc(db, "configs", "coins"), { configs }, { merge: true });
    };
    const removeToken = (c: string) => {
        const list = state.availableTokens.filter(x => x !== c);
        const configs = { ...state.tokenConfigs };
        delete configs[c];
        return setDoc(doc(db, "configs", "coins"), { list, configs }, { merge: true });
    };
    const updateTokenLogo = async (c: string, url: string) => {
        const ref = doc(db, "configs", "coins");
        const snap = await getDoc(ref);
        if (snap.exists()) return updateDoc(ref, { [`logos.${c}`]: url });
        return setDoc(ref, { list: DEFAULT_TOKENS, logos: { [c]: url } });
    };
    
    const addMineUpgrade = (u: MineUpgrade) => _addDoc("mineUpgrades", u);
    const updateMineUpgrade = (u: MineUpgrade) => _addDoc("mineUpgrades", u);
    const removeMineUpgrade = (id: string) => _delDoc("mineUpgrades", id);
    
    const updateDailySchedule = (date: string, cipher: string, combo: string[], cipherReward?: number, comboReward?: number) => {
        const config: DailyConfig = { cipher, combo, cipherReward, comboReward };
        const schedule = { ...state.dailySchedule, [date]: config };
        return setDoc(doc(db, "configs", "dailySchedule"), removeUndefined(schedule));
    };

    const adminUpdateTaskProofStatus = async (email: string, taskId: string, type: string, status: Proof['status']) => {
        const userRef = doc(db, "users", email);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;
        const u = userSnap.data() as UserData;
        const field = _getProofField(type);
        const proofs = u[field as keyof UserData] as Record<string, Proof> || {};
        const proof = proofs[taskId];
        if (!proof) return;
        await updateDoc(userRef, { [field]: { ...proofs, [taskId]: { ...proof, status } } });
    };

    const adminApproveProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'video', 'approved');
    const adminRejectProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'video', 'rejected');
    const adminApproveYouTubeProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'youtube', 'approved');
    const adminRejectYouTubeProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'youtube', 'rejected');
    const adminApproveTelegramProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'telegram', 'approved');
    const adminRejectTelegramProof = (e: string, id: string) => adminUpdateTaskProofStatus(e, id, 'telegram', 'rejected');
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
        const userRef = doc(db, "users", email);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const data = userSnap.data();
            const proofs = data[field] || {};
            delete proofs[taskId];
            await updateDoc(userRef, { [field]: proofs });
        }
    };

    const adminUpdateWithdrawalStatus = async (email: string, id: string, status: Withdrawal['status']) => {
        const userRef = doc(db, "users", email);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const data = userSnap.data() as UserData;
            const updated = data.withdrawals.map(w => w.id === id ? { ...w, status } : w);
            await updateDoc(userRef, { withdrawals: updated });
        }
    };

    const adminToggleUserBlock = async (email: string, block: boolean) => {
        await updateDoc(doc(db, "users", email), { isBlocked: block });
    };

    const adminUpdateUserBalance = async (email: string, token: string, newBalance: number) => {
        await updateDoc(doc(db, "users", email), { [`balance.${token}`]: newBalance });
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

    const claimTaskReward = async (taskId: string, type: string) => {
        if (!state.currentUser) return;
        try {
            await axios.post('/api/task/claim', {
                email: state.currentUser.email,
                taskId,
                type
            });
            await reloadUser();
        } catch (error: any) {
            console.error("Claim task failed:", error.response?.data?.error || error.message);
        }
    };

    const updateMarketPrice = (pair: string, price: number) => { dispatch({ type: 'UPDATE_MARKET_PRICE', payload: { pair, price } }); };
    const addMarket = async (m: MarketPair) => { const { id, ...d } = m; await setDoc(doc(db, "markets", id || `${m.base}-${m.quote}`), removeUndefined(d)); };
    const updateMarket = async (m: MarketPair) => { const { id, ...d } = m; await updateDoc(doc(db, "markets", id), removeUndefined(d)); };
    const removeMarket = async (id: string) => { await deleteDoc(doc(db, "markets", id)); };
    const executeTrade = async (pair: string, type: 'buy' | 'sell', orderType: 'limit' | 'market', amount: number, price: number) => {
        if (!state.currentUser) return;
        try {
            await axios.post('/api/trade', {
                email: state.currentUser.email,
                pair,
                type,
                orderType,
                amount,
                price
            });
            await reloadUser();
        } catch (error: any) {
            console.error("Trade failed:", error.response?.data?.error || error.message);
            throw new Error(error.response?.data?.error || "Trade failed");
        }
    };

    const cancelOrder = async (orderId: string) => {
        if (!state.currentUser) return;
        try {
            await axios.post('/api/trade/cancel', {
                email: state.currentUser.email,
                orderId
            });
            await reloadUser();
        } catch (error: any) {
            console.error("Cancel order failed:", error.response?.data?.error || error.message);
        }
    };

    const contextValue: AppContextType = {
        state, dispatch, login, register, loginWithGoogle, loginWithFacebook, logout, resendVerificationEmail, resetPassword, reloadUser,
        uploadProofAttachment, startTask, cancelTask, submitVideoProof, submitYouTubeProof, submitTelegramProof, submitFacebookProof, 
        submitInstagramProof, submitTwitterProof, submitTikTokProof, submitAppDownloadProof, submitOtherProof,
        submitDepositProof, initiateWithdrawal, swapBalance, applyReferralCode, redeemPromoCode,
        updateTapGameData, playGame, closeGame, submitAirdropAddress, updateProfile, updatePassword, getProofUrl, getLeaderboard,
        addVideo, removeVideo, addGame, updateGame, removeGame, addBanner, updateBanner, removeBanner,
        addPromoCode, removePromoCode, addYouTubeTask, updateYouTubeTask, removeYouTubeTask,
        addTelegramTask, updateTelegramTask, removeTelegramTask, addFacebookTask, updateFacebookTask, removeFacebookTask,
        addInstagramTask, updateInstagramTask, removeInstagramTask, addTwitterTask, updateTwitterTask, removeTwitterTask,
        addTikTokTask, updateTikTokTask, removeTikTokTask, addAppDownloadTask, updateAppDownloadTask, removeAppDownloadTask,
        addOtherTask, updateOtherTask, removeOtherTask,
        adminUpdateWithdrawalSettings, adminUpdateReferralConfig, adminUpdateAirdropConfig, adminUpdateAuthConfig, adminUpdateAdsConfig,
        executeTrade, updateMarketPrice, addMarket, updateMarket, removeMarket, cancelOrder,
        addToken, updateTokenName, removeToken, updateTokenLogo, addMineUpgrade, updateMineUpgrade, removeMineUpgrade, updateDailySchedule,
        adminApproveProof, adminRejectProof, adminApproveYouTubeProof, adminRejectYouTubeProof,
        adminApproveTelegramProof, adminRejectTelegramProof, adminApproveFacebookProof, adminRejectFacebookProof,
        adminApproveInstagramProof, adminRejectInstagramProof, adminApproveTwitterProof, adminRejectTwitterProof,
        adminApproveTikTokProof, adminRejectTikTokProof, adminApproveAppDownloadProof, adminRejectAppDownloadProof,
        adminApproveOtherProof, adminRejectOtherProof,
        adminApproveDepositProof, adminRejectDepositProof, adminRemoveProof, adminUpdateTaskProofStatus,
        adminUpdateWithdrawalStatus, adminUpdateUserBalance, adminToggleUserBlock, toggleTheme, addBalance, triggerAd, closeAd, adminUpdateUshaPrice,
        claimTaskReward, addNotification, markNotificationRead, clearNotifications
    };

    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};
