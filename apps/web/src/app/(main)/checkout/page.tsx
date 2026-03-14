'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { NIGERIAN_STATES, SHIPPING_OPTIONS, PAYMENT_METHODS, BANK_TRANSFER, COD_AVAILABLE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { trackBeginCheckout } from '@/lib/analytics';
import { trackInitiateCheckout } from '@/lib/fbPixel';
import { trackInitiateCheckout as trackTikTokInitiateCheckout } from '@/lib/tiktokPixel';

type Address = {
  _id: string;
  label?: string;
  street?: string;
  city?: string;
  state?: string;
  phone?: string;
  isDefault?: boolean;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, coupon, discount, applyCoupon, removeCoupon, clearCart } = useCart();
  const { accessToken, user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [formAddress, setFormAddress] = useState({ name: '', phone: '', street: '', city: '', state: '', email: '' });
  const [saveAddress, setSaveAddress] = useState(false);
  const [shippingOption, setShippingOption] = useState<typeof SHIPPING_OPTIONS[0] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSummaryOpen, setOrderSummaryOpen] = useState(false);
  const checkoutTracked = useRef(false);

  const shippingFee = shippingOption?.price ?? 0;
  const total = Math.max(0, subtotal - discount + shippingFee);
  const isAuthenticated = !!accessToken && !!user;

  useEffect(() => {
    if (items.length > 0 && !checkoutTracked.current) {
      checkoutTracked.current = true;
      const value = Math.max(0, subtotal - discount);
      trackBeginCheckout(items, value);
      trackInitiateCheckout(value);
      trackTikTokInitiateCheckout(value);
    }
  }, [items, subtotal, discount]);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/account/addresses').then(({ data }) => {
        const addrs = data?.data ?? data ?? [];
        setAddresses(Array.isArray(addrs) ? addrs : []);
        const defaultAddr = addrs?.find((a: Address) => a.isDefault) ?? addrs?.[0];
        if (defaultAddr) setSelectedAddressId(defaultAddr._id);
      }).catch(() => {});
    } else {
      setUseNewAddress(true);
    }
  }, [isAuthenticated]);

  const selectedAddress = selectedAddressId ? addresses.find((a) => a._id === selectedAddressId) : null;
  const shippingAddress = useNewAddress
    ? { name: formAddress.name, phone: formAddress.phone, street: formAddress.street, city: formAddress.city, state: formAddress.state }
    : selectedAddress
    ? { name: (user as { name?: string })?.name || 'Customer', phone: selectedAddress.phone || '', street: selectedAddress.street || '', city: selectedAddress.city || '', state: selectedAddress.state || '' }
    : null;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || couponLoading) return;
    setCouponLoading(true);
    try {
      await applyCoupon(couponInput.trim());
      setCouponInput('');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!shippingAddress?.name || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.phone) return;
    if (!shippingOption || !paymentMethod) return;
    if (items.length === 0) return;
    if (!isAuthenticated && !formAddress.email) return;

    setCheckoutLoading(true);
    try {
      const payload = {
        items: items.map((i: { productId: string; quantity?: number }) => ({ productId: i.productId, quantity: i.quantity ?? 1 })),
        shippingAddress,
        shippingOption: { label: shippingOption.label, price: shippingOption.price },
        paymentMethod,
        couponCode: coupon || undefined,
        guestEmail: !isAuthenticated ? formAddress.email : undefined,
      };
      const { data } = await api.post('/orders/checkout', payload);
      const res = data?.data ?? data;
      clearCart();

      if (paymentMethod === 'paystack' && res?.paymentInitiation?.authorizationUrl) {
        window.location.href = res.paymentInitiation.authorizationUrl;
        return;
      }
      if (paymentMethod === 'flutterwave' && res?.paymentInitiation?.paymentLink) {
        window.location.href = res.paymentInitiation.paymentLink;
        return;
      }
      const emailParam = !isAuthenticated ? formAddress.email : (user as { email?: string })?.email;
      const emailQ = emailParam ? `&email=${encodeURIComponent(emailParam)}` : '';
      if (paymentMethod === 'bank_transfer' || paymentMethod === 'cash_on_delivery') {
        router.push(`/order-confirmed?orderNumber=${res?.order?.orderNumber}&pending=1${emailQ}`);
        return;
      }
      router.push(`/order-confirmed?orderNumber=${res?.order?.orderNumber}${emailQ}`);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Checkout failed';
      alert(msg);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const orderSummaryContent = (
    <div className="space-y-4">
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {items.map((item: { productId: string; name?: string; image?: string | null; price?: number; quantity?: number }) => (
          <div key={item.productId} className="flex gap-3">
            <div className="w-14 h-14 rounded overflow-hidden bg-bg-alt flex-shrink-0 relative">
              {item.image && <Image src={item.image} alt="" fill className="object-cover" sizes="56px" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">{item.name}</p>
              <p className="text-xs text-text-muted">Qty: {item.quantity} × ₦{(item.price ?? 0).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-1 text-sm border-t border-border pt-4">
        <div className="flex justify-between">
          <span className="text-text-muted">Subtotal</span>
          <span>₦{subtotal.toLocaleString()}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-accent">
            <span>Discount</span>
            <span>−₦{discount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-text-muted">Shipping</span>
          <span>{shippingFee > 0 ? `₦${shippingFee.toLocaleString()}` : 'Calculated'}</span>
        </div>
        <div className="flex justify-between font-display font-semibold text-lg text-accent pt-2">
          <span>Total</span>
          <span>₦{total.toLocaleString()}</span>
        </div>
      </div>
      <div className="flex gap-4 text-xs text-text-muted pt-2">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure Checkout
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Buyer Protection
        </span>
      </div>
    </div>
  );

  const steps = [
    { num: 1, label: 'Delivery' },
    { num: 2, label: 'Review' },
    { num: 3, label: 'Payment' },
  ];

  if (items.length === 0 && step > 1) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-text-muted mb-4">Your cart is empty.</p>
        <Link href="/shop">
          <Button variant="accent">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 lg:px-10 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between lg:justify-start gap-4">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <button
                type="button"
                onClick={() => step > s.num && setStep(s.num)}
                disabled={step <= s.num}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  step >= s.num ? 'bg-accent text-white' : 'bg-bg-alt text-text-muted',
                  step > s.num && 'cursor-pointer hover:bg-accent/80'
                )}
              >
                {s.num}
              </button>
              <span className={cn('ml-2 hidden sm:inline', step >= s.num ? 'text-primary font-medium' : 'text-text-muted')}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={cn('w-8 h-0.5 mx-2', step > s.num ? 'bg-accent' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-12">
        <div className="lg:col-span-1">
          {step === 1 && (
            <div>
              <h2 className="font-display font-semibold text-xl mb-6">Delivery Details</h2>
              {!isAuthenticated && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formAddress.email}
                    onChange={(e) => setFormAddress((f) => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-border rounded-lg text-base"
                  />
                  <p className="text-xs text-text-muted mt-1">We&apos;ll send your order confirmation here</p>
                </div>
              )}
              {addresses.length > 0 && !useNewAddress && (
                <div className="space-y-3 mb-6">
                  {addresses.map((addr) => (
                    <label
                      key={addr._id}
                      className={cn(
                        'block p-4 border rounded-lg cursor-pointer transition-colors',
                        selectedAddressId === addr._id ? 'border-primary bg-primary/5' : 'border-border'
                      )}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === addr._id}
                        onChange={() => setSelectedAddressId(addr._id)}
                        className="sr-only"
                      />
                      <div className="flex items-start gap-3">
                        <span className={cn('text-xs px-2 py-0.5 rounded', addr.isDefault ? 'bg-accent/20 text-accent' : 'bg-bg-alt')}>
                          {addr.isDefault ? 'Default' : addr.label || 'Address'}
                        </span>
                        <div>
                          <p className="font-medium">{addr.street}</p>
                          <p className="text-sm text-text-muted">{addr.city}, {addr.state}</p>
                          <p className="text-sm text-text-muted">{addr.phone}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                  <label
                    className={cn(
                      'block p-4 border rounded-lg cursor-pointer transition-colors',
                      useNewAddress ? 'border-primary bg-primary/5' : 'border-border'
                    )}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={useNewAddress}
                      onChange={() => setUseNewAddress(true)}
                      className="sr-only"
                    />
                    Use a new address
                  </label>
                  <Link href="/account" className="text-sm text-accent hover:underline">
                    Manage addresses
                  </Link>
                </div>
              )}
              {(useNewAddress || addresses.length === 0) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formAddress.name}
                      onChange={(e) => setFormAddress((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formAddress.phone}
                      onChange={(e) => setFormAddress((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Street Address</label>
                    <input
                      type="text"
                      value={formAddress.street}
                      onChange={(e) => setFormAddress((f) => ({ ...f, street: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg text-base"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">City</label>
                      <input
                        type="text"
                        value={formAddress.city}
                        onChange={(e) => setFormAddress((f) => ({ ...f, city: e.target.value }))}
                        className="w-full px-4 py-3 border border-border rounded-lg text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">State</label>
                      <select
                        value={formAddress.state}
                        onChange={(e) => setFormAddress((f) => ({ ...f, state: e.target.value }))}
                        className="w-full px-4 py-3 border border-border rounded-lg text-base"
                      >
                        <option value="">Select</option>
                        {NIGERIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {isAuthenticated && (
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                      <span className="text-sm">Save this address</span>
                    </label>
                  )}
                </div>
              )}
              <div className="mt-8">
                <h3 className="font-display font-semibold mb-4">Shipping Options</h3>
                <div className="space-y-3">
                  {SHIPPING_OPTIONS.map((opt) => (
                    <label
                      key={opt.label}
                      className={cn(
                        'block p-4 border rounded-lg cursor-pointer transition-colors',
                        shippingOption?.label === opt.label ? 'border-primary bg-primary/5' : 'border-border'
                      )}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingOption?.label === opt.label}
                        onChange={() => setShippingOption(opt)}
                        className="sr-only"
                      />
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{opt.label}</p>
                          <p className="text-sm text-text-muted">{opt.description}</p>
                          <p className="text-xs text-text-muted mt-1">{opt.estimatedDays} delivery</p>
                        </div>
                        <span className="font-medium">{opt.price === 0 ? 'Free' : `₦${opt.price.toLocaleString()}`}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <Button
                  variant="accent"
                  size="lg"
                  fullWidth
                  className="lg:w-auto"
                  disabled={!shippingAddress?.name || !shippingAddress?.street || !shippingAddress?.city || !shippingAddress?.state || !shippingAddress?.phone || !shippingOption || (!isAuthenticated && !formAddress.email)}
                  onClick={async () => {
                    if (saveAddress && isAuthenticated && useNewAddress) {
                      try {
                        await api.post('/account/addresses', {
                          label: 'Saved',
                          street: formAddress.street,
                          city: formAddress.city,
                          state: formAddress.state,
                          phone: formAddress.phone,
                        });
                      } catch (_) {}
                    }
                    setStep(2);
                  }}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display font-semibold text-xl mb-6">Review Order</h2>
              <div className="space-y-4 mb-6">
                {items.map((item: { productId: string; name?: string; image?: string | null; price?: number; quantity?: number }) => (
                  <div key={item.productId} className="flex gap-4 p-4 border border-border rounded-lg">
                    <div className="w-16 h-16 rounded overflow-hidden bg-bg-alt flex-shrink-0 relative">
                      {item.image && <Image src={item.image} alt="" fill className="object-cover" sizes="64px" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-text-muted">Qty: {item.quantity} × ₦{(item.price ?? 0).toLocaleString()}</p>
                    </div>
                    <p className="font-medium">₦{((item.price ?? 0) * (item.quantity ?? 1)).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="mb-6">
                <p className="text-sm font-medium mb-1">Shipping to</p>
                <p className="text-text-muted">
                  {shippingAddress?.name}, {shippingAddress?.street}, {shippingAddress?.city}, {shippingAddress?.state}
                </p>
                <button type="button" onClick={() => setStep(1)} className="text-sm text-accent hover:underline mt-1">
                  Edit
                </button>
              </div>
              {!coupon && (
                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Coupon code"
                    className="flex-1 px-4 py-3 border border-border rounded-lg text-base"
                  />
                  <Button variant="outline" onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}>
                    Apply
                  </Button>
                </div>
              )}
              {coupon && (
                <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-md bg-accent/10">
                  <span className="text-sm font-medium text-accent">{coupon}</span>
                  <span className="text-sm text-text-muted">−₦{discount.toLocaleString()}</span>
                  <button type="button" onClick={removeCoupon} className="ml-auto text-accent hover:underline">
                    Remove
                  </button>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="ghost" onClick={() => setStep(1)} fullWidth className="sm:order-2">
                  Back
                </Button>
                <Button variant="accent" size="lg" onClick={() => setStep(3)} fullWidth className="sm:order-1">
                  Proceed to Payment
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-display font-semibold text-xl mb-6">Payment</h2>
              <div className="space-y-3">
                {Object.entries(PAYMENT_METHODS).map(([key, opt]) => {
                  if (key === 'cash_on_delivery' && !COD_AVAILABLE) return null;
                  return (
                    <label
                      key={key}
                      className={cn(
                        'flex items-start gap-4 p-4 border rounded-lg cursor-pointer min-h-[64px] transition-colors',
                        paymentMethod === key ? 'border-primary bg-primary/5' : 'border-border'
                      )}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === key}
                        onChange={() => setPaymentMethod(key)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{opt.label}</p>
                        <p className="text-sm text-text-muted">{opt.description}</p>
                        {key === 'bank_transfer' && paymentMethod === 'bank_transfer' && (
                          <div className="mt-4 p-4 bg-bg-alt rounded-lg text-sm">
                            <p><strong>Account Name:</strong> {BANK_TRANSFER.accountName}</p>
                            <p><strong>Account Number:</strong> {BANK_TRANSFER.accountNumber}</p>
                            <p><strong>Bank:</strong> {BANK_TRANSFER.bankName}</p>
                            <p className="text-text-muted mt-2">Include your order number in the transfer reference.</p>
                          </div>
                        )}
                        {key === 'cash_on_delivery' && paymentMethod === 'cash_on_delivery' && (
                          <p className="text-sm text-text-muted mt-2">Available in select delivery areas.</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-text-muted mt-4 flex items-center gap-2 flex-wrap">
                <span>🔒 SSL encrypted</span>
                <span>·</span>
                <span>Powered by Paystack/Flutterwave</span>
                <span>·</span>
                <span>100% secure</span>
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button variant="ghost" onClick={() => setStep(2)} fullWidth className="sm:order-2">
                  Back
                </Button>
                <Button
                  variant="accent"
                  size="lg"
                  fullWidth
                  className="sm:order-1"
                  disabled={!paymentMethod || checkoutLoading}
                  loading={checkoutLoading}
                  onClick={handleCheckout}
                >
                  {paymentMethod === 'bank_transfer' ? "I've made the transfer" : paymentMethod === 'cash_on_delivery' ? 'Confirm Order' : `Pay ₦${total.toLocaleString()}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 lg:mt-0 lg:sticky lg:top-24">
          <div className="lg:hidden border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setOrderSummaryOpen(!orderSummaryOpen)}
              className="w-full p-4 flex items-center justify-between font-display font-semibold"
            >
              Order Summary ({items.length} items)
              <svg className={cn('w-5 h-5 transition-transform', orderSummaryOpen && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {orderSummaryOpen && <div className="p-4 border-t border-border">{orderSummaryContent}</div>}
          </div>
          <div className="hidden lg:block bg-surface rounded-lg border border-border p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Order Summary ({items.length} items)</h3>
            {orderSummaryContent}
          </div>
        </div>
      </div>
    </div>
  );
}
