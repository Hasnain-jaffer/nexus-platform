const { validationResult } = require('express-validator');

/**
 * Reads express-validator errors from the request and short-circuits
 * with a 400 response if any validation rules failed.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors:  errors.array(),
    });
  }
  next();
};

module.exports = validate;
