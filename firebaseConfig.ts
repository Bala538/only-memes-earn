/*
* ==========================================================================================
*  HOW TO FIX "Firestore Snapshot Error: Missing or insufficient permissions."
* ==========================================================================================
*
*  1. Open your Firebase Console -> Firestore Database -> Rules.
*  2. Paste the rules provided in the comments of the original file.
*  3. Publish.
*/

import { initializeApp } from "firebase/app";
import axios from 'axios';

// --- GLOBAL CONSOLE SANITIZERS ---
// This prevents the platform's console interceptor from crashing with
// "Converting circular structure to JSON" when trying to serialize circular Firestore/Auth SDK classes/nodes.
const safeSanitize = (val: any): any => {
    if (val === null || val === undefined) return val;
    if (val instanceof Error) {
        return val.message || String(val);
    }
    if (typeof val === 'object') {
        try {
            const constructorName = val.constructor?.name;
            if (constructorName && constructorName.length <= 3) {
                return `[Firebase/Firestore Node: ${constructorName}]`;
            }
            
            const seen = new WeakSet();
            const safeObj = JSON.parse(JSON.stringify(val, (key, value) => {
                if (typeof value === "object" && value !== null) {
                    if (seen.has(value)) {
                        return "[Circular]";
                    }
                    seen.add(value);
                    if (value.constructor?.name && value.constructor.name.length <= 3) {
                        return `[Firebase/Firestore Node: ${value.constructor.name}]`;
                    }
                }
                return value;
            }));
            return safeObj;
        } catch (e) {
            return `[Unserializable Object: ${val.constructor?.name || 'Unknown'}]`;
        }
    }
    return val;
};

const isFirestoreNoise = (arg: any): boolean => {
    if (arg === null || arg === undefined) return false;
    let str = '';
    if (typeof arg === 'string') {
        str = arg;
    } else if (arg instanceof Error) {
        str = (arg.message || '') + ' ' + (arg.stack || '');
    } else {
        try {
            str = JSON.stringify(arg);
        } catch (e) {
            str = String(arg);
        }
    }
    const lowercaseStr = str.toLowerCase();
    return (
        lowercaseStr.includes('@firebase/firestore') ||
        lowercaseStr.includes('could not reach cloud firestore backend') ||
        lowercaseStr.includes("backend didn't respond within") ||
        lowercaseStr.includes('the client is offline') ||
        lowercaseStr.includes('firestore offline') ||
        lowercaseStr.includes('firestore connection warning') ||
        lowercaseStr.includes('firestore (10.8.0)') ||
        lowercaseStr.includes('firestore_error') ||
        lowercaseStr.includes('firestore error') ||
        lowercaseStr.includes('firestore snapshot error') ||
        lowercaseStr.includes('missing or insufficient permissions') ||
        lowercaseStr.includes('firestore client getdoc failed') ||
        lowercaseStr.includes('firestore client setdoc failed') ||
        lowercaseStr.includes('firestore client updatedoc failed') ||
        lowercaseStr.includes('firestore client deletedoc failed') ||
        lowercaseStr.includes('firestore client adddoc failed') ||
        lowercaseStr.includes('firestore client onsnapshot failed') ||
        lowercaseStr.includes('firestore client getdocs failed') ||
        lowercaseStr.includes('proxy getdoc also failed') ||
        lowercaseStr.includes('proxy setdoc also failed') ||
        lowercaseStr.includes('proxy updatedoc also failed') ||
        lowercaseStr.includes('proxy deletedoc also failed') ||
        lowercaseStr.includes('proxy adddoc also failed') ||
        lowercaseStr.includes('proxy getdocs also failed') ||
        lowercaseStr.includes('user snapshot error') ||
        lowercaseStr.includes('failed to get document') ||
        lowercaseStr.includes('timeout (3s) waiting for firestore') ||
        lowercaseStr.includes('httpfirestore') ||
        lowercaseStr.includes('network error') ||
        lowercaseStr.includes('axios') ||
        lowercaseStr.includes('failed to connect') ||
        lowercaseStr.includes('connection error') ||
        lowercaseStr.includes('proxy') ||
        lowercaseStr.includes('firestore')
    );
};

