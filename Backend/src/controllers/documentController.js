const path     = require('path');
const fs       = require('fs');
const Document = require('../models/Document');

// ── POST /api/documents/upload ─────────────────────────────────────────────
exports.uploadDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const doc = await Document.create({
    name:     req.body.name || req.file.originalname,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size:     req.file.size,
    ownerId:  req.user.id,
  });

  res.status(201).json({ success: true, document: doc });
};

// ── GET /api/documents ─────────────────────────────────────────────────────
exports.getDocuments = async (req, res) => {
  // Return documents owned by the user OR shared with them
  const documents = await Document.find({
    $or: [
      { ownerId:    req.user.id },
      { sharedWith: req.user.id },
      { isPublic:   true },
    ],
  }).sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: documents.length, documents });
};

// ── GET /api/documents/:id/download ───────────────────────────────────────
exports.downloadDocument = async (req, res) => {
  const doc = await Document.findById(req.params.id);

  if (!doc) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  // Access check: owner, shared, or public
  const isOwner   = doc.ownerId.toString() === req.user.id.toString();
  const isShared  = doc.sharedWith.map((id) => id.toString()).includes(req.user.id.toString());

  if (!isOwner && !isShared && !doc.isPublic) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const filePath = path.join(process.env.UPLOAD_PATH || './uploads', doc.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found on server' });
  }

  res.download(filePath, doc.name);
};

// ── PATCH /api/documents/:id/share ────────────────────────────────────────
exports.shareDocument = async (req, res) => {
  const doc = await Document.findById(req.params.id);

  if (!doc) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  if (doc.ownerId.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the owner can share this document' });
  }

  const { userIds, isPublic } = req.body;

  if (userIds) doc.sharedWith = userIds;
  if (isPublic !== undefined) doc.isPublic = isPublic;

  await doc.save();
  res.status(200).json({ success: true, document: doc });
};

// ── DELETE /api/documents/:id ──────────────────────────────────────────────
exports.deleteDocument = async (req, res) => {
  const doc = await Document.findById(req.params.id);

  if (!doc) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  if (doc.ownerId.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the owner can delete this document' });
  }

  // Delete the physical file
  const filePath = path.join(process.env.UPLOAD_PATH || './uploads', doc.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await doc.deleteOne();
  res.status(200).json({ success: true, message: 'Document deleted' });
};
