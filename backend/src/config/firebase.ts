import * as admin from 'firebase-admin';

let adminInitialized = false;

try {
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (serviceAccountString) {
    const serviceAccount = JSON.parse(serviceAccountString);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    adminInitialized = true;
    console.log("✅ Firebase Admin initialized successfully using environment credentials.");
  } else {
    console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT env variable is not set. Service integrations are disabled (using fallback behavior).");
  }
} catch (error: any) {
  console.error("❌ Failed to initialize Firebase Admin SDK:", error.message);
}

export { admin, adminInitialized };
