import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';
import nodemailer from 'nodemailer';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
let adminInitialized = false;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    admin.initializeApp();
  }
  adminInitialized = true;
  console.log("Firebase Admin initialized successfully.");
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
}

setupMailer();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
    const { email, taskId, type } = req.body;
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
                      type === 'appDownload' ? 'appDownloadTaskProofs' : 
                      type === 'video' ? 'videoProofs' :
                      'otherTaskProofs';

        const proofs = userData[field] || {};
        const proof = proofs[taskId];
        if (!proof || proof.status !== 'approved') throw new Error("No approved proof found");

        const newBalances = { ...userData.balance };
        newBalances[proof.rewardToken] = (newBalances[proof.rewardToken] || 0) + proof.reward;
        
        const newProofs = { ...proofs, [taskId]: { ...proof, status: 'claimed' } };
        transaction.update(userRef, { balance: newBalances, [field]: newProofs });
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
            // Send to topic (e.g. 'all_users', 'new_tasks')
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

  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Vite not found, skipping dev server setup.");
    }
  } else {
    // Serve static files in production
    const distPath = join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
