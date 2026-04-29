const { body } = require('express-validator');
const User = require('../models/User');

// ── Validation rules ───────────────────────────────────────────────────────
exports.updateProfileRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('bio').optional().isLength({ max: 1000 }).withMessage('Bio cannot exceed 1000 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
];

// ── GET /api/users ─────────────────────────────────────────────────────────
// Returns all users filtered by optional ?role= query param
exports.getUsers = async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;

  const users = await User.find(filter).select('-__v');
  res.status(200).json({ success: true, count: users.length, users });
};

// ── GET /api/users/:id ─────────────────────────────────────────────────────
exports.getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select('-__v');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.status(200).json({ success: true, user });
};

// ── PUT /api/users/:id ─────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  // Users can only update their own profile
  if (req.params.id !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorised to update this profile' });
  }

  // Whitelist updatable fields — never allow role or password here
  const allowed = [
    'name', 'bio', 'avatarUrl', 'location',
    // entrepreneur
    'startupName', 'pitchSummary', 'fundingNeeded', 'industry', 'foundedYear', 'teamSize',
    // investor
    'investmentInterests', 'investmentStage', 'portfolioCompanies',
    'totalInvestments', 'minimumInvestment', 'maximumInvestment',
  ];

  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).select('-__v');

  res.status(200).json({ success: true, user });
};

// ── GET /api/users/entrepreneurs ───────────────────────────────────────────
exports.getEntrepreneurs = async (req, res) => {
  const { industry, search } = req.query;
  const filter = { role: 'entrepreneur' };

  if (industry) filter.industry = industry;

  if (search) {
    filter.$or = [
      { name:         { $regex: search, $options: 'i' } },
      { startupName:  { $regex: search, $options: 'i' } },
      { pitchSummary: { $regex: search, $options: 'i' } },
      { industry:     { $regex: search, $options: 'i' } },
    ];
  }

  const entrepreneurs = await User.find(filter).select('-__v');
  res.status(200).json({ success: true, count: entrepreneurs.length, entrepreneurs });
};

// ── GET /api/users/investors ───────────────────────────────────────────────
exports.getInvestors = async (req, res) => {
  const { interest, stage, search } = req.query;
  const filter = { role: 'investor' };

  if (interest) filter.investmentInterests = interest;
  if (stage)    filter.investmentStage     = stage;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { bio:  { $regex: search, $options: 'i' } },
    ];
  }

  const investors = await User.find(filter).select('-__v');
  res.status(200).json({ success: true, count: investors.length, investors });
};
