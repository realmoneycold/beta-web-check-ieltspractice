const bcrypt = require('bcryptjs');   // bcryptjs — pure-JS, no native build needed
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../models/prisma');
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../services/emailService');

const VERIFICATION_CODE_TTL_HOURS = 24;   // 24 hours per spec
const PASSWORD_RESET_TTL_HOURS    = 1;    // 1 hour per spec
const JWT_EXPIRES_IN              = '24h'; // 24 hours per spec

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateResetToken() {
  return crypto.randomBytes(48).toString('hex');
}

// ─── SIGNUP ───────────────────────────────────────────────────
async function signup(req, res) {
  try {
    // Accept both firstName+lastName (new frontend) and full_name (legacy)
    let { firstName, lastName, full_name, username, email, password, country, role } = req.body || {};

    if (firstName && lastName) {
      full_name = `${firstName.trim()} ${lastName.trim()}`;
    }

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'firstName, lastName (or full_name), email and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const hashed = await bcrypt.hash(password, 12);

    const requestedRole = (role || 'STUDENT').toUpperCase();

    // Block admin/CEO self-registration
    if (['ADMIN', 'CEO', 'GRADER', 'SUPPORT', 'CONTENT', 'ANALYST', 'MANAGER'].includes(requestedRole)) {
      return res.status(403).json({ success: false, message: 'You cannot register an administrative account via this form.' });
    }

    const userRole = requestedRole === 'TEACHER' ? 'TEACHER' : 'STUDENT';

    // Build a safe username if not provided
    const safeUsername = (username || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);

    const user = await prisma.user.create({
      data: {
        full_name: full_name.trim(),
        username: safeUsername || `user_${Date.now()}`,
        email: email.toLowerCase().trim(),
        password: hashed,
        country: country || null,
        role: userRole,
        current_band: 5.0,
        tasks_done: 0,
      },
    });

    // Generate and store 6-digit OTP (24-hour expiry per spec)
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_HOURS * 60 * 60 * 1000);

    await prisma.verificationCode.create({
      data: { email: user.email, code, expiresAt },
    });

    // Send verification email (non-blocking — don't fail signup if email fails)
    try {
      await sendVerificationEmail(user.email, code, full_name);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr.message);
      // Continue — user can request resend later
    }

    // ─── DEMO MODE: Return verification code so user doesn't need real email ──
    // This allows investor demo to work without actual email service
    const isTestKey = !process.env.RESEND_API_KEY || 
                      process.env.RESEND_API_KEY.startsWith('re_test_') ||
                      process.env.NODE_ENV === 'demo';
    
    const response = {
      success: true,
      message: isTestKey 
        ? '✅ Demo Mode: Verification code shown below (check console for email details)'
        : 'Verification code sent to email',
      email: user.email,
    };

    // In demo mode, return code so tester can verify immediately
    if (isTestKey) {
      response.demo_mode = true;
      response.verification_code = code;
      response.note = 'For demo purposes, this code allows immediate verification';
    }

    return res.status(201).json(response);
  } catch (err) {
    console.error('Signup error', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Email or username is already taken' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── VERIFY EMAIL ─────────────────────────────────────────────
async function verifyEmail(req, res) {
  try {
    const { email, code } = req.body || {};

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'email and code are required' });
    }

    const record = await prisma.verificationCode.findFirst({
      where: { email: email.toLowerCase().trim(), code: String(code).trim() },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Mark verified and clean up codes atomically
    await prisma.$transaction([
      prisma.user.update({
        where: { email: email.toLowerCase().trim() },
        data: { is_verified: true },
      }),
      prisma.verificationCode.deleteMany({ where: { email: email.toLowerCase().trim() } }),
    ]);

    // Send welcome email (non-blocking)
    try {
      await sendWelcomeEmail(user.email, user.full_name);
    } catch (emailErr) {
      console.error('Failed to send welcome email:', emailErr.message);
    }

    return res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    console.error('Verify email error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── RESEND VERIFICATION CODE ─────────────────────────────────
async function resendVerification(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ success: false, message: 'email is required' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      // Don't reveal if user exists — security best practice
      return res.json({ success: true, message: 'If that email is registered, a new code has been sent.' });
    }
    if (user.is_verified) {
      return res.status(400).json({ success: false, message: 'This email is already verified.' });
    }

    // Delete old codes and create a new one with 24h expiry
    await prisma.verificationCode.deleteMany({ where: { email: user.email } });
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_HOURS * 60 * 60 * 1000);
    await prisma.verificationCode.create({ data: { email: user.email, code, expiresAt } });

    try {
      await sendVerificationEmail(user.email, code, user.full_name);
    } catch (emailErr) {
      console.error('Failed to resend verification email:', emailErr.message);
    }

    const isDev = !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_test');
    return res.json({
      success: true,
      message: 'A new verification code has been sent to your email.',
      ...(isDev && { dev_verification_code: code }),
    });
  } catch (err) {
    console.error('Resend verification error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── LOGIN ────────────────────────────────────────────────────
async function login(req, res) {
  try {
    const { email, password, role } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Email not verified. Please check your inbox for the verification code.',
        requiresVerification: true,
        email: user.email,
      });
    }

    // Role check only when a specific portal sends role (optional)
    if (role && role.toUpperCase() !== user.role) {
      return res.status(403).json({ success: false, message: 'Invalid role for this portal' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }  // 24 hours per spec
    );

    // Update last seen
    prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }).catch(() => {});

    return res.json({
      success: true,
      token,
      role: user.role,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        country: user.country,
        role: user.role,
        current_band: user.current_band,
        is_onboarded: user.is_onboarded,
      },
    });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── FORGOT PASSWORD ──────────────────────────────────────────
async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};

    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Always return same message to prevent email enumeration (security)
    const successMsg = 'Password reset email sent';

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      // Return 200 for security (don't reveal whether email exists)
      return res.json({ success: true, message: successMsg });
    }

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    // Generate cryptographically secure reset token
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_HOURS * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: resetToken, expiresAt },
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.full_name);
    } catch (emailErr) {
      console.error('Failed to send password reset email:', emailErr.message);
      // Clean up the token if we couldn't send the email
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      return res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again later.' });
    }

    const isDev = !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_test');
    return res.json({
      success: true,
      message: successMsg,
      ...(isDev && { dev_reset_token: resetToken }),
    });
  } catch (err) {
    console.error('Forgot password error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── RESET PASSWORD ───────────────────────────────────────────
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body || {};

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'token and newPassword are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const record = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link. Please request a new one.' });
    }

    if (record.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: record.id } });
      return res.status(400).json({ success: false, message: 'Reset link has expired. Please request a new one.' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    // Update password and invalidate all tokens in one transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashed },
      }),
      prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
    ]);

    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── CHECK USERNAME AVAILABILITY ─────────────────────────────────────────────
async function checkUsername(req, res) {
  try {
    const username = (req.query.username || '').toLowerCase().trim();

    if (!username || username.length < 3) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Username must be at least 3 characters'
      });
    }

    const existing = await prisma.user.findUnique({ where: { username } });

    if (existing) {
      return res.json({ success: true, available: false, message: 'This username is already taken' });
    }

    return res.json({ success: true, available: true, message: 'Username is available' });
  } catch (err) {
    console.error('Check username error', err);
    return res.status(500).json({ success: false, available: false, message: 'Server error' });
  }
}

module.exports = {
  signup,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
  checkUsername,
};