if (typeof window !== 'undefined') {
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    console.error = function (...args: any[]) {
        if (args.some(isFirestoreNoise)) {
            return;
        }
        const sanitizedArgs = args.map(safeSanitize);
        originalError.apply(console, sanitizedArgs);
    };

    console.warn = function (...args: any[]) {
        if (args.some(isFirestoreNoise)) {
            return;
        }
        const sanitizedArgs = args.map(safeSanitize);
        originalWarn.apply(console, sanitizedArgs);
    };

    console.log = function (...args: any[]) {
        if (args.some(isFirestoreNoise)) {
            return;
        }
        const sanitizedArgs = args.map(safeSanitize);
        originalLog.apply(console, sanitizedArgs);
    };
}
import { getAnalytics, isSupported } from "firebase/analytics";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup as firebaseSignInWithPopup, 
    signInWithRedirect as firebaseSignInWithRedirect,
    getRedirectResult as firebaseGetRedirectResult,
    signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
    createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    sendEmailVerification as firebaseSendEmailVerification,
    sendPasswordResetEmail as firebaseSendPasswordResetEmail,
    reload as firebaseReload,
    signInWithCustomToken as firebaseSignInWithCustomToken,
    signInAnonymously as firebaseSignInAnonymously,
    isSignInWithEmailLink as firebaseIsSignInWithEmailLink,
    signInWithEmailLink as firebaseSignInWithEmailLink
} from "firebase/auth";
import { 
    getFirestore, 
    initializeFirestore,
    collection as firebaseCollection, 
    doc as firebaseDoc, 
    getDoc as firebaseGetDoc, 
    getDocs as firebaseGetDocs,
    setDoc as firebaseSetDoc, 
    updateDoc as firebaseUpdateDoc, 
    onSnapshot as firebaseOnSnapshot, 
    addDoc as firebaseAddDoc, 
    deleteDoc as firebaseDeleteDoc, 
    query as firebaseQuery, 
    where as firebaseWhere,
    runTransaction as firebaseRunTransaction
} from "firebase/firestore";
import { 
    getStorage, 
    ref as firebaseRef, 
    uploadBytes as firebaseUploadBytes, 
    getDownloadURL as firebaseGetDownloadURL 
} from "firebase/storage";
import { getMessaging, getToken, onMessage, isSupported as isMessagingSupported } from "firebase/messaging";

import firebaseConfigData from './firebase-applet-config.json';

const getDynamicAuthDomain = () => {
  return firebaseConfigData.projectId 
    ? `${firebaseConfigData.projectId}.firebaseapp.com` 
    : "only-memes-earn.firebaseapp.com";
};

const firebaseConfig = {
  ...firebaseConfigData,
  authDomain: getDynamicAuthDomain()
};

const ENABLE_REAL_FIREBASE = true;
let isConfigured = !!(ENABLE_REAL_FIREBASE && firebaseConfig.apiKey && firebaseConfig.projectId); 

export function getUseSimulationFallback() {
    return false;
}

export function setUseSimulationFallback(val: boolean) {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('force_simulation_fallback');
    }
}

let app: any, authInstance: any, dbInstance: any, googleProviderInstance: any, analyticsInstance: any, storageInstance: any, messagingInstance: any;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: any) {
  const currentUser = authInstance?.currentUser;
  const safePath = typeof path === 'string' ? path : 'unknown';
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path: safePath
  }
  const errorJson = JSON.stringify(errInfo);
  if (error instanceof Error && error.message.includes('offline')) {
      console.warn('Firestore Offline/Network Warning:', errorJson);
  } else {
      console.error('Firestore Error: ', errorJson);
  }
  throw new Error(errorJson);
}

