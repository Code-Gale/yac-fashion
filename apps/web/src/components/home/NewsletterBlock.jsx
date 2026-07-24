'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export function NewsletterBlock() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

      const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    setError('');
    try {
      await api.post('/newsletter/subscribe', { email: email.trim(), source: 'homepage' });
      setStatus('success');
      setEmail('');
    } catch (err) {
          setStatus('idle');
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <section className="py-20 lg:py-28 px-6 lg:px-16 xl:px-24 bg-[#1a1a2e] text-white relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
              backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 50px,
            rgba(201,168,76,0.5) 50px,
            rgba(201,168,76,0.5) 100px
          )`,
        }}
      />
      <div className="relative max-w-2xl mx-auto text-center">
            <div className="w-14 h-14 rounded-full bg-[#c9a84c]/15 ring-1 ring-[#c9a84c]/40 flex items-center justify-center mx-auto mb-6">
          <svg className="w-6 h-6 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-[#c9a84c] uppercase tracking-[0.2em] text-xs font-medium mb-4">
          Stay in the loop
        </p>
        <h2 className="font-display font-semibold text-[2rem] lg:text-[2.5rem] leading-tight">
              Join our newsletter
        </h2>
        <p className="text-white/75 text-base mt-4">
          Be the first to know about new arrivals, exclusive offers, and style inspiration.
        </p>
        {status === 'success' ? (
          <div className="mt-10 max-w-md mx-auto py-4 px-6 bg-white/5 border border-[#c9a84c]/30 rounded-sm">
            <p className="text-[#c9a84c] font-medium">You&apos;re on the list! 🎉</p>
            <p className="text-white/60 text-sm mt-1">Watch your inbox for our next drop.</p>
          </div>
        ) : (
              <form onSubmit={handleSubmit} className="mt-10 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 min-h-[52px] px-5 bg-white/10 border border-white/20 rounded-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent"
              required
            />
            <Button
                  type="submit"
              variant="accent"
              size="lg"
              disabled={status === 'loading'}
              className="min-h-[52px] px-8 rounded-sm shrink-0"
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>
        )}
            {error && <p className="text-error text-sm mt-3">{error}</p>}
        <p className="text-white/40 text-xs mt-6">No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}
