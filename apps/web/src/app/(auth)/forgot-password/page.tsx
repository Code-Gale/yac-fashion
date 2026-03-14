'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast('If the email exists, a reset link has been sent', 'success');
    } catch (_) {
      setSent(true);
      toast('If the email exists, a reset link has been sent', 'success');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="lg:hidden block mb-8 font-display font-semibold tracking-[0.2em] text-primary">
          YAC
        </Link>
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-heading-2 font-display text-primary">Check your email</h1>
        <p className="mt-2 text-body text-text-muted">
          If an account exists for {email}, we&apos;ve sent password reset instructions.
        </p>
        <Link href="/login" className="inline-block mt-6">
          <Button variant="outline">Back to login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="lg:hidden block mb-8 font-display font-semibold tracking-[0.2em] text-primary">
        YAC
      </Link>
      <h1 className="text-heading-1 font-display text-primary">Forgot password?</h1>
      <p className="mt-2 text-body text-text-muted">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Send reset link
        </Button>
        <Link href="/login" className="block text-center text-small text-accent hover:text-accent-hover">
          Back to login
        </Link>
      </form>
    </div>
  );
}
