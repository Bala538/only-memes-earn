import { Request, Response } from 'express';
import { admin, adminInitialized } from '../config/firebase';
import { getTransporter } from '../config/mailer';

// In-memory OTP database (keys are lowercase normalized emails)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export const sendOtp = async (req: Request, res: Response) => {
  const { email, mode } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // If Firebase Admin is active, check user presence based on intent
  if (adminInitialized) {
    try {
      let userExists = false;
      const db = admin.firestore();
      
      try {
        const userDoc = await db.collection('users').doc(normalizedEmail).get();
        if (userDoc.exists) userExists = true;
      } catch (dbError) {
        console.warn("Firestore collection verification bypass:", dbError);
      }

      if (!userExists) {
        try {
          await admin.auth().getUserByEmail(normalizedEmail);
          userExists = true;
        } catch (authError: any) {
          if (authError.code !== 'auth/user-not-found') {
            console.warn("Auth check bypass:", authError.message);
          }
        }
      }

      if (mode === 'signup' && userExists) {
        return res.status(400).json({ error: 'An account with this email address already exists. Please choose Login.' });
      }

      if (mode === 'forgot-password' && !userExists) {
        return res.status(404).json({ error: 'No account found with this email. Please check your spelling or register a new account.' });
      }
    } catch (firebaseCheckError: any) {
      console.error("Firebase Auth verify warning:", firebaseCheckError.message);
    }
  }

  // Generate a random 6-digit numerical OTP code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes lifespan

  otpStore.set(normalizedEmail, { otp, expiresAt });

  console.log(`\n🔑 Generated OTP for ${normalizedEmail} -> ${otp}\n`);

  try {
    const transporter = getTransporter();
    const fromName = process.env.SMTP_FROM_NAME || 'OnlyMemes Earn Support';
    const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@onlymemesearn.store';

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: normalizedEmail,
      subject: 'Your Login Code - OnlyMemes Earn',
      text: `Your 6-digit confirmation code is: ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">OnlyMemes Earn Verification</h2>
          <p>Hello,</p>
          <p>To verify your identity, please input the following 6-digit OTP code:</p>
          <div style="background-color: #f7f7f7; border-radius: 8px; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #FFC107; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #aaa; text-align: center;">Sent securely on behalf of OnlyMemes Earn Support</p>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'OTP sent successfully to your email.'
    });
  } catch (error: any) {
    console.error("SMTP Delivery failed:", error);
    // Return simulated response for seamless sandbox offline fallback
    res.json({
      success: true,
      message: 'OTP generated (Simulation mode)',
      isSimulated: true,
      otp // Provide code directly to client for debugging / offline flow of sandbox
    });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ error: 'Both email and otp parameters are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedOtp = otp.trim();

  const record = otpStore.get(normalizedEmail);
  if (!record) {
    return res.status(400).json({ error: 'No OTP generated for this email. Please request a new one.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return res.status(400).json({ error: 'Your OTP has expired. Please request a new one.' });
  }

  if (record.otp !== normalizedOtp) {
    return res.status(400).json({ error: 'Invalid verification code.' });
  }

  // Code validated successfully, destroy it to prevent replay attacks
  otpStore.delete(normalizedEmail);

  return res.json({
    success: true,
    message: 'OTP verified successfully.'
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'Email, otp, and newPassword properties are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedOtp = otp.trim();

  const record = otpStore.get(normalizedEmail);
  if (!record) {
    return res.status(400).json({ error: 'No OTP generated for this email.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return res.status(400).json({ error: 'Your confirmation code has expired.' });
  }

  if (record.otp !== normalizedOtp) {
    return res.status(400).json({ error: 'Invalid verification code.' });
  }

  // OTP verified successfully
  otpStore.delete(normalizedEmail);

  if (!adminInitialized) {
    return res.status(500).json({ error: 'Firebase Admin authentication service is not configured on this server.' });
  }

  try {
    const userRecord = await admin.auth().getUserByEmail(normalizedEmail);
    await admin.auth().updateUser(userRecord.uid, { password: newPassword });
    
    return res.json({
      success: true,
      message: 'Your password has been reset and updated successfully.'
    });
  } catch (error: any) {
    console.error('Firebase Auth Password Reset failed:', error);
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'Corresponding Firebase Auth account not found.' });
    }
    return res.status(500).json({ error: 'Error resetting password on Firebase Auth.', details: error.message });
  }
};
