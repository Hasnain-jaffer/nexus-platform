/**
 * Payment.js — Stripe payment record
 *
 * Tracks every payment intent created for a deal.
 * Status mirrors Stripe's PaymentIntent statuses.
 */
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      required: true,
    },
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
    /** Stripe PaymentIntent ID — e.g. "pi_3Pxxx" */
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },
    /** Amount in cents (Stripe always uses smallest currency unit) */
    amountCents: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'usd',
    },
    status: {
      type: String,
      enum: ['requires_payment_method', 'requires_confirmation', 'processing', 'succeeded', 'canceled', 'failed'],
      default: 'requires_payment_method',
    },
    /** Stripe's clientSecret — returned to frontend to complete payment */
    clientSecret: {
      type: String,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ dealId: 1 });
paymentSchema.index({ investorId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
