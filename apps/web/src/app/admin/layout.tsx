'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { AdminIcon } from '@/components/admin/ui';

const NAV_SECTIONS = [
  { label: 'Overview', items: [{ href: '/admin', label: 'Dashboard', icon: 'chart' }] },
  { label: 'Catalogue', items: [{ href: '/admin/products', label: 'Products', icon: 'box' }, { href: '/admin/categories', label: 'Categories', icon: 'folder' }] },
  { label: 'Commerce', items: [{ href: '/admin/orders', label: 'Orders', icon: 'cart' }, { href: '/admin/inventory', label: 'Inventory', icon: 'package' }, { href: '/admin/shipping', label: 'Shipping', icon: 'truck' }] },
  { label: 'Customers', items: [{ href: '/admin/customers', label: 'Customers', icon: 'users' }, { href: '/admin/coupons', label: 'Coupons', icon: 'tag' }] },
  { label: 'Content', items: [{ href: '/admin/banners', label: 'Banners', icon: 'image' }] },
  { label: 'Analytics', items: [{ href: '/admin/reports', label: 'Reports', icon: 'bar' }] },
];

const BOTTOM_NAV = [
  { href: '/admin', label: 'Home', icon: 'chart', match: (p: string) => p === '/admin' },
  { href: '/admin/orders', label: 'Orders', icon: 'cart', match: (p: string) => p.startsWith('/admin/orders') },
  { href: '/admin/products', label: 'Products', icon: 'box', match: (p: string) => p.startsWith('/admin/products') },
  { href: '#menu', label: 'Menu', icon: 'grid', match: () => false },
];

const STAFF_HIDDEN = ['/admin/customers', '/admin/coupons', '/admin/reports', '/admin/shipping'];

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/products/new': 'New Product',
  '/admin/categories': 'Categories',
  '/admin/orders': 'Orders',
  '/admin/inventory': 'Inventory',
  '/admin/customers': 'Customers',
  '/admin/coupons': 'Coupons',
  '/admin/banners': 'Banners',
  '/admin/reports': 'Reports',
  '/admin/shipping': 'Shipping',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.match(/\/admin\/products\/[^/]+\/edit/)) return 'Edit Product';
  if (pathname.match(/\/admin\/orders\/[^/]+/)) return 'Order Details';
  if (pathname.match(/\/admin\/customers\/[^/]+/)) return 'Customer';
  return 'YAC Admin';
}

function isNestedRoute(pathname: string): boolean {
  return pathname !== '/admin'
    && !['/admin/products', '/admin/orders', '/admin/categories', '/admin/inventory',
      '/admin/customers', '/admin/coupons', '/admin/banners', '/admin/reports', '/admin/shipping'].includes(pathname);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { logout } = useAuth();

  const isStaff = user?.role === 'staff';
  const isAllowed = user && (user.role === 'admin' || isStaff);

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken || !user) {
      router.replace('/login?returnUrl=' + encodeURIComponent(pathname || '/admin'));
      return;
    }
    if (user.role !== 'admin' && user.role !== 'staff') {
      router.replace('/account');
      return;
    }
    if (isStaff && STAFF_HIDDEN.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
      router.replace('/admin/orders');
    }
  }, [hydrated, accessToken, user, router, pathname, isStaff]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const filteredSections = isStaff
    ? NAV_SECTIONS.filter((s) => !['Customers', 'Analytics'].includes(s.label))
        .map((s) => ({ ...s, items: s.items.filter((i) => !STAFF_HIDDEN.includes(i.href)) }))
        .filter((s) => s.items.length > 0)
    : NAV_SECTIONS;

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const pageTitle = getPageTitle(pathname || '/admin');
  const showBack = isNestedRoute(pathname || '');

  if (!hydrated || !isAllowed) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--admin-bg,#0a0c10)]">
        <div className="admin-spinner" />
      </div>
    );
  }

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {filteredSections.map((section) => (
        <div key={section.label} className="mb-5">
          <p className="px-3 mb-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">
            {section.label}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn('admin-nav-link', active && 'admin-nav-link-active')}
                >
                  <AdminIcon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div data-admin className="admin-layout">
      {/* Mobile header */}
      <header className="admin-header lg:hidden">
        {showBack ? (
          <button type="button" onClick={() => router.back()} className="admin-header-back" aria-label="Go back">
            <AdminIcon name="back" />
          </button>
        ) : (
          <div className="w-11" />
        )}
        <span className="admin-header-title truncate">{pageTitle}</span>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="admin-header-back"
          aria-label="Open menu"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--admin-accent)] text-[var(--admin-accent-text)] flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
        </button>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={() => setDrawerOpen(false)}>
          <div className="admin-drawer-overlay" />
          <aside className="admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--admin-border)]">
              <span className="font-display text-lg text-[var(--admin-accent)]">YAC Admin</span>
              <button type="button" onClick={() => setDrawerOpen(false)} className="admin-header-back" aria-label="Close menu">
                <AdminIcon name="x" />
              </button>
            </div>
            <nav className="flex-1 p-3 overflow-y-auto">
              <NavLinks onNavigate={() => setDrawerOpen(false)} />
            </nav>
            <div className="p-4 border-t border-[var(--admin-border)]">
              <div className="flex items-center gap-3 mb-3 px-1">
                <div className="w-10 h-10 rounded-full bg-[var(--admin-accent)] text-[var(--admin-accent-text)] flex items-center justify-center font-bold text-sm">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{user?.name}</p>
                  <p className="text-xs text-[var(--admin-text-muted)] capitalize">{user?.role}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { logout(); setDrawerOpen(false); }}
                className="admin-nav-link w-full text-[var(--admin-error)]"
              >
                <AdminIcon name="logout" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="admin-sidebar">
        <div className="p-5 border-b border-[var(--admin-border)]">
          <span className="font-display text-xl text-[var(--admin-accent)]">YAC Admin</span>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-[var(--admin-border)]">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-10 h-10 rounded-full bg-[var(--admin-accent)] text-[var(--admin-accent-text)] flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-[var(--admin-text-muted)] capitalize">{user?.role}</p>
            </div>
          </div>
          <button type="button" onClick={() => logout()} className="admin-nav-link w-full">
            <AdminIcon name="logout" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <div key={pathname} className="admin-page">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="admin-bottom-nav" aria-label="Admin navigation">
        {BOTTOM_NAV.map((item) => {
          if (item.href === '#menu') {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="admin-bottom-nav-item"
              >
                <AdminIcon name={item.icon} className="w-[1.375rem] h-[1.375rem]" />
                {item.label}
              </button>
            );
          }
          const active = item.match(pathname || '');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('admin-bottom-nav-item', active && 'admin-bottom-nav-item-active')}
            >
              <AdminIcon name={item.icon} className="w-[1.375rem] h-[1.375rem]" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
