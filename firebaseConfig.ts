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

if (typeof window !== 'undefined') {
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    console.error = function (...args: any[]) {
        const sanitizedArgs = args.map(safeSanitize);
        originalError.apply(console, sanitizedArgs);
    };

    console.warn = function (...args: any[]) {
        const sanitizedArgs = args.map(safeSanitize);
        originalWarn.apply(console, sanitizedArgs);
    };

    console.log = function (...args: any[]) {
        const sanitizedArgs = args.map(safeSanitize);
        originalLog.apply(console, sanitizedArgs);
    };
}
import { getAnalytics, isSupported } from "firebase/analytics";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup as firebaseSignInWithPopup, 
    signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
    createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    sendEmailVerification as firebaseSendEmailVerification,
    sendPasswordResetEmail as firebaseSendPasswordResetEmail,
    reload as firebaseReload,
    signInWithCustomToken as firebaseSignInWithCustomToken
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

const firebaseConfig = {
  ...firebaseConfigData
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
  console.error('Firestore Error: ', errorJson);
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
            const token = await getToken(messagingInstance);
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

// AUTH
export const signInWithPopup = (authObj: any, provider: any) => {
    return firebaseSignInWithPopup(authInstance, provider);
};

export const signInWithCustomToken = (authObj: any, token: string) => {
    return firebaseSignInWithCustomToken(authInstance, token);
};

export const signInWithEmailAndPassword = (authObj: any, email: string, pass: string) => {
    return firebaseSignInWithEmailAndPassword(authInstance, email, pass);
};

export const createUserWithEmailAndPassword = (authObj: any, email: string, pass: string) => {
    return firebaseCreateUserWithEmailAndPassword(authInstance, email, pass);
};

export const signOut = (authObj: any) => {
    return firebaseSignOut(authInstance);
};

export const onAuthStateChangedWrapper = (authObj: any, callback: (user: any) => void) => {
    return firebaseOnAuthStateChanged(authInstance, callback);
};

export const sendEmailVerification = (user: any) => {
    return firebaseSendEmailVerification(user);
};

export const sendPasswordResetEmail = (authObj: any, email: string) => {
    return firebaseSendPasswordResetEmail(authInstance, email);
};

export const reload = (user: any) => {
    return firebaseReload(user);
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
        handleFirestoreError(error, OperationType.GET, ref.path);
    }
};

export const setDoc = async (ref: any, data: any, options?: any) => {
    try {
        return await firebaseSetDoc(ref, data, options);
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, ref.path);
    }
};

export const updateDoc = async (ref: any, data: any) => {
    try {
        return await firebaseUpdateDoc(ref, data);
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, ref.path);
    }
};

export const deleteDoc = async (ref: any) => {
    try {
        return await firebaseDeleteDoc(ref);
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, ref.path);
    }
};

export const addDoc = async (ref: any, data: any) => {
    try {
        return await firebaseAddDoc(ref, data);
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, ref.path);
    }
};

export const onSnapshot = (ref: any, callback: (snap: any) => void, onError?: (error: any) => void) => {
    return firebaseOnSnapshot(ref, callback, (error) => {
        if (onError) onError(error);
        else handleFirestoreError(error, OperationType.GET, ref.path);
    });
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
        handleFirestoreError(error, OperationType.LIST, ref.path || 'unknown');
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
