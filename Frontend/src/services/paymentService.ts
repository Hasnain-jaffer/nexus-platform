/**
 * src/services/paymentService.ts
 *
 * Handles all Stripe-related API calls.
 * The actual card input UI is handled by @stripe/react-stripe-js components.
 */
import api from './api';
import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

/** Lazily loads Stripe.js with the publishable key fetched from the backend */
export const getStripe = async (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const { data } = await api.get('/payments/config');
    stripePromise = loadStripe(data.publishableKey);
  }
  return stripePromise;
};

export const paymentService = {
  /** Fetch publishable key from backend */
  getConfig: async (): Promise<{ publishableKey: string }> => {
    const { data } = await api.get('/payments/config');
    return data;
  },

  /**
   * Create a PaymentIntent for a specific deal.
   * Returns the clientSecret needed by Stripe.js to confirm the payment.
   */
  createPaymentIntent: async (dealId: string): Promise<{
    clientSecret: string;
    amount: number;
    currency: string;
  }> => {
    const { data } = await api.post('/payments/create-intent', { dealId });
    return {
      clientSecret: data.clientSecret,
      amount:       data.amount,
      currency:     data.currency,
    };
  },
};
