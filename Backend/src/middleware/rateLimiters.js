const rateLimit = require('express-rate-limit');

// General API limiter — generous, applies to everything under /api
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' },
});

// Strict limiter — ONLY for brute-force-prone auth actions (login/register/
// password reset). Deliberately NOT applied to /auth/me or /auth/logout,
// since those fire on every page load/refresh, not just login attempts.
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts, please try again later' },
});