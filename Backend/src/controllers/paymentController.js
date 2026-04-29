/**
 * paymentController.js — Stripe payment integration
 *
 * Flow:
 *  1. Investor calls POST /api/payments/create-intent with a dealId
 *  2. Backend creates a Stripe PaymentIntent and returns the clientSecret
 *  3. Frontend uses Stripe.js to confirm the payment with the clientSecret
 *  4. Stripe webhooks call POST /api/payments/webhook to confirm success
 *  5. On success the deal status is updated to "Closed"
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Deal   = require('../models/Deal');
const createNotification = require('../utils/createNotification');

// ── POST /api/payments/create-intent ──────────────────────────────────────
exports.createPaymentIntent = async (req, res) => {
  if (req.user.role !== 'investor') {
    return res.status(403).json({ success: false, message: 'Only investors can initiate payments' });
  }

  const { dealId } = req.body;
  if (!dealId) {
    return res.status(400).json({ success: false, message: 'dealId is required' });
  }

  const deal = await Deal.findById(dealId)
    .populate('entrepreneurId', 'name email')
    .populate('investorId', 'name');

  if (!deal) {
    return res.status(404).json({ success: false, message: 'Deal not found' });
  }

  if (deal.investorId._id.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Not your deal' });
  }

  if (deal.status === 'Closed') {
    return res.status(400).json({ success: false, message: 'Deal is already closed' });
  }

  // Parse amount — stored as a string like "$500,000" or "500000"
  const rawAmount = deal.amount.replace(/[^0-9.]/g, '');
  const amountUSD = parseFloat(rawAmount);

  if (isNaN(amountUSD) || amountUSD <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid deal amount for payment' });
  }

  // Stripe amounts are in cents
  const amountCents = Math.round(amountUSD * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount:   amountCents,
    currency: 'usd',
    metadata: {
      dealId:         deal._id.toString(),
      investorId:     req.user.id.toString(),
      entrepreneurId: deal.entrepreneurId._id.toString(),
    },
    description: `Business Nexus — Deal: ${deal.stage} · ${deal.investorId.name} → ${deal.entrepreneurId.name}`,
  });

  res.status(200).json({
    success:      true,
    clientSecret: paymentIntent.client_secret,
    amount:       amountCents,
    currency:     'usd',
    dealId:       deal._id,
  });
};

// ── POST /api/payments/webhook ────────────────────────────────────────────
// Stripe signs every webhook — verify the signature before processing
exports.stripeWebhook = async (req, res) => {
  const sig     = req.headers['stripe-signature'];
  const secret  = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    // req.rawBody is set by the raw body parser middleware in server.js
    event = stripe.webhooks.constructEvent(req.rawBody || req.body, sig, secret);
  } catch (err) {
    console.error('[Stripe webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi     = event.data.object;
    const dealId = pi.metadata?.dealId;

    if (dealId) {
      const deal = await Deal.findByIdAndUpdate(
        dealId,
        { status: 'Closed' },
        { new: true }
      );

      if (deal && req.io) {
        // Notify the entrepreneur
        await createNotification(
          req.io,
          deal.entrepreneurId.toString(),
          deal.investorId.toString(),
          'investment',
          'An investor has completed a payment for your deal — status updated to Closed!',
          `/deals`
        );
      }
    }
  }

  res.json({ received: true });
};

// ── GET /api/payments/config ──────────────────────────────────────────────
// Returns the publishable key so the frontend never needs it hardcoded
exports.getConfig = (_req, res) => {
  res.json({
    success:        true,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
};
