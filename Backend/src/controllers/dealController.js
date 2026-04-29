const { body } = require('express-validator');
const Deal     = require('../models/Deal');
const User     = require('../models/User');

// ── Validation ─────────────────────────────────────────────────────────────
exports.createDealRules = [
  body('entrepreneurId').notEmpty().withMessage('Entrepreneur ID is required'),
  body('amount').notEmpty().withMessage('Amount is required'),
  body('stage').isIn(['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C'])
    .withMessage('Invalid stage'),
];

// ── POST /api/deals ────────────────────────────────────────────────────────
exports.createDeal = async (req, res) => {
  if (req.user.role !== 'investor') {
    return res.status(403).json({ success: false, message: 'Only investors can create deals' });
  }

  const { entrepreneurId, amount, equity, stage, notes } = req.body;

  const entrepreneur = await User.findById(entrepreneurId);
  if (!entrepreneur || entrepreneur.role !== 'entrepreneur') {
    return res.status(404).json({ success: false, message: 'Entrepreneur not found' });
  }

  const deal = await Deal.create({
    investorId: req.user.id,
    entrepreneurId,
    amount,
    equity,
    stage,
    notes,
  });

  const populated = await Deal.findById(deal._id)
    .populate('investorId',     'name avatarUrl')
    .populate('entrepreneurId', 'name avatarUrl startupName industry');

  res.status(201).json({ success: true, deal: populated });
};

// ── GET /api/deals ─────────────────────────────────────────────────────────
exports.getDeals = async (req, res) => {
  const filter =
    req.user.role === 'investor'
      ? { investorId: req.user.id }
      : { entrepreneurId: req.user.id };

  const deals = await Deal.find(filter)
    .populate('investorId',     'name avatarUrl')
    .populate('entrepreneurId', 'name avatarUrl startupName industry')
    .sort({ updatedAt: -1 });

  res.status(200).json({ success: true, count: deals.length, deals });
};

// ── PATCH /api/deals/:id ───────────────────────────────────────────────────
exports.updateDeal = async (req, res) => {
  const deal = await Deal.findById(req.params.id);

  if (!deal) {
    return res.status(404).json({ success: false, message: 'Deal not found' });
  }

  const isParty =
    deal.investorId.toString()     === req.user.id.toString() ||
    deal.entrepreneurId.toString() === req.user.id.toString();

  if (!isParty) {
    return res.status(403).json({ success: false, message: 'Not authorised' });
  }

  const allowed = ['amount', 'equity', 'stage', 'status', 'notes'];
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) deal[f] = req.body[f];
  });

  await deal.save();

  const populated = await Deal.findById(deal._id)
    .populate('investorId',     'name avatarUrl')
    .populate('entrepreneurId', 'name avatarUrl startupName industry');

  res.status(200).json({ success: true, deal: populated });
};

// ── DELETE /api/deals/:id ──────────────────────────────────────────────────
exports.deleteDeal = async (req, res) => {
  const deal = await Deal.findById(req.params.id);

  if (!deal) {
    return res.status(404).json({ success: false, message: 'Deal not found' });
  }

  if (deal.investorId.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the investor can delete a deal' });
  }

  await deal.deleteOne();
  res.status(200).json({ success: true, message: 'Deal deleted' });
};