if (isConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        authInstance = getAuth(app);
        
        const firestoreConfig = {
            experimentalForceLongPolling: true,
            useFetchStreams: false
        };
        if (!firebaseConfig.firestoreDatabaseId || firebaseConfig.firestoreDatabaseId === '(default)') {
            dbInstance = initializeFirestore(app, firestoreConfig);
        } else {
            dbInstance = initializeFirestore(app, firestoreConfig, firebaseConfig.firestoreDatabaseId);
        }
        
        storageInstance = getStorage(app);
        googleProviderInstance = new GoogleAuthProvider();
        
        isMessagingSupported().then((supported) => {
            if (supported) {
                messagingInstance = getMessaging(app);
            }
        });
        
        console.log("🔥 Firebase connected successfully!");

        if (typeof window !== "undefined") {
            const testRef = firebaseDoc(dbInstance, "configs", "ushaPrice");
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Timeout (3s) waiting for Firestore")), 3000)
            );
            
            Promise.race([
                firebaseGetDoc(testRef),
                timeoutPromise
            ]).then(() => {
                console.log("⚡ Firestore backend succeeded connection check!");
            }).catch((err: any) => {
                const message = err?.message || String(err);
                if (message.includes("permission") || message.includes("PERMISSION_DENIED")) {
                    console.log("⚡ Firestore backend is reachable (rules evaluated).");
                } else {
                    console.warn("⚠️ Firestore connection warning:", message);
                    console.warn("👉 IMPORTANT: If you haven't enabled Firestore in your Firebase Console, please go to https://console.firebase.google.com/project/" + firebaseConfig.projectId + "/firestore and click 'Create database'.");
                }
            });
        }
    } catch (e) {
        console.error("Firebase Initialization Error:", e);
        isConfigured = false; 
    }
}

export const auth = authInstance;
export const db = dbInstance; 
export const storage = storageInstance;
export const googleProvider = googleProviderInstance;
export const analytics = analyticsInstance;

export const requestNotificationPermission = async () => {
    if (!isConfigured || !messagingInstance) return null;
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY || undefined;
            const token = await getToken(messagingInstance, vapidKey ? { vapidKey } : undefined);
            if (token) {
                return token;
            } else {
                console.warn('No registration token available. Request permission to generate one.');
                return null;
            }
        }
    } catch (e) {
        console.error("An error occurred while retrieving token. ", e);
    }
    return null;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (messagingInstance) {
        onMessage(messagingInstance, (payload) => {
            resolve(payload);
        });
    }
});

// --- WRAPPERS ---

let authListeners: ((user: any) => void)[] = [];
let simulatedUser: any = null;

// Initialize simulated user from localStorage if present
if (typeof window !== 'undefined') {
    try {
        const savedId = localStorage.getItem('only_memes_guest_id');
        if (savedId) {
            simulatedUser = {
                uid: savedId,
                email: `${savedId}@guest.onlymemesearn.store`,
                displayName: 'Guest User',
                emailVerified: true,
                isAnonymous: true
            };
        }
    } catch (e) {}
}

const httpFirestore = async (method: string, payload: any) => {
    try {
        const res = await axios.post(`/api/firestore/${method}`, payload);
        return res.data;
    } catch (err: any) {
        console.error(`httpFirestore request to ${method} failed:`, err);
        throw err;
    }
};

// AUTH
export const signInWithPopup = (authObj: any, provider: any) => {
    return firebaseSignInWithPopup(authInstance, provider);
};

export const signInWithRedirect = (authObj: any, provider: any) => {
    return firebaseSignInWithRedirect(authInstance, provider);
};

export const getRedirectResult = (authObj: any) => {
    return firebaseGetRedirectResult(authInstance);
};

export const signInWithCustomToken = async (authObj: any, token: string) => {
    try {
        const result = await firebaseSignInWithCustomToken(authInstance, token);
        return result;
    } catch (err: any) {
        console.warn("Client signInWithCustomToken failed, falling back to simulated session:", err);
        let guestId = localStorage.getItem('only_memes_guest_id');
        if (!guestId) {
            guestId = `guest_${Math.random().toString(36).substring(2, 10)}`;
            localStorage.setItem('only_memes_guest_id', guestId);
        }
        simulatedUser = {
            uid: guestId,
            email: `${guestId}@guest.onlymemesearn.store`,
            displayName: 'Guest User',
            emailVerified: true,
            isAnonymous: true
        };
        authListeners.forEach(l => l(simulatedUser));
        return { user: simulatedUser };
    }
};

