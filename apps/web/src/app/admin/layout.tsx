'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const NAV_SECTIONS = [
  { label: 'OVERVIEW', items: [{ href: '/admin', label: 'Dashboard', icon: 'chart' }] },
  { label: 'CATALOGUE', items: [{ href: '/admin/products', label: 'Products', icon: 'box' }, { href: '/admin/categories', label: 'Categories', icon: 'folder' }] },
  { label: 'COMMERCE', items: [{ href: '/admin/orders', label: 'Orders', icon: 'cart' }, { href: '/admin/inventory', label: 'Inventory', icon: 'package' }] },
  { label: 'CUSTOMERS', items: [{ href: '/admin/customers', label: 'Customers', icon: 'users' }, { href: '/admin/coupons', label: 'Coupons', icon: 'tag' }] },
  { label: 'CONTENT', items: [{ href: '/admin/banners', label: 'Banners', icon: 'image' }] },
  { label: 'ANALYTICS', items: [{ href: '/admin/reports', label: 'Reports', icon: 'bar' }] },
];

function Icon({ name }: { name: string }) {
  const cls = 'w-5 h-5 flex-shrink-0';
  if (name === 'chart') return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
  if (name === 'box') return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
  if (name === 'folder') return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
  if (name === 'cart') return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
  if (name === 'package') return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10l8 4" /></svg>;
  if (name === 'users') return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
  if (name === 'tag') return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
  if (name === 'image') return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  if (name === 'bar') return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
  if (name === 'menu') return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
  if (name === 'x') return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
  if (name === 'logout') return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
  return null;
}

const STAFF_HIDDEN = ['/admin/customers', '/admin/coupons', '/admin/reports'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { logout } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const isAllowed = user && (isAdmin || isStaff);

  useEffect(() => {
    setHydrated(true);
  }, []);

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

  const filteredSections = isStaff
    ? NAV_SECTIONS.filter((s) => !['CUSTOMERS', 'ANALYTICS'].includes(s.label))
        .map((s) => ({ ...s, items: s.items.filter((i) => !STAFF_HIDDEN.includes(i.href)) }))
        .filter((s) => s.items.length > 0)
    : NAV_SECTIONS;

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  if (!hydrated || !isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
        <div className="animate-spin w-10 h-10 border-2 border-[#c9a84c] border-t-transparent rounded-full" />
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-white/10">
        <span className="font-display text-xl text-[#c9a84c]">YAC</span>
      </div>
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {filteredSections.map((section) => (
          <div key={section.label}>
            <p className="text-xs font-medium text-[#8b92a5] uppercase tracking-wider mb-2">{section.label}</p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors min-h-[44px]',
                      active ? 'bg-[#c9a84c]/15 text-[#c9a84c] border-r-2 border-[#c9a84c]' : 'text-[#8b92a5] hover:text-[#f0f0f0] hover:bg-white/5'
                    )}
                  >
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#c9a84c] text-[#0f1117] flex items-center justify-center font-semibold text-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f0f0f0] truncate">{user?.name}</p>
            <p className="text-xs text-[#8b92a5]">{user?.role}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { logout(); setSidebarOpen(false); }}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[#8b92a5] hover:bg-white/5 hover:text-[#f0f0f0] min-h-[44px]"
        >
          <Icon name="logout" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div data-admin className="admin-layout min-h-screen bg-[#0f1117]">
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-[#1a1d26] border-b border-white/10">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2"
          aria-label="Menu"
        >
          <Icon name="menu" />
        </button>
        <span className="font-display text-lg text-[#c9a84c]">YAC Admin</span>
        <div className="w-8 h-8 rounded-full bg-[#c9a84c] text-[#0f1117] flex items-center justify-center font-semibold text-xs">
          {initials}
        </div>
      </header>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#1a1d26] border-r border-white/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="font-display text-lg text-[#c9a84c]">YAC Admin</span>
              <button type="button" onClick={() => setSidebarOpen(false)} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Icon name="x" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 flex-col bg-[#1a1d26] border-r border-white/10 z-30">
        <SidebarContent />
      </aside>

      <main className="lg:ml-60 min-h-screen p-4 lg:p-6">
        {children}
      </main>
    </div>
  );
}
