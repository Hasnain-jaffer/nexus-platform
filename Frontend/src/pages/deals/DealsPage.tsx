/**
 * DealsPage.tsx — Updated in Step 5
 *
 * New in Step 5:
 *  - "Pay Now" button for investors on Closed-ready deals
 *  - Stripe Payment Modal using @stripe/react-stripe-js
 *  - PaymentElement handles card input (PCI compliant, no raw card data ever touches our server)
 *  - Deal status updates to "Closed" automatically via Stripe webhook on backend
 */
import React, { useState, useEffect } from 'react';
import { Search, DollarSign, TrendingUp, Users, Calendar, Loader, CreditCard, X, CheckCircle } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Deal, DealStatus } from '../../types';
import { dealService } from '../../services/dealService';
import { paymentService, getStripe } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import type { Stripe } from '@stripe/stripe-js';

const STATUS_COLORS: Record<DealStatus, any> = {
  Negotiation:     'primary',
  'Term Sheet':    'warning',
  'Due Diligence': 'gray',
  Closed:          'success',
  Cancelled:       'error',
};

// ── Inner checkout form (must live inside <Elements>) ────────────────────────
interface CheckoutFormProps {
  dealId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ dealId, amount, onSuccess, onCancel }) => {
  const stripe   = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setErrorMsg('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // After payment, Stripe redirects here — update if deploying
        return_url: `${window.location.origin}/deals?payment=success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMsg(error.message || 'Payment failed');
      setProcessing(false);
    } else {
      toast.success('Payment successful! Deal marked as Closed.');
      onSuccess();
    }
  };

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(amount / 100);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 text-center">
        <p className="text-sm text-primary-700">Investment Amount</p>
        <p className="text-2xl font-bold text-primary-900 mt-1">{formattedAmount}</p>
      </div>

      <PaymentElement />

      {errorMsg && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <X size={14} />
          {errorMsg}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" fullWidth onClick={onCancel} disabled={processing}>
          Cancel
        </Button>
        <Button type="submit" fullWidth isLoading={processing} disabled={!stripe || processing}>
          {processing ? 'Processing…' : `Pay ${formattedAmount}`}
        </Button>
      </div>

      <p className="text-xs text-center text-gray-400">
        Secured by Stripe · Your card details never touch our servers
      </p>
    </form>
  );
};

// ── Payment Modal ─────────────────────────────────────────────────────────────
interface PaymentModalProps {
  deal: Deal;
  onClose: () => void;
  onSuccess: (dealId: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ deal, onClose, onSuccess }) => {
  const [clientSecret, setClientSecret] = useState('');
  const [amount, setAmount]             = useState(0);
  const [stripeObj, setStripeObj]       = useState<Stripe | null>(null);
  const [loading, setLoading]           = useState(true);
  const [paid, setPaid]                 = useState(false);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const [s, intent] = await Promise.all([
          getStripe(),
          paymentService.createPaymentIntent(deal.id),
        ]);
        if (!cancelled) {
          setStripeObj(s);
          setClientSecret(intent.clientSecret);
          setAmount(intent.amount);
        }
      } catch {
        if (!cancelled) toast.error('Could not initialise payment');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, [deal.id]);

  const handleSuccess = () => {
    setPaid(true);
    setTimeout(() => {
      onSuccess(deal.id);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CreditCard size={20} className="text-primary-600" />
            <h2 className="font-semibold text-gray-900">Complete Investment</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-5">
          {paid ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle size={48} className="text-green-500 mb-3" />
              <p className="text-lg font-semibold text-gray-800">Payment Successful!</p>
              <p className="text-gray-500 text-sm mt-1">Deal status updated to Closed</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader size={28} className="animate-spin text-primary-500" />
            </div>
          ) : clientSecret && stripeObj ? (
            <Elements stripe={stripeObj} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
              <CheckoutForm
                dealId={deal.id}
                amount={amount}
                onSuccess={handleSuccess}
                onCancel={onClose}
              />
            </Elements>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Unable to load payment form.</p>
              <p className="text-xs mt-1">Make sure STRIPE_SECRET_KEY is set in your backend .env</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main DealsPage ─────────────────────────────────────────────────────────────
export const DealsPage: React.FC = () => {
  const { user }              = useAuth();
  const [deals, setDeals]     = useState<Deal[]>([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [payingDeal, setPayingDeal] = useState<Deal | null>(null);

  useEffect(() => {
    dealService.getDeals()
      .then(setDeals)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: string, status: DealStatus) => {
    const updated = await dealService.updateDeal(id, { status }).catch(() => null);
    if (updated) setDeals(prev => prev.map(d => d.id === id ? updated : d));
  };

  const handlePaymentSuccess = (dealId: string) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, status: 'Closed' } : d));
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader size={28} className="animate-spin text-primary-600" />
    </div>
  );

  const filtered = deals.filter(d => {
    const q = search.toLowerCase();
    return !q ||
      d.entrepreneur?.name?.toLowerCase().includes(q) ||
      d.investor?.name?.toLowerCase().includes(q) ||
      d.stage.toLowerCase().includes(q) ||
      d.status.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {payingDeal && (
        <PaymentModal
          deal={payingDeal}
          onClose={() => setPayingDeal(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deal Pipeline</h1>
          <p className="text-gray-600">Track and manage your investment deals</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Deals',    icon: <DollarSign size={20} />, value: deals.length,                                          color: 'primary' },
          { label: 'In Negotiation', icon: <TrendingUp size={20} />, value: deals.filter(d => d.status === 'Negotiation').length,  color: 'accent' },
          { label: 'Due Diligence',  icon: <Users size={20} />,      value: deals.filter(d => d.status === 'Due Diligence').length, color: 'secondary' },
          { label: 'Closed',         icon: <Calendar size={20} />,   value: deals.filter(d => d.status === 'Closed').length,       color: 'success' },
        ].map(stat => (
          <Card key={stat.label} className={`bg-${stat.color}-50 border border-${stat.color}-100`}>
            <CardBody>
              <div className="flex items-center">
                <div className={`p-3 bg-${stat.color}-100 rounded-full mr-4 text-${stat.color}-700`}>{stat.icon}</div>
                <div>
                  <p className={`text-sm font-medium text-${stat.color}-700`}>{stat.label}</p>
                  <h3 className={`text-xl font-semibold text-${stat.color}-900`}>{stat.value}</h3>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="w-full md:w-1/2">
        <Input
          placeholder="Search deals..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          fullWidth
          startAdornment={<Search size={18} />}
        />
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Active Deals</h2>
        </CardHeader>
        <CardBody>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DollarSign size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No deals yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(deal => {
                const other = user?.role === 'investor' ? deal.entrepreneur : deal.investor;
                const canPay = user?.role === 'investor' && deal.status !== 'Closed' && deal.status !== 'Cancelled';
                return (
                  <div key={deal.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        {other && <Avatar src={other.avatarUrl} alt={other.name} size="md" />}
                        <div>
                          <h3 className="font-medium text-gray-900">{other?.name || '—'}</h3>
                          <p className="text-sm text-gray-500">
                            {deal.stage} · {deal.amount}{deal.equity ? ` · ${deal.equity} equity` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={STATUS_COLORS[deal.status] || 'gray'}>{deal.status}</Badge>

                        {user?.role === 'investor' && (
                          <select
                            className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            value={deal.status}
                            onChange={e => handleStatusChange(deal.id, e.target.value as DealStatus)}
                          >
                            {(['Negotiation', 'Term Sheet', 'Due Diligence', 'Closed', 'Cancelled'] as DealStatus[]).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}

                        {/* Pay Now button — investors only, non-closed deals */}
                        {canPay && (
                          <Button
                            size="sm"
                            leftIcon={<CreditCard size={14} />}
                            onClick={() => setPayingDeal(deal)}
                          >
                            Pay Now
                          </Button>
                        )}

                        {deal.status === 'Closed' && (
                          <div className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle size={14} />
                            <span>Paid</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {deal.notes && <p className="text-sm text-gray-500 mt-2 pl-12">{deal.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
