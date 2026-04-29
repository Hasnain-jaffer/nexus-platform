const { body }           = require('express-validator');
const CollabReq          = require('../models/CollaborationRequest');
const User               = require('../models/User');
const createNotification = require('../utils/createNotification');

// ── Validation ─────────────────────────────────────────────────────────────
exports.createRequestRules = [
  body('entrepreneurId').notEmpty().withMessage('Entrepreneur ID is required'),
  body('message').trim().notEmpty().withMessage('Message is required')
    .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
];

// ── POST /api/collaboration ────────────────────────────────────────────────
exports.createRequest = async (req, res) => {
  const investorId = req.user.id;

  if (req.user.role !== 'investor') {
    return res.status(403).json({ success: false, message: 'Only investors can send collaboration requests' });
  }

  const { entrepreneurId, message } = req.body;

  const entrepreneur = await User.findById(entrepreneurId);
  if (!entrepreneur || entrepreneur.role !== 'entrepreneur') {
    return res.status(404).json({ success: false, message: 'Entrepreneur not found' });
  }

  // Prevent duplicate requests
  const existing = await CollabReq.findOne({ investorId, entrepreneurId });
  if (existing) {
    return res.status(400).json({ success: false, message: 'You already sent a request to this entrepreneur' });
  }

  const request = await CollabReq.create({ investorId, entrepreneurId, message });

  await createNotification(
    req.io,
    entrepreneurId,
    investorId,
    'investment',
    `${req.user.name} sent you a collaboration request`,
    `/dashboard/entrepreneur`
  );

  const populated = await CollabReq.findById(request._id)
    .populate('investorId', 'name avatarUrl email isOnline')
    .populate('entrepreneurId', 'name avatarUrl email startupName');

  res.status(201).json({ success: true, request: populated });
};

// ── GET /api/collaboration ─────────────────────────────────────────────────
// Returns requests relevant to the current user (as investor or entrepreneur)
exports.getRequests = async (req, res) => {
  const filter =
    req.user.role === 'investor'
      ? { investorId: req.user.id }
      : { entrepreneurId: req.user.id };

  const requests = await CollabReq.find(filter)
    .populate('investorId',      'name avatarUrl email isOnline')
    .populate('entrepreneurId',  'name avatarUrl email startupName')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: requests.length, requests });
};

// ── PATCH /api/collaboration/:id ───────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  const { status } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be 'accepted' or 'rejected'" });
  }

  const request = await CollabReq.findById(req.params.id);

  if (!request) {
    return res.status(404).json({ success: false, message: 'Request not found' });
  }

  // Only the entrepreneur can accept/reject
  if (request.entrepreneurId.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorised' });
  }

  request.status = status;
  await request.save();

  await createNotification(
    req.io,
    request.investorId,
    req.user.id,
    'connection',
    `${req.user.name} ${status} your collaboration request`,
    `/dashboard/investor`
  );

  const populated = await CollabReq.findById(request._id)
    .populate('investorId',     'name avatarUrl email isOnline')
    .populate('entrepreneurId', 'name avatarUrl email startupName');

  res.status(200).json({ success: true, request: populated });
};
