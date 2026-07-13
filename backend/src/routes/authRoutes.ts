import { Router } from 'express';
import { sendOtp, verifyOtp, resetPassword } from '../controllers/authController';

const router = Router();

// Endpoint: POST /api/auth/send-otp
router.post('/send-otp', sendOtp);

// Endpoint: POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtp);

// Endpoint: POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

export default router;
