const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT for a user and sends it in the response.
 * Also attaches a short-lived httpOnly cookie for added security.
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

  // Build the safe user object (no password)
  const safeUser = {
    id:     user._id,
    name:   user.name,
    email:  user.email,
    role:   user.role,
    avatarUrl: user.avatarUrl,
    bio:    user.bio,
    isOnline: user.isOnline,
    createdAt: user.createdAt,
    // entrepreneur fields
    startupName:   user.startupName,
    pitchSummary:  user.pitchSummary,
    fundingNeeded: user.fundingNeeded,
    industry:      user.industry,
    location:      user.location,
    foundedYear:   user.foundedYear,
    teamSize:      user.teamSize,
    // investor fields
    investmentInterests: user.investmentInterests,
    investmentStage:     user.investmentStage,
    portfolioCompanies:  user.portfolioCompanies,
    totalInvestments:    user.totalInvestments,
    minimumInvestment:   user.minimumInvestment,
    maximumInvestment:   user.maximumInvestment,
    token, // include token in body so frontend can store it
  };

  res.status(statusCode).json({ success: true, user: safeUser });
};

module.exports = sendTokenResponse;
