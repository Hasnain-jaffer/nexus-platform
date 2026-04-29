const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — verifies JWT from Authorization header.
 * Attaches the decoded user document to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorised — no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * authorize(...roles) — restricts a route to specific roles.
 * Call after protect:  router.get('/route', protect, authorize('investor'), handler)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorised to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