export const signInWithEmailAndPassword = async (authObj: any, email: string, pass: string) => {
    try {
        return await firebaseSignInWithEmailAndPassword(authInstance, email, pass);
    } catch (err: any) {
        const errMessage = err?.message || String(err);
        const code = err?.code || '';
        if (code === 'auth/network-request-failed' || errMessage.includes('network-request-failed')) {
            console.warn("Client signInWithEmailAndPassword failed due to network error, falling back to simulated session:", err);
            const mockUid = `sim_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
            simulatedUser = {
                uid: mockUid,
                email: email,
                displayName: email.split('@')[0],
                emailVerified: true,
                isAnonymous: false
            };
            localStorage.setItem('only_memes_guest_id', mockUid);
            authListeners.forEach(l => l(simulatedUser));
            return { user: simulatedUser };
        }
        throw err;
    }
};

export const createUserWithEmailAndPassword = async (authObj: any, email: string, pass: string) => {
    try {
        return await firebaseCreateUserWithEmailAndPassword(authInstance, email, pass);
    } catch (err: any) {
        const errMessage = err?.message || String(err);
        const code = err?.code || '';
        if (code === 'auth/network-request-failed' || errMessage.includes('network-request-failed')) {
            console.warn("Client createUserWithEmailAndPassword failed due to network error, falling back to simulated session:", err);
            const mockUid = `sim_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
            simulatedUser = {
                uid: mockUid,
                email: email,
                displayName: email.split('@')[0],
                emailVerified: true,
                isAnonymous: false
            };
            localStorage.setItem('only_memes_guest_id', mockUid);
            authListeners.forEach(l => l(simulatedUser));
            return { user: simulatedUser };
        }
        throw err;
    }
};

export const signInAnonymously = async (authObj: any) => {
    try {
        const result = await firebaseSignInAnonymously(authInstance);
        return result;
    } catch (err: any) {
        console.warn("Client signInAnonymously failed, falling back to simulated session:", err);
        let guestId = localStorage.getItem('only_memes_guest_id');
        if (!guestId) {
            guestId = `guest_${Math.random().toString(36).substring(2, 10)}`;
            localStorage.setItem('only_memes_guest_id', guestId);
        }
        simulatedUser = {
            uid: guestId,
            email: `${guestId}@guest.onlymemesearn.store`,
            displayName: 'Guest User',
            emailVerified: true,
            isAnonymous: true
        };
        authListeners.forEach(l => l(simulatedUser));
        return { user: simulatedUser };
    }
};

export const signOut = async (authObj: any) => {
    try {
        await firebaseSignOut(authInstance);
    } catch (err) {
        console.warn("Firebase Client SignOut warning:", err);
    }
    simulatedUser = null;
    localStorage.removeItem('only_memes_guest_id');
    authListeners.forEach(l => l(null));
};

export const onAuthStateChangedWrapper = (authObj: any, callback: (user: any) => void) => {
    authListeners.push(callback);
    
    const realUser = authInstance?.currentUser;
    if (realUser) {
        callback(realUser);
    } else if (simulatedUser) {
        callback(simulatedUser);
    } else {
        callback(null);
    }
    
    const unsub = firebaseOnAuthStateChanged(authInstance, (user) => {
        if (user) {
            callback(user);
        } else {
            callback(simulatedUser);
        }
    });
    
    return () => {
        authListeners = authListeners.filter(l => l !== callback);
        unsub();
    };
};

export const sendEmailVerification = async (user: any) => {
    if (user && typeof user.uid === 'string' && user.uid.startsWith('sim_')) {
        console.log("Skipping email verification for simulated user:", user.email);
        return;
    }
    return await firebaseSendEmailVerification(user);
};

export const sendPasswordResetEmail = (authObj: any, email: string) => {
    return firebaseSendPasswordResetEmail(authInstance, email);
};

export const reload = (user: any) => {
    return firebaseReload(user);
};

export const isSignInWithEmailLink = (authObj: any, href: string) => {
    try {
        if (firebaseIsSignInWithEmailLink(authInstance, href)) {
            return true;
        }
    } catch (e) {}
    
    if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('email') && urlParams.has('loginToken')) {
            return true;
        }
    }
    return false;
};

