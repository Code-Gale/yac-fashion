'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const strength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast('Invalid reset link', 'error');
      return;
    }
    if (password !== confirmPassword) {
      toast('Passwords do not match', 'error');
      return;
    }
    if (password.length < 8) {
      toast('Password must be at least 8 characters', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast('Password updated. Please sign in.', 'success');
      router.push('/login');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid or expired link';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-sm text-center">
        <p className="text-body text-text-muted">Invalid or missing reset token.</p>
        <Link href="/forgot-password" className="inline-block mt-4">
          <Button variant="outline">Request new link</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="lg:hidden block mb-8 font-display font-semibold tracking-[0.2em] text-primary">
        YAC
      </Link>
      <h1 className="text-heading-1 font-display text-primary">Reset password</h1>
      <p className="mt-2 text-body text-text-muted">
        Enter your new password below.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <div>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  i <= strength
                    ? i <= 2
                      ? 'bg-error'
                      : i <= 3
                      ? 'bg-warning'
                      : 'bg-success'
                    : 'bg-border'
                )}
              />
            ))}
          </div>
        </div>
        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          error={confirmPassword && !passwordsMatch ? 'Passwords do not match' : undefined}
          autoComplete="new-password"
        />
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Reset password
        </Button>
      </form>
    </div>
  );
}
