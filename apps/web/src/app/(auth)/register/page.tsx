'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
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

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const strength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword;

  if (isAuthenticated) {
    router.replace('/account');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await register(name, email, password);
      toast('Account created!', 'success');
      router.push('/account');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="lg:hidden block mb-8 font-display font-semibold tracking-[0.2em] text-primary">
        YAC
      </Link>
      <h1 className="text-heading-1 font-display text-primary">Create your account</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          label="Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
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
          Register
        </Button>
        <p className="text-center text-small text-text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:text-accent-hover font-medium">
            Sign in
          </Link>
        </p>
        <p className="text-xs text-text-muted">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </div>
  );
}