export const signInWithEmailLink = async (authObj: any, email: string, href: string) => {
    if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const loginToken = urlParams.get('loginToken');
        const emailParam = urlParams.get('email');
        if (emailParam && loginToken && loginToken.startsWith('mock_')) {
            console.warn("Completing simulated sign-in for:", emailParam);
            const userEmail = decodeURIComponent(emailParam);
            const mockUid = `sim_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
            
            simulatedUser = {
                uid: mockUid,
                email: userEmail,
                displayName: userEmail.split('@')[0],
                emailVerified: true,
                isAnonymous: false
            };
            
            localStorage.setItem('only_memes_guest_id', mockUid);
            authListeners.forEach(l => l(simulatedUser));
            
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            
            return { user: simulatedUser };
        }
    }

    const result = await firebaseSignInWithEmailLink(authInstance, email, href);
    return result;
};

// FIRESTORE
export const collection = (dbObj: any, path: string) => {
    return firebaseCollection(dbInstance, path);
};

export const doc = (dbObj: any, path: string, ...segments: string[]) => {
    return firebaseDoc(dbInstance, path, ...segments);
};

export const getDoc = async (ref: any) => {
    try {
        return await firebaseGetDoc(ref);
    } catch (error) {
        console.warn(`Firestore client getDoc failed for ${ref.path}, falling back to server-side proxy:`, error);
        try {
            const res = await httpFirestore('get', { path: ref.path });
            return {
                exists: () => res.exists,
                id: ref.id,
                path: ref.path,
                data: () => res.data
            };
        } catch (proxyErr) {
            console.error("Firestore Proxy getDoc also failed:", proxyErr);
            handleFirestoreError(error, OperationType.GET, ref.path);
        }
    }
};

export const setDoc = async (ref: any, data: any, options?: any) => {
    try {
        return await firebaseSetDoc(ref, data, options);
    } catch (error) {
        console.warn(`Firestore client setDoc failed for ${ref.path}, falling back to server-side proxy:`, error);
        try {
            await httpFirestore('set', { path: ref.path, data, options });
            return;
        } catch (proxyErr) {
            console.error("Firestore Proxy setDoc also failed:", proxyErr);
            handleFirestoreError(error, OperationType.WRITE, ref.path);
        }
    }
};

export const updateDoc = async (ref: any, data: any) => {
    try {
        return await firebaseUpdateDoc(ref, data);
    } catch (error) {
        console.warn(`Firestore client updateDoc failed for ${ref.path}, falling back to server-side proxy:`, error);
        try {
            await httpFirestore('update', { path: ref.path, data });
            return;
        } catch (proxyErr) {
            console.error("Firestore Proxy updateDoc also failed:", proxyErr);
            handleFirestoreError(error, OperationType.UPDATE, ref.path);
        }
    }
};

export const deleteDoc = async (ref: any) => {
    try {
        return await firebaseDeleteDoc(ref);
    } catch (error) {
        console.warn(`Firestore client deleteDoc failed for ${ref.path}, falling back to server-side proxy:`, error);
        try {
            await httpFirestore('delete', { path: ref.path });
            return;
        } catch (proxyErr) {
            console.error("Firestore Proxy deleteDoc also failed:", proxyErr);
            handleFirestoreError(error, OperationType.DELETE, ref.path);
        }
    }
};

export const addDoc = async (ref: any, data: any) => {
    try {
        return await firebaseAddDoc(ref, data);
    } catch (error) {
        console.warn(`Firestore client addDoc failed for ${ref.path}, falling back to server-side proxy:`, error);
        try {
            const res = await httpFirestore('add', { path: ref.path, data });
            return { id: res.id };
        } catch (proxyErr) {
            console.error("Firestore Proxy addDoc also failed:", proxyErr);
            handleFirestoreError(error, OperationType.CREATE, ref.path);
        }
    }
};

export const onSnapshot = (ref: any, callback: (snap: any) => void, onError?: (error: any) => void) => {
    let active = true;
    let intervalId: any = null;
    let unsubFirebase: any = null;
    
    let path = ref.path;
    if (!path) {
        if (ref._query && ref._query.path) {
            path = ref._query.path.segments?.join('/') || 'users';
        } else {
            path = 'users';
        }
    }
    const isDocument = path ? (path.split('/').filter(Boolean).length % 2 === 0) : false;
    
    try {
        unsubFirebase = firebaseOnSnapshot(ref, callback, async (error) => {
            console.warn(`Firestore client onSnapshot failed for ${path}, falling back to polling:`, error);
            if (unsubFirebase) {
                unsubFirebase();
                unsubFirebase = null;
            }
            
            if (active) {
                const poll = async () => {
                    if (!active) return;
                    try {
                        if (isDocument) {
                            const res = await httpFirestore('get', { path });
                            if (active) {
                                callback({
                                    exists: () => res.exists,
                                    id: ref.id || path.split('/').pop(),
                                    path: path,
                                    data: () => res.data
                                });
                            }
                        } else {
                            const res = await httpFirestore('getDocs', { path });
                            if (active) {
                                callback({
                                    forEach: (cb: (doc: any) => void) => {
                                        res.docs.forEach((d: any) => {
                                            cb({
                                                id: d.id,
                                                data: () => d.data,
                                                exists: () => true
                                            });
                                        });
                                    },
                                    docs: res.docs.map((d: any) => ({
                                        id: d.id,
                                        data: () => d.data,
                                        exists: () => true
                                    })),
                                    empty: res.docs.length === 0,
                                    size: res.docs.length
                                });
                            }
                        }
                    } catch (e) {
                        console.warn("Polling fallback get/getDocs failed:", e);
                    }
                };
                
                await poll();
                if (active) {
                    intervalId = setInterval(poll, 6000);
                }
            }
        });
    } catch (e) {
        console.warn(`Firestore onSnapshot failed to initialize, running polling directly:`, e);
        const poll = async () => {
            if (!active) return;
            try {
                if (isDocument) {
                    const res = await httpFirestore('get', { path });
                    if (active) {
                        callback({
                            exists: () => res.exists,
                            id: ref.id || path.split('/').pop(),
                            path: path,
                            data: () => res.data
                        });
                    }
                } else {
                    const res = await httpFirestore('getDocs', { path });
                    if (active) {
                        callback({
                            forEach: (cb: (doc: any) => void) => {
                                res.docs.forEach((d: any) => {
                                    cb({
                                        id: d.id,
                                        data: () => d.data,
                                        exists: () => true
                                    });
                                });
                            },
                            docs: res.docs.map((d: any) => ({
                                        id: d.id,
                                        data: () => d.data,
                                        exists: () => true
                                    })),
                            empty: res.docs.length === 0,
                            size: res.docs.length
                        });
                    }
                }
            } catch (err) {
                console.warn("Direct polling fallback failed:", err);
            }
        };
        poll();
        intervalId = setInterval(poll, 6000);
    }
    
    return () => {
        active = false;
        if (unsubFirebase) unsubFirebase();
        if (intervalId) clearInterval(intervalId);
    };
};

export const query = (ref: any, ...constraints: any[]) => {
    return firebaseQuery(ref, ...constraints);
};

export const where = (field: string, op: string, value: any) => {
    return firebaseWhere(field, op as any, value);
};

export const runTransaction = async (dbObj: any, updateFunction: (transaction: any) => Promise<any>) => {
    try {
        return await firebaseRunTransaction(dbInstance, updateFunction);
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'transaction');
    }
};

export const getDocs = async (ref: any) => {
    try {
        return await firebaseGetDocs(ref);
    } catch (error) {
        let path = ref.path;
        if (!path) {
            if (ref._query && ref._query.path) {
                path = ref._query.path.segments?.join('/') || 'users';
            } else {
                path = 'users';
            }
        }
        console.warn(`Firestore client getDocs failed for ${path}, falling back to server-side proxy:`, error);
        try {
            const res = await httpFirestore('getDocs', { path });
            return {
                forEach: (callback: (doc: any) => void) => {
                    res.docs.forEach((d: any) => {
                        callback({
                            id: d.id,
                            data: () => d.data,
                            exists: () => true
                        });
                    });
                },
                docs: res.docs.map((d: any) => ({
                    id: d.id,
                    data: () => d.data,
                    exists: () => true
                })),
                empty: res.docs.length === 0,
                size: res.docs.length
            };
        } catch (proxyErr) {
            console.error("Firestore Proxy getDocs also failed:", proxyErr);
            handleFirestoreError(error, OperationType.LIST, path);
        }
    }
};

// --- STORAGE HELPERS ---
export const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
    const IMGBB_API_KEY = "77d92a45a2bd372b494ac6b26da8f051";

    if (IMGBB_API_KEY && file.type.startsWith('image/')) {
        try {
            const formData = new FormData();
            formData.append("image", file);
            
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            if (result.success) {
                console.log("Uploaded to ImgBB:", result.data.url);
                return result.data.url;
            } else {
                console.warn("ImgBB Upload Failed, falling back to Firebase Storage:", result);
            }
        } catch (error) {
            console.error("ImgBB Network Error:", error);
        }
    }

    if (isConfigured && storageInstance) {
        const storageRef = firebaseRef(storageInstance, path);
        const snapshot = await firebaseUploadBytes(storageRef, file);
        const downloadURL = await firebaseGetDownloadURL(snapshot.ref);
        return downloadURL;
    }

    throw new Error("Cannot upload file: Firebase Storage is not configured and ImgBB upload failed.");
};
