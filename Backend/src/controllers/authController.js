const crypto          = require('crypto');
const { body }        = require('express-validator');
const User            = require('../models/User');
const sendTokenResponse = require('../utils/jwt');

// ── Validation rule arrays (reusable in routes) ────────────────────────────
exports.registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['entrepreneur', 'investor']).withMessage('Role must be entrepreneur or investor'),
];

exports.loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').isIn(['entrepreneur', 'investor']).withMessage('Role must be entrepreneur or investor'),
];

// ── POST /api/auth/register ────────────────────────────────────────────────
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check for duplicate email
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already in use' });
  }

  const user = await User.create({ name, email, password, role });
  sendTokenResponse(user, 201, res);
};

// ── POST /api/auth/login ───────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password, role } = req.body;

  // Explicitly select password (it's excluded by default)
  const user = await User.findOne({ email, role }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Update online status
  user.isOnline = true;
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
};

// ── POST /api/auth/logout ──────────────────────────────────────────────────
exports.logout = async (req, res) => {
  // Mark user offline
  await User.findByIdAndUpdate(req.user.id, { isOnline: false });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// ── GET /api/auth/me ───────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, user });
};

// ── POST /api/auth/forgot-password ────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    // Return 200 to prevent email enumeration attacks
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, reset instructions have been sent',
    });
  }

  // Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken  = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  // In production, send an email here.
  // For now we return the raw token so the frontend can test the reset flow.
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  res.status(200).json({
    success: true,
    message: 'Reset token generated (check resetUrl in development)',
    ...(process.env.NODE_ENV === 'development' && { resetUrl }),
  });
};

// ── POST /api/auth/reset-password ─────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token and new password are required' });
  }

  // Hash the incoming token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken:  hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }

  user.password            = newPassword;
  user.resetPasswordToken  = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Password reset successfully' });
};
