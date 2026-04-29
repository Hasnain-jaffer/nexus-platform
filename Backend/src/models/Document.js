const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    filename: { type: String, required: true },   // stored filename on disk
    mimetype: { type: String, required: true },
    size:     { type: Number, required: true },   // bytes
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isPublic:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

documentSchema.index({ ownerId: 1 });

module.exports = mongoose.model('Document', documentSchema);
