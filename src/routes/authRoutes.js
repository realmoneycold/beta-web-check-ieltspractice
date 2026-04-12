const express = require('express');
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

const router = express.Router();

router.post('/signup', signup);
router.post('/verify', verifyEmail);         // POST /api/auth/verify
router.post('/verify-email', verifyEmail);   // POST /api/auth/verify-email (alias per task spec)
router.post('/resend-verification', resendVerification);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/check-username', checkUsername);

// Unified token verification
router.get('/verify-token', requireAuth(), (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

module.exports = router;

