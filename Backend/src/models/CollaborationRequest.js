const mongoose = require('mongoose');

const collaborationRequestSchema = new mongoose.Schema(
  {
    investorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    entrepreneurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// One request per investor-entrepreneur pair
collaborationRequestSchema.index(
  { investorId: 1, entrepreneurId: 1 },
  { unique: true }
);

module.exports = mongoose.model('CollaborationRequest', collaborationRequestSchema);
