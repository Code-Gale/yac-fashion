'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/account', label: 'Home', icon: 'house' },
  { href: '/account/orders', label: 'Orders', icon: 'box' },
  { href: '/account/wishlist', label: 'Wishlist', icon: 'heart' },
  { href: '/account/profile', label: 'Profile', icon: 'user' },
  { href: '/account/addresses', label: 'More', icon: 'grid' },
];

const SIDEBAR_LINKS = [
  { href: '/account', label: 'Dashboard', icon: 'house' },
  { href: '/account/orders', label: 'My Orders', icon: 'box' },
  { href: '/account/wishlist', label: 'Wishlist', icon: 'heart' },
  { href: '/account/addresses', label: 'Saved Addresses', icon: 'map' },
  { href: '/account/profile', label: 'Profile Settings', icon: 'user' },
];

function Icon({ name, active }: { name: string; active?: boolean }) {
  const cls = cn('flex-shrink-0', active && 'text-accent');
  if (name === 'house') {
    return (
      <svg className={cls} width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    );
  }
  if (name === 'box') {
    return (
      <svg className={cls} width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    );
  }
  if (name === 'heart') {
    return (
      <svg className={cls} width="20" height="20" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    );
  }
  if (name === 'user') {
    return (
      <svg className={cls} width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  }
  if (name === 'grid') {
    return (
      <svg className={cls} width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    );
  }
  if (name === 'map') {
    return (
      <svg className={cls} width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }
  return null;
}

function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const isActive = (href: string) => {
    if (href === '/account') return pathname === '/account';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-bg">
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[240px] bg-surface border-r border-border flex-col z-30">
        <div className="p-6 border-b border-border">
          <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-display font-semibold text-lg">
            {initials}
          </div>
          <p className="mt-2 font-display font-semibold text-primary truncate">{user?.name || 'Account'}</p>
          <p className="text-sm text-text-muted truncate">{user?.email || ''}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {SIDEBAR_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px]',
                  active ? 'bg-accent-light text-accent border-r-2 border-accent' : 'hover:bg-bg-alt text-primary'
                )}
              >
                <Icon name={link.icon} active={active} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-error hover:bg-error/10 transition-colors min-h-[44px]"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="lg:ml-[240px] pb-20 lg:pb-0 min-h-screen">
        <div className="p-4 lg:p-8">{children}</div>
      </main>

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border z-40 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]"
        style={{ minHeight: 64 }}
      >
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] rounded-lg transition-colors',
                active ? 'text-accent' : 'text-text-muted'
              )}
            >
              <Icon name={tab.icon} active={active} />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AccountShell>{children}</AccountShell>
    </ProtectedRoute>
  );
}
