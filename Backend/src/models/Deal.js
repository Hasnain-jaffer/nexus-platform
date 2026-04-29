const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema(
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
    amount:  { type: String, required: true },
    equity:  { type: String, default: '' },
    stage: {
      type: String,
      enum: ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Negotiation', 'Term Sheet', 'Due Diligence', 'Closed', 'Cancelled'],
      default: 'Negotiation',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

dealSchema.index({ investorId: 1 });
dealSchema.index({ entrepreneurId: 1 });

module.exports = mongoose.model('Deal', dealSchema);
