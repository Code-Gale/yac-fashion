'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/account';
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();

  if (isAuthenticated) {
    router.replace(returnUrl);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShake(false);
    try {
      await login(email, password);
      toast('Welcome back!', 'success');
      router.push(returnUrl);
    } catch (err: unknown) {
      setShake(true);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid credentials';
      toast(msg, 'error');
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="lg:hidden block mb-8 font-display font-semibold tracking-[0.2em] text-primary">
        YAC
      </Link>
      <h1 className="text-heading-1 font-display text-primary">Welcome back</h1>
      <p className="mt-2 text-body text-text-muted">Sign in to your YAC account</p>
      <form
        onSubmit={handleSubmit}
        className={cn(
          'mt-8 space-y-4',
          shake && 'animate-shake'
        )}
      >
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-small text-accent hover:text-accent-hover">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Sign In
        </Button>
        <p className="text-center text-small text-text-muted">
          or{' '}
          <Link href="/register" className="text-accent hover:text-accent-hover font-medium">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
