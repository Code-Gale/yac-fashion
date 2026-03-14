'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function NewsletterBlock() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setStatus('success');
    setEmail('');
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
        <p className="text-[#c9a84c] uppercase tracking-[0.2em] text-xs font-medium mb-4">
          Stay in the loop
        </p>
        <h2 className="font-display font-semibold text-[2rem] lg:text-[2.5rem] leading-tight">
          Join our newsletter
        </h2>
        <p className="text-white/75 text-base mt-4">
          Be the first to know about new arrivals, exclusive offers, and style inspiration.
        </p>
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
            {status === 'loading' ? 'Subscribing...' : status === 'success' ? 'Subscribed!' : 'Subscribe'}
          </Button>
        </form>
      </div>
    </section>
  );
}
