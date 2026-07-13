import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';
import nodemailer from 'nodemailer';
import admin from 'firebase-admin';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
let adminInitialized = false;
try {
  let projectId;
  const configPath = join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    projectId = configData.projectId;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId || serviceAccount.project_id
    });
    adminInitialized = true;
    console.log("Firebase Admin initialized successfully.");
  } else {
    console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT environment variable is not set. Admin features are disabled and frontend will use fallback operations.");
    adminInitialized = false;
  }
} catch (error) {
  console.warn("Failed to initialize Firebase Admin. Custom tokens will be mocked.", error);
}

// In-memory OTP store (for prototype purposes)
const otpStore = new Map<string, { otp: string, expiresAt: number }>();

let transporter: nodemailer.Transporter;

async function setupMailer() {
  const smtpUser = process.env.SMTP_USER || process.env.SMTP_USERNAME;
  const smtpPass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.SMTP_SECRET || '').replace(/\s+/g, '');

  if (smtpUser && smtpUser !== 'dummy') {
    try {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });
      await transporter.verify();
      console.log("SMTP connection verified successfully.");
      return;
    } catch (error: any) {
      console.error("Failed to verify provided SMTP credentials:", error.message);
      console.log("Falling back to Ethereal test account...");
    }
  }
  
  try {
    console.log("Creating Ethereal test account...");
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("Ethereal test account created. Emails will be logged with a preview URL.");
  } catch (error: any) {
    console.warn("Failed to create Ethereal account. Using a simulated logging transporter.", error.message);
    transporter = {
      sendMail: async (options: any) => {
        console.log("\n================ [SIMULATED EMAIL] ================");
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body: ${options.text || options.html}`);
        console.log("===================================================\n");
        return { messageId: "simulated_" + Date.now() };
      },
      verify: async () => true
    } as any;
  }
}

setupMailer();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

  // CORS Middleware to allow requests from custom domains, local testing, etc.
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Proxy for Firebase Auth custom domain (so custom domains can serve /__/auth/*)
  app.use("/__", async (req, res) => {
    const targetUrl = `https://only-memes-earn.firebaseapp.com${req.originalUrl}`;
    try {
      const cleanHeaders: any = {};
      Object.entries(req.headers).forEach(([key, val]) => {
        const lowerKey = key.toLowerCase();
        if (lowerKey !== 'host' && lowerKey !== 'accept-encoding' && lowerKey !== 'connection') {
          cleanHeaders[key] = val;
        }
      });
      cleanHeaders['host'] = 'only-memes-earn.firebaseapp.com';

      const isGetOrHead = ['GET', 'HEAD'].includes(req.method.toUpperCase());
      let requestData = isGetOrHead ? undefined : req.body;
      const contentType = req.headers['content-type'] || '';
      
      if (!isGetOrHead && contentType.includes('application/x-www-form-urlencoded') && typeof req.body === 'object' && req.body !== null) {
        const params = new URLSearchParams();
        Object.entries(req.body).forEach(([key, val]) => {
          params.append(key, String(val));
        });
        requestData = params.toString();
      }

      const response = await axios({
        method: req.method as any,
        url: targetUrl,
        data: requestData,
        headers: cleanHeaders,
        responseType: 'arraybuffer'
      });

      // Forward response headers, excluding headers that are managed by Express/Node or modified by decompression
      const headersToExclude = [
        'content-security-policy',
        'transfer-encoding',
        'content-encoding',
        'content-length',
        'connection'
      ];

      Object.entries(response.headers).forEach(([key, val]) => {
        const lowerKey = key.toLowerCase();
        if (!headersToExclude.includes(lowerKey)) {
          res.setHeader(key, val as any);
        }
      });

      res.status(response.status).send(response.data);
    } catch (error: any) {
      console.error(`Firebase Auth Proxy Error for ${targetUrl}:`, error.message);
      if (error.response) {
        // Forward headers to exclude list here as well
        const headersToExclude = [
          'content-security-policy',
          'transfer-encoding',
          'content-encoding',
          'content-length',
          'connection'
        ];
        Object.entries(error.response.headers).forEach(([key, val]) => {
          const lowerKey = key.toLowerCase();
          if (!headersToExclude.includes(lowerKey)) {
            res.setHeader(key, val as any);
          }
        });
        res.status(error.response.status).send(error.response.data);
      } else {
        res.status(500).send("Proxy error: " + error.message);
      }
    }
  });

  // API Routes
  app.get("/api/markets", async (req, res) => {
    try {
      const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OnlyMemes/1.0)' }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error('Error fetching markets:', error.message);
      res.status(500).json({ error: 'Failed to fetch markets', details: error.message });
    }
  });

  app.get("/api/candles", async (req, res) => {
    const { symbol, interval, limit } = req.query;
    const formattedSymbol = symbol ? (symbol as string).replace('/', '') : '';
    try {
      console.log(`Fetching candles for symbol: ${formattedSymbol}, interval: ${interval}, limit: ${limit || 500}`);
      const response = await axios.get(`https://api.binance.com/api/v3/klines?symbol=${formattedSymbol}&interval=${interval}&limit=${limit || 500}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OnlyMemes/1.0)' }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error('Error fetching candles:', error.message);
      res.status(500).json({ error: 'Failed to fetch candles', details: error.message });
    }
  });

  app.get("/api/depth", async (req, res) => {
    const { symbol, limit } = req.query;
    const formattedSymbol = symbol ? (symbol as string).replace('/', '') : '';
    try {
      const response = await axios.get(`https://api.binance.com/api/v3/depth?symbol=${formattedSymbol}&limit=${limit || 10}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OnlyMemes/1.0)' }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error('Error fetching depth:', error.message);
      res.status(500).json({ error: 'Failed to fetch depth', details: error.message });
    }
  });

  app.get("/api/trades", async (req, res) => {
    const { symbol, limit } = req.query;
    const formattedSymbol = symbol ? (symbol as string).replace('/', '') : '';
    try {
      const response = await axios.get(`https://api.binance.com/api/v3/trades?symbol=${formattedSymbol}&limit=${limit || 20}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OnlyMemes/1.0)' }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error('Error fetching trades:', error.message);
      res.status(500).json({ error: 'Failed to fetch trades', details: error.message });
    }
  });

  // Auth Routes
  app.post("/api/auth/send-otp", async (req, res) => {
    const { email, mode } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (adminInitialized) {
      if (mode === 'signup') {
        let exists = false;
        try {
          const db = admin.firestore();
          const userDoc = await db.collection("users").doc(normalizedEmail).get();
          if (userDoc.exists) exists = true;
        } catch (dbError: any) {
          console.warn("Firestore existing-user check warning:", dbError?.message || dbError);
        }

        if (!exists) {
          try {
            await admin.auth().getUserByEmail(normalizedEmail);
            exists = true;
          } catch (authError: any) {
            if (authError.code !== 'auth/user-not-found') {
              console.warn("Auth existing-user check warning:", authError?.message || authError);
            }
          }
        }

        if (exists) {
          return res.status(400).json({ error: 'Account already exists. Please switch to Login.' });
        }
      } else if (mode === 'forgot-password') {
        let exists = false;
        try {
          const db = admin.firestore();
          const userDoc = await db.collection("users").doc(normalizedEmail).get();
          if (userDoc.exists) exists = true;
        } catch (e) {}

        if (!exists) {
          try {
            await admin.auth().getUserByEmail(normalizedEmail);
            exists = true;
          } catch (e) {}
        }

        if (!exists) {
          return res.status(404).json({ error: 'No account found with this email. Please check your spelling or Sign Up.' });
        }
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(normalizedEmail, { otp, expiresAt });

    console.log(`\n=========================================`);
    console.log(`🔑 OTP for ${normalizedEmail}: ${otp}`);
    console.log(`=========================================\n`);

    try {
      if (!transporter) {
        throw new Error("Transporter not initialized yet");
      }
      const info = await transporter.sendMail({
        from: '"OnlyMemes Auth" <noreply@onlymemes.com>',
        to: email,
        subject: 'Your Login Code',
        text: `Your 6-digit login code is: ${otp}. It expires in 10 minutes.`,
        html: `<p>Your 6-digit login code is: <strong>${otp}</strong>. It expires in 10 minutes.</p>`
      });
      
      let isTestAccount = !process.env.SMTP_USER || process.env.SMTP_USER === 'dummy';
      if (info.messageId && nodemailer.getTestMessageUrl(info)) {
        isTestAccount = true;
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      }
      res.json({ 
        success: true, 
        message: isTestAccount ? 'OTP generated (Dev Mode)' : 'OTP sent successfully',
        isSimulated: isTestAccount,
        otp: isTestAccount ? otp : undefined
      });
    } catch (error: any) {
      console.error('Error sending email:', error);
      res.json({ 
        success: true, 
        message: 'OTP generated (Simulation fallback)', 
        isSimulated: true, 
        otp 
      });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedOtp = otp.trim();

    console.log(`\n=========================================`);
    console.log(`🔍 Verifying OTP for ${normalizedEmail}. Provided OTP: '${normalizedOtp}'`);

    const storedData = otpStore.get(normalizedEmail);
    if (!storedData) {
      console.log(`❌ No OTP found in store for ${normalizedEmail}. Current store keys:`, Array.from(otpStore.keys()));
      return res.status(400).json({ error: 'No OTP found for this email' });
    }

    if (Date.now() > storedData.expiresAt) {
      console.log(`❌ OTP expired for ${normalizedEmail}`);
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ error: 'OTP has expired' });
    }

    if (storedData.otp !== normalizedOtp) {
      console.log(`❌ Invalid OTP for ${normalizedEmail}. Expected: '${storedData.otp}', Got: '${normalizedOtp}'`);
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    console.log(`✅ OTP verified successfully for ${normalizedEmail}`);
    console.log(`=========================================\n`);

    // OTP is valid
    otpStore.delete(normalizedEmail);

    try {
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ error: 'Failed to verify OTP' });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedOtp = otp.trim();

    const storedData = otpStore.get(normalizedEmail);
    if (!storedData) {
      return res.status(400).json({ error: 'No OTP found for this email' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ error: 'OTP has expired' });
    }

    if (storedData.otp !== normalizedOtp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP is valid
    otpStore.delete(normalizedEmail);

    if (!adminInitialized) {
      return res.status(500).json({ error: 'Firebase Admin not initialized on server. Cannot reset password.' });
    }

    try {
      const userRecord = await admin.auth().getUserByEmail(normalizedEmail);
      await admin.auth().updateUser(userRecord.uid, { password: newPassword });
      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if it's a permission/credential error
      if (error.message && (error.message.includes('Identity Toolkit API') || error.message.includes('credential'))) {
         return res.status(500).json({ 
           error: 'Server lacks permission to update passwords. A Firebase Service Account key must be provided in the environment variables (FIREBASE_SERVICE_ACCOUNT) to use custom OTP password resets.' 
         });
      }

      res.status(500).json({ error: error.message || 'Failed to reset password' });
    }
  });

  app.post("/api/auth/send-signin-link", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
      const actionCodeSettings = {
        url: `${req.protocol}://${req.get('host')}/`, // Redirect back to homepage
        handleCodeInApp: true,
      };

      let link = '';
      let isSimulated = false;

      if (adminInitialized) {
        try {
          link = await admin.auth().generateSignInWithEmailLink(normalizedEmail, actionCodeSettings);
        } catch (e: any) {
          console.warn("generateSignInWithEmailLink failed, falling back to simulated link:", e?.message || e);
          link = `${req.protocol}://${req.get('host')}/?email=${encodeURIComponent(normalizedEmail)}&loginToken=mock_${Math.random().toString(36).substring(2, 12)}`;
          isSimulated = true;
        }
      } else {
        link = `${req.protocol}://${req.get('host')}/?email=${encodeURIComponent(normalizedEmail)}&loginToken=mock_${Math.random().toString(36).substring(2, 12)}`;
        isSimulated = true;
      }

      if (transporter) {
        await transporter.sendMail({
          from: '"OnlyMemes Earn" <noreply@onlymemesearn.store>',
          to: normalizedEmail,
          subject: 'Your OnlyMemes Earn Magic Login Link 🚀',
          text: `Welcome! Click this link to sign in to OnlyMemes Earn: ${link}`,
          html: `
            <div style="font-family: sans-serif; padding: 24px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; background-color: #000; color: #fff;">
              <h2 style="color: #fbbf24; margin-top: 0; text-align: center; font-size: 28px;">OnlyMemes Earn 🚀</h2>
              <p style="font-size: 16px; text-align: center; color: #ccc;">You requested a secure login link. Click the button below to sign in or create your account instantly:</p>
              <div style="margin: 36px 0; text-align: center;">
                <a href="${link}" style="background-color: #fbbf24; color: black; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 900; display: inline-block; font-size: 16px; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);">Sign In Instantly</a>
              </div>
              <p style="font-size: 13px; color: #888; line-height: 1.5; text-align: center;">If the button doesn't work, copy and paste this URL into your web browser:</p>
              <p style="font-size: 12px; color: #fbbf24; word-break: break-all; font-family: monospace; text-align: center; background-color: #111; padding: 12px; border-radius: 8px;">${link}</p>
              <hr style="border: 0; border-top: 1px solid #222; margin: 24px 0;">
              <p style="font-size: 11px; color: #666; text-align: center;">If you did not request this, you can safely ignore this email.</p>
            </div>
          `
        });
      }

      const isTestAccount = isSimulated || !process.env.SMTP_USER || process.env.SMTP_USER === 'dummy';

      res.json({
        success: true,
        message: isTestAccount ? 'Magic link generated (Dev Mode)' : 'Magic link sent successfully',
        isSimulated: isTestAccount,
        link: isTestAccount ? link : undefined
      });
    } catch (error: any) {
      console.error('Error sending magic link:', error);
      res.status(500).json({ error: error.message || 'Failed to send magic link' });
    }
  });

  app.post("/api/auth/send-verification-email", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!adminInitialized) {
      return res.status(500).json({ error: 'Firebase Admin not initialized on server.' });
    }

    try {
      // 1. Generate the link that verifies the user
      const actionCodeSettings = {
        url: `${req.protocol}://${req.get('host')}/`, // Redirect back to front page upon verification
        handleCodeInApp: true,
      };
      const link = await admin.auth().generateEmailVerificationLink(normalizedEmail, actionCodeSettings);

      // 2. Send the email using Nodemailer
      if (!transporter) {
        throw new Error("Transporter not initialized");
      }
      
      const info = await transporter.sendMail({
        from: '"OnlyMemes Earn Support" <noreply@onlymemesearn.store>',
        to: normalizedEmail,
        subject: 'Verify Your Email Address',
        text: `Welcome! Please click the following link to verify your email address: ${link}`,
        html: `
          <div style="font-family: sans-serif; padding: 24px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #4f46e5; margin-top: 0;">Welcome to OnlyMemes Earn!</h2>
            <p>Thank you for registering. Please click the button below to verify your email address and activate your account:</p>
            <div style="margin: 32px 0; text-align: center;">
              <a href="${link}" style="background-color: #4f46e5; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Verify Email Address</a>
            </div>
            <p style="font-size: 13px; color: #666; line-height: 1.5;">If the button doesn't work, you can copy and paste the following URL into your web browser:</p>
            <p style="font-size: 13px; color: #4f46e5; word-break: break-all; font-family: monospace;">${link}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="font-size: 12px; color: #999;">If you did not request this email, you can safely ignore it.</p>
          </div>
        `
      });

      let isTestAccount = !process.env.SMTP_USER || process.env.SMTP_USER === 'dummy';
      if (info.messageId && nodemailer.getTestMessageUrl(info)) {
        isTestAccount = true;
        console.log("Custom Verification Email Preview URL: %s", nodemailer.getTestMessageUrl(info));
      }

      res.json({ 
        success: true, 
        message: isTestAccount ? 'Verification email generated (Dev Mode)' : 'Verification email sent' ,
        isSimulated: isTestAccount,
        link: isTestAccount ? link : undefined
      });
    } catch (error: any) {
      console.error('Error sending custom verification email:', error);
      res.status(500).json({ error: error.message || 'Failed to send verification email' });
    }
  });

  app.post("/api/auth/telegram", async (req, res) => {
    if (!adminInitialized) return res.status(500).json({ error: 'Firebase Admin not initialized' });
    
    try {
        const { initData } = req.body;
        if (!initData) return res.status(400).json({ error: 'Missing initData' });
        
        const botToken = "8612277943:AAG54QY-maZ6B3sRRX68YIApGQ6OaFmgA3g";
        
        const q = new URLSearchParams(initData);
        const hash = q.get('hash');
        q.delete('hash');
        
        const keys = Array.from(q.keys());
        keys.sort();
        const dataCheckString = keys.map(k => `${k}=${q.get(k)}`).join('\n');
        
        const crypto = await import('crypto');
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
        
        if (calculatedHash !== hash) {
            return res.status(401).json({ error: 'Invalid Telegram hash' });
        }
        
        const userStr = q.get('user');
        if (!userStr) return res.status(400).json({ error: 'Missing user data' });
        
        const user = JSON.parse(userStr);
        const uid = `telegram_${user.id}`;
        const email = `${uid}@tg.onlymemesearn.store`;
        
        try {
            await admin.auth().updateUser(uid, {
                displayName: user.username ? `@${user.username}` : user.first_name,
                ...(user.photo_url && { photoURL: user.photo_url })
            });
        } catch (e: any) {
            if (e.code === 'auth/user-not-found') {
                await admin.auth().createUser({
                    uid,
                    email,
                    displayName: user.username ? `@${user.username}` : user.first_name,
                    ...(user.photo_url && { photoURL: user.photo_url }),
                    emailVerified: true
                });
            } else {
                throw e;
            }
        }
        
        const customToken = await admin.auth().createCustomToken(uid, { email: email });
        res.json({ token: customToken, user });
    } catch (error: any) {
        console.error("Telegram auth failed:", error);
        res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/guest", async (req, res) => {
    try {
        const { guestId } = req.body;
        let finalGuestId = guestId;
        
        if (!finalGuestId) {
            const crypto = await import('crypto');
            finalGuestId = `guest_${crypto.randomBytes(8).toString('hex')}`;
        }
        
        const email = `${finalGuestId}@guest.onlymemesearn.store`;
        
        if (adminInitialized) {
            try {
                await admin.auth().getUser(finalGuestId);
            } catch (e: any) {
                if (e.code === 'auth/user-not-found') {
                    await admin.auth().createUser({
                        uid: finalGuestId,
                        email,
                        displayName: 'Guest User',
                        emailVerified: true
                    });
                } else {
                    throw e;
                }
            }
            const customToken = await admin.auth().createCustomToken(finalGuestId, { email });
            return res.json({ success: true, token: customToken, guestId: finalGuestId });
        } else {
            return res.status(500).json({ error: 'Firebase Admin not initialized on the server.' });
        }
    } catch (error: any) {
        console.error("Guest authentication failed:", error);
        res.status(500).json({ error: error.message });
    }
  });

  // Firestore REST Proxy Endpoints
  app.post("/api/firestore/get", async (req, res) => {
    if (!adminInitialized) return res.status(500).json({ error: 'Firebase Admin not initialized' });
    try {
      const { path } = req.body;
      if (!path) return res.status(400).json({ error: "Missing path" });
      
      const isDocument = path ? (path.split('/').filter(Boolean).length % 2 === 0) : false;
      if (!isDocument) {
        // Fallback to getting collection docs if it's not a document path
        const snap = await admin.firestore().collection(path).get();
        const docs = snap.docs.map((d: any) => ({ id: d.id, data: d.data() }));
        return res.json({ exists: true, docs, data: { docs } });
      }

      const docSnap = await admin.firestore().doc(path).get();
      if (docSnap.exists) {
        return res.json({ exists: true, data: docSnap.data() });
      } else {
        return res.json({ exists: false });
      }
    } catch (error: any) {
      console.error("Firestore Proxy Get failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/firestore/set", async (req, res) => {
    if (!adminInitialized) return res.status(500).json({ error: 'Firebase Admin not initialized' });
    try {
      const { path, data, options } = req.body;
      if (!path) return res.status(400).json({ error: "Missing path" });
      await admin.firestore().doc(path).set(data, options || {});
      res.json({ success: true });
    } catch (error: any) {
      console.error("Firestore Proxy Set failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/firestore/update", async (req, res) => {
    if (!adminInitialized) return res.status(500).json({ error: 'Firebase Admin not initialized' });
    try {
      const { path, data } = req.body;
      if (!path) return res.status(400).json({ error: "Missing path" });
      await admin.firestore().doc(path).update(data);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Firestore Proxy Update failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/firestore/delete", async (req, res) => {
    if (!adminInitialized) return res.status(500).json({ error: 'Firebase Admin not initialized' });
    try {
      const { path } = req.body;
      if (!path) return res.status(400).json({ error: "Missing path" });
      await admin.firestore().doc(path).delete();
      res.json({ success: true });
    } catch (error: any) {
      console.error("Firestore Proxy Delete failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/firestore/add", async (req, res) => {
    if (!adminInitialized) return res.status(500).json({ error: 'Firebase Admin not initialized' });
    try {
      const { path, data } = req.body;
      if (!path) return res.status(400).json({ error: "Missing path" });
      const ref = await admin.firestore().collection(path).add(data);
      res.json({ id: ref.id });
    } catch (error: any) {
      console.error("Firestore Proxy Add failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/firestore/getDocs", async (req, res) => {
    if (!adminInitialized) return res.status(500).json({ error: 'Firebase Admin not initialized' });
    try {
      const { path } = req.body;
      if (!path) return res.status(400).json({ error: "Missing path" });
      const snap = await admin.firestore().collection(path).get();
      const docs = snap.docs.map((d: any) => ({ id: d.id, data: d.data() }));
      res.json({ docs });
    } catch (error: any) {
      console.error("Firestore Proxy GetDocs failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/withdraw/check-uid", async (req, res) => {
    if (!adminInitialized) return res.status(500).json({ error: 'Firebase Admin not initialized' });
    try {
      const { uid, email } = req.body;
      if (!uid) return res.status(400).json({ error: "Missing uid" });
      
      const cleanUid = uid.toString().trim();
      if (!cleanUid) return res.status(400).json({ error: "Missing uid" });

      const db = admin.firestore();
      const usersSnap = await db.collection("users").get();
      
      let exists = false;
      let associatedEmail = "";
      
      for (const doc of usersSnap.docs) {
        if (doc.id === email) {
          continue; // Skip the checking user themselves
        }
        const data = doc.data();
        
        // Check gameUid
        if (data.gameUid && data.gameUid.toString().trim() === cleanUid) {
          exists = true;
          associatedEmail = doc.id;
          break;
        }
        
        // Check exchangeUids
        if (data.exchangeUids) {
          const uids = Object.values(data.exchangeUids);
          if (uids.some((u: any) => u && u.toString().trim() === cleanUid)) {
            exists = true;
            associatedEmail = doc.id;
            break;
          }
        }
        
        // Check pendingExchangeUids
        if (data.pendingExchangeUids) {
          const uids = Object.values(data.pendingExchangeUids);
          if (uids.some((u: any) => u && u.toString().trim() === cleanUid)) {
            exists = true;
            associatedEmail = doc.id;
            break;
          }
        }
      }

      return res.json({ exists, email: associatedEmail });
    } catch (error: any) {
      console.error("Check UID failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Trading API
  app.post("/api/trade", async (req, res) => {
    if (!adminInitialized) return res.status(500).json({ error: 'Firebase Admin not initialized' });
    const { email, pair, type, orderType, amount, price } = req.body;
    
    if (!email || !pair || !type || !orderType || !amount || !price) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const db = admin.firestore();
    const userRef = db.collection("users").doc(email);
    const [base, quote] = pair.split('/');
    
    try {
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("User not found");
        const userData = userDoc.data()!;

        // Find market - since markets is a collection, we search by components or id
        const marketQuery = await db.collection("markets").where("base", "==", base).where("quote", "==", quote).limit(1).get();
        if (marketQuery.empty) throw new Error("Market not found");
        const marketDoc = marketQuery.docs[0];
        const marketRef = marketDoc.ref;
        const marketData = marketDoc.data()!;

        if (amount <= 0 || price <= 0) throw new Error("Invalid amount or price");

        const totalCost = amount * price;
        const userBalance = userData.balance || {};

        if (type === 'buy') {
          if ((userBalance[quote] || 0) < totalCost) throw new Error(`Insufficient ${quote} balance`);
        } else {
          if ((userBalance[base] || 0) < amount) throw new Error(`Insufficient ${base} balance`);
        }

        let remainingAmount = amount;
        let filledQuoteAmount = 0;
        let filledBaseAmount = 0;
        const newTrades: any[] = [];
        let bids = [...(marketData.bids || [])];
        let asks = [...(marketData.asks || [])];
        let currentPrice = marketData.price || 0;

        const userCache: Record<string, any> = { [email]: { ref: userRef, data: userData } };

        if (type === 'buy') {
          asks.sort((a, b) => a.price - b.price);
          for (let i = 0; i < asks.length; i++) {
            const ask = asks[i];
            if (remainingAmount <= 0 || (orderType === 'limit' && ask.price > price)) break;
            const matchAmount = Math.min(remainingAmount, ask.amount);
            remainingAmount -= matchAmount;
            ask.amount -= matchAmount;
            filledBaseAmount += matchAmount;
            filledQuoteAmount += matchAmount * ask.price;
            currentPrice = ask.price;

            if (ask.userId) {
              if (!userCache[ask.userId]) {
                const sellerDoc = await transaction.get(db.collection("users").doc(ask.userId));
                if (sellerDoc.exists) userCache[ask.userId] = { ref: sellerDoc.ref, data: sellerDoc.data() };
              }
              const seller = userCache[ask.userId];
              if (seller) {
                seller.data.balance = seller.data.balance || {};
                seller.data.balance[quote] = (seller.data.balance[quote] || 0) + (matchAmount * ask.price);
                const oIdx = (seller.data.openOrders || []).findIndex((o: any) => o.id === ask.orderId);
                if (oIdx !== -1) {
                  seller.data.openOrders[oIdx].amount -= matchAmount;
                  if (seller.data.openOrders[oIdx].amount <= 0.00000001) seller.data.openOrders.splice(oIdx, 1);
                }
              }
            }
            newTrades.push({ id: `trade_${Date.now()}_${i}`, time: new Date().toISOString(), price: ask.price, amount: matchAmount, type: 'buy' });
          }
          asks = asks.filter(a => a.amount > 0.00000001);
        } else {
          bids.sort((a, b) => b.price - a.price);
          for (let i = 0; i < bids.length; i++) {
            const bid = bids[i];
            if (remainingAmount <= 0 || (orderType === 'limit' && bid.price < price)) break;
            const matchAmount = Math.min(remainingAmount, bid.amount);
            remainingAmount -= matchAmount;
            bid.amount -= matchAmount;
            filledBaseAmount += matchAmount;
            filledQuoteAmount += matchAmount * bid.price;
            currentPrice = bid.price;

            if (bid.userId) {
              if (!userCache[bid.userId]) {
                const buyerDoc = await transaction.get(db.collection("users").doc(bid.userId));
                if (buyerDoc.exists) userCache[bid.userId] = { ref: buyerDoc.ref, data: buyerDoc.data() };
              }
              const buyer = userCache[bid.userId];
              if (buyer) {
                buyer.data.balance = buyer.data.balance || {};
                buyer.data.balance[base] = (buyer.data.balance[base] || 0) + matchAmount;
                const oIdx = (buyer.data.openOrders || []).findIndex((o: any) => o.id === bid.orderId);
                if (oIdx !== -1) {
                  buyer.data.openOrders[oIdx].amount -= matchAmount;
                  if (buyer.data.openOrders[oIdx].amount <= 0.00000001) buyer.data.openOrders.splice(oIdx, 1);
                }
              }
            }
            newTrades.push({ id: `trade_${Date.now()}_${i}`, time: new Date().toISOString(), price: bid.price, amount: matchAmount, type: 'sell' });
          }
          bids = bids.filter(b => b.amount > 0.00000001);
        }

        const openOrders = [...(userData.openOrders || [])];
        const orderId = `order_${Date.now()}`;
        if (remainingAmount > 0.00000001 && orderType === 'limit') {
          openOrders.push({ id: orderId, pair, type, orderType, amount: remainingAmount, price, status: 'open', timestamp: Date.now() });
          const orderInBook = { price, amount: remainingAmount, userId: email, orderId };
          if (type === 'buy') { bids.push(orderInBook); bids.sort((a, b) => b.price - a.price); }
          else { asks.push(orderInBook); asks.sort((a, b) => a.price - b.price); }
        }

        transaction.update(marketRef, { bids, asks, trades: [...(marketData.trades || []), ...newTrades], price: currentPrice });
        
        const myUser = userCache[email];
        if (type === 'buy') {
          myUser.data.balance[quote] = (myUser.data.balance[quote] || 0) - (filledQuoteAmount + (orderType === 'limit' ? remainingAmount * price : 0));
          myUser.data.balance[base] = (myUser.data.balance[base] || 0) + filledBaseAmount;
        } else {
          myUser.data.balance[base] = (myUser.data.balance[base] || 0) - (filledBaseAmount + (orderType === 'limit' ? remainingAmount : 0));
          myUser.data.balance[quote] = (myUser.data.balance[quote] || 0) + filledQuoteAmount;
        }
        myUser.data.openOrders = openOrders;

        for (const uid in userCache) {
          transaction.update(userCache[uid].ref, { balance: userCache[uid].data.balance, openOrders: userCache[uid].data.openOrders });
        }
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Trade API failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/trade/cancel", async (req, res) => {
    if (!adminInitialized) return res.status(500).json({ error: 'Firebase Admin not initialized' });
    const { email, orderId } = req.body;
    if (!email || !orderId) return res.status(400).json({ error: 'Missing email or orderId' });

    const db = admin.firestore();
    const userRef = db.collection("users").doc(email);

    try {
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("User not found");
        const userData = userDoc.data()!;
        const openOrders = userData.openOrders || [];
        const order = openOrders.find((o: any) => o.id === orderId);
        if (!order) throw new Error("Order not found");

        const newOpenOrders = openOrders.filter((o: any) => o.id !== orderId);
        const newBalances = { ...userData.balance };
        const [base, quote] = order.pair.split('/');

        if (order.type === 'buy') {
          newBalances[quote] = (newBalances[quote] || 0) + (order.price * order.amount);
        } else {
          newBalances[base] = (newBalances[base] || 0) + order.amount;
        }

        const marketQuery = await db.collection("markets").where("base", "==", base).where("quote", "==", quote).limit(1).get();
        if (!marketQuery.empty) {
          const marketRef = marketQuery.docs[0].ref;
          const marketData = marketQuery.docs[0].data();
          let bids = [...(marketData.bids || [])];
          let asks = [...(marketData.asks || [])];

          if (order.type === 'buy') {
            const bIdx = bids.findIndex(b => b.orderId === orderId);
            if (bIdx !== -1) bids[bIdx].amount -= order.amount;
            bids = bids.filter(b => b.amount > 0.00000001);
            transaction.update(marketRef, { bids });
          } else {
            const aIdx = asks.findIndex(a => a.orderId === orderId);
            if (aIdx !== -1) asks[aIdx].amount -= order.amount;
            asks = asks.filter(a => a.amount > 0.00000001);
            transaction.update(marketRef, { asks });
          }
        }
        transaction.update(userRef, { openOrders: newOpenOrders, balance: newBalances });
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Cancel trade failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/task/claim", async (req, res) => {
    if (!adminInitialized) return res.status(500).json({ error: 'Firebase Admin not initialized' });
    const { email, taskId, type, reward, rewardToken, taskTitle } = req.body;
    if (!email || !taskId || !type) return res.status(400).json({ error: 'Missing parameters' });

    const db = admin.firestore();
    const userRef = db.collection("users").doc(email);

    try {
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("User not found");
        const userData = userDoc.data()!;
        
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
          rewardAmount = Number(reward);
          tokenSymbol = rewardToken || 'USHA';
        } else {
          throw new Error("No approved proof found and no reward details provided");
        }

        const newBalances = { ...userData.balance };
        newBalances[tokenSymbol] = (newBalances[tokenSymbol] || 0) + rewardAmount;
        
        const updatedProof = {
          ...(proof || {
            proofUrl: 'auto_approved_claim_backend',
            taskTitle: taskTitle || 'Task Reward',
            submittedAt: new Date().toISOString(),
            startedAt: new Date().toISOString()
          }),
          status: 'claimed',
          reward: rewardAmount,
          rewardToken: tokenSymbol
        };

        let taskRef: any = null;
        let taskDoc: any = null;

        const taskCollection = type === 'youtube' ? 'youtubeTasks' :
                               type === 'telegram' ? 'telegramTasks' :
                               type === 'facebook' ? 'facebookTasks' :
                               type === 'instagram' ? 'instagramTasks' :
                               type === 'twitter' ? 'twitterTasks' :
                               type === 'tiktok' ? 'tiktokTasks' :
                               type === 'appDownload' || type === 'app_download' ? 'appDownloadTasks' :
                               type === 'video' ? 'videos' :
                               type === 'other' ? 'otherTasks' :
                               null;

        if (taskCollection) {
          taskRef = db.collection(taskCollection).doc(taskId);
          taskDoc = await transaction.get(taskRef);
        }

        const newProofs = { ...proofs, [taskId]: updatedProof };
        
        const tapGameData = userData.tapGameData || {};
        const history = tapGameData.history || [];
        const newTx = { id: Date.now(), type: 'Earned', amount: rewardAmount.toString(), token: tokenSymbol, date: new Date().toISOString(), isPositive: true };
        const newTapGameData = { ...tapGameData, history: [...history, newTx] };

        // --- ALL READS ABOVE THIS LINE ---

        transaction.update(userRef, { balance: newBalances, [field]: newProofs, tapGameData: newTapGameData });

        if (taskRef && taskDoc && taskDoc.exists) {
          transaction.update(taskRef, {
            claimCount: admin.firestore.FieldValue.increment(1)
          });
        }
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Claim task failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Notification Route
  app.post("/api/notify", async (req, res) => {
    const { title, body, uid, topic } = req.body;
    
    if (!adminInitialized) {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    try {
        if (uid) {
            // Send to specific user
            const userDoc = await admin.firestore().collection('users').doc(uid).collection('fcm').doc('token').get();
            if (userDoc.exists) {
                const token = userDoc.data()?.token;
                if (token) {
                    await admin.messaging().send({
                        token,
                        notification: { title, body }
                    });
                    return res.json({ success: true, message: 'Notification sent to user.' });
                }
            }
            return res.status(404).json({ error: 'User FCM token not found.' });
        } else if (topic) {
            // Send to topic (e.g. 'all_users')
            await admin.messaging().send({
               topic,
               notification: { title, body }
            });
            return res.json({ success: true, message: 'Notification sent to topic.' });
        } else {
            return res.status(400).json({ error: 'Must provide either uid or topic' });
        }
    } catch (error: any) {
        console.error('Error sending notification:', error);
        res.status(500).json({ error: error.message || 'Failed to send notification' });
    }
  });

  app.post("/api/subscribe", async (req, res) => {
    const { token, topic } = req.body;
    if (!adminInitialized) {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }
    try {
      await admin.messaging().subscribeToTopic(token, topic);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error subscribing to topic:', error);
      res.status(500).json({ error: error.message || 'Failed to subscribe' });
    }
  });

  // --- Proxy Routes for Videos and Games (Bypasses Client-side Security Rules) ---
  app.get("/api/videos", async (req, res) => {
    if (!adminInitialized) return res.status(500).json({ error: 'Firebase Admin not initialized' });
    try {
      const db = admin.firestore();
      const snap = await db.collection("videos").get();
      const list: any[] = [];
      snap.forEach(doc => {
        list.push({ ...doc.data() });
      });
      res.json(list);
    } catch (error: any) {
      console.error("Get videos failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/videos", async (req, res) => {
    if (!adminInitialized) return res.status(500).json({ error: 'Firebase Admin not initialized' });
    try {
      const db = admin.firestore();
      const video = req.body;
      if (!video || !video.id) return res.status(400).json({ error: 'Missing video or video id' });
      await db.collection("videos").doc(video.id).set(video);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Add/Update video failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/videos/:id", async (req, res) => {
    if (!adminInitialized) return res.status(500).json({ error: 'Firebase Admin not initialized' });
    try {
      const db = admin.firestore();
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'Missing id param' });
      await db.collection("videos").doc(id).delete();
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete video failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/games", async (req, res) => {
    if (!adminInitialized) return res.status(500).json({ error: 'Firebase Admin not initialized' });
    try {
      const db = admin.firestore();
      const snap = await db.collection("games").get();
      const list: any[] = [];
      snap.forEach(doc => {
        list.push({ ...doc.data(), id: doc.id });
      });
      res.json(list);
    } catch (error: any) {
      console.error("Get games failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/games", async (req, res) => {
    if (!adminInitialized) return res.status(500).json({ error: 'Firebase Admin not initialized' });
    try {
      const db = admin.firestore();
      const game = req.body;
      if (!game || !game.id) return res.status(400).json({ error: 'Missing game or game id' });
      await db.collection("games").doc(game.id).set(game);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Add/Update game failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/games/:id", async (req, res) => {
    if (!adminInitialized) return res.status(500).json({ error: 'Firebase Admin not initialized' });
    try {
      const db = admin.firestore();
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'Missing id param' });
      await db.collection("games").doc(id).delete();
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete game failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Global JSON error handler for API routes
  app.use("/api", (err: any, req: any, res: any, next: any) => {
    console.error("API error occurred:", err);
    res.status(err.status || 500).json({
      error: err.message || "An unexpected error occurred on the server."
    });
  });

if (process.env.NODE_ENV !== "production") {
  import("vite").then(({ createServer: createViteServer }) => {
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then((vite) => {
      app.use(vite.middlewares);
    }).catch((err) => {
      console.warn("Failed to mount Vite middleware:", err.message);
    });
  }).catch(() => {
    console.warn("Vite not found, skipping dev server setup.");
  });
} else {
  // Serve static files in production
  const distPath = join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
