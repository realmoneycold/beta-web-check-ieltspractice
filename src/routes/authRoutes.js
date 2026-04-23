const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  signup,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
  checkUsername,
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/unified-auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 10,  // Max 10 accounts per hour per IP
  message: {
    success: false,
    message: 'Too many signup attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

router.post('/signup', signupLimiter, validate('signup'), signup);
router.post('/verify', verifyEmail);         // POST /api/auth/verify
router.post('/verify-email', verifyEmail);   // POST /api/auth/verify-email (alias per task spec)
router.post('/resend-verification', resendVerification);
router.post('/login', validate('login'), login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', validate('resetPassword'), resetPassword);
router.get('/check-username', checkUsername);

// Unified token verification
router.get('/verify-token', requireAuth(), (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

module.exports = router;

