'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { useWishlist } from '@/hooks/useWishlist';
import { useWishlistStore } from '@/store/wishlist';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/categories', label: 'Categories' },
  { href: '/products/flash-sale', label: 'Sale' },
];

export function Header() {
  const pathname = usePathname();
  const scrollY = useScrollPosition();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ _id: string; slug: string; name?: string; price?: number; images?: string[] }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount);
  const { openCart } = useCartStore();
  const wishlistCount = useWishlistStore((s) => s.count);
  const { isInWishlist, fetchWishlist } = useWishlist();
  const wishlistPrimedRef = useRef(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (!isAuthenticated) {
      wishlistPrimedRef.current = false;
      return;
    }
    if (wishlistPrimedRef.current) return;
    if (userMenuOpen || drawerOpen) {
      wishlistPrimedRef.current = true;
      fetchWishlist();
    }
  }, [isAuthenticated, userMenuOpen, drawerOpen, fetchWishlist]);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    api
      .get(`/products/search?q=${encodeURIComponent(debouncedSearch)}`)
      .then(({ data }) => {
        const products = data?.data ?? data ?? [];
        setSearchResults(Array.isArray(products) ? products.slice(0, 5) : []);
      })
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false));
  }, [debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const [searchFocusedIndex, setSearchFocusedIndex] = useState(-1);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!searchOpen || searchResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchFocusedIndex((i) => Math.min(i + 1, searchResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchFocusedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && searchFocusedIndex >= 0 && searchResults[searchFocusedIndex]) {
      e.preventDefault();
      window.location.href = `/products/${searchResults[searchFocusedIndex].slug}`;
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
      setSearchFocusedIndex(-1);
    }
  };

  const setWishlist = useWishlistStore((s) => s.setWishlist);
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    setWishlist([]);
    clearAuth();
    setUserMenuOpen(false);
  };

  const scrolled = scrollY > 10;

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 transition-all duration-300',
          'lg:h-[72px] h-14',
          scrolled && 'bg-surface/95 backdrop-blur-md border-b border-border'
        )}
      >
        <div className="h-full px-4 lg:px-10 flex items-center justify-between max-w-[1536px] mx-auto">
          <button
            type="button"
            className="lg:hidden p-2 -m-2 flex flex-col justify-center gap-1.5 w-10 h-10"
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label="Menu"
            aria-expanded={drawerOpen}
          >
            <span
              className={cn(
                'block w-6 h-0.5 bg-primary transition-transform',
                drawerOpen && 'rotate-45 translate-y-2'
              )}
            />
            <span
              className={cn(
                'block w-6 h-0.5 bg-primary transition-opacity',
                drawerOpen && 'opacity-0'
              )}
            />
            <span
              className={cn(
                'block w-6 h-0.5 bg-primary transition-transform',
                drawerOpen && '-rotate-45 -translate-y-2'
              )}
            />
          </button>

          <Link
            href="/"
            className="font-display font-semibold tracking-[0.2em] text-primary text-lg lg:text-xl"
          >
            <span className="lg:hidden">YAC</span>
            <span className="hidden lg:inline">YAC FASHION HOUSE</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'font-body font-medium text-primary hover:text-accent transition-colors',
                  pathname === link.href && 'text-accent'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 lg:gap-4">
            <div ref={searchRef} className="relative">
              {searchOpen ? (
                <div className="w-[200px] lg:w-[280px]">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search..."
                    className="w-full h-9 lg:h-10 px-4 border border-border rounded-md text-sm focus:outline-none focus:border-primary"
                    autoFocus
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-surface rounded-lg shadow-lg border border-border overflow-hidden z-50">
                      {searchResults.map((p, i) => (
                        <Link
                          key={p._id}
                          href={`/products/${p.slug}`}
                          className={cn(
                            'flex items-center gap-3 p-3 hover:bg-bg-alt transition-colors',
                            searchFocusedIndex === i && 'bg-bg-alt'
                          )}
                          onClick={() => setSearchOpen(false)}
                        >
                          {p.images?.[0] && (
                            <img
                              src={p.images[0]}
                              alt=""
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-text-muted">
                              ₦{p.price?.toLocaleString()}
                            </p>
                          </div>
                        </Link>
                      ))}
                      <Link
                        href={`/search?q=${encodeURIComponent(searchQuery)}`}
                        className="block p-3 text-center text-sm text-accent font-medium hover:bg-bg-alt"
                        onClick={() => setSearchOpen(false)}
                      >
                        See all results
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="p-2 -m-2 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  aria-label="Search"
                >
                  <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}
            </div>

            {isAuthenticated && (
              <Link
                href="/account/wishlist"
                className="hidden lg:block p-2 -m-2 relative hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                aria-label="Wishlist"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            <button
              type="button"
              onClick={openCart}
              className="p-2 -m-2 relative hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
              aria-label="Cart"
            >
              <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-accent text-white text-xs font-medium rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="p-2 -m-2 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                aria-label="Account"
                aria-expanded={userMenuOpen}
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 py-2 bg-surface rounded-lg shadow-lg border border-border z-50">
                  {isAuthenticated ? (
                    <>
                      <Link
                        href="/account"
                        className="block px-4 py-2 text-sm hover:bg-bg-alt"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My Account
                      </Link>
                      <Link
                        href="/account/orders"
                        className="block px-4 py-2 text-sm hover:bg-bg-alt"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My Orders
                      </Link>
                      <Link
                        href="/account/wishlist"
                        className="block px-4 py-2 text-sm hover:bg-bg-alt lg:hidden"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Wishlist
                      </Link>
                      <hr className="my-2 border-border" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-bg-alt text-error"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block px-4 py-2 text-sm hover:bg-bg-alt"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        className="block px-4 py-2 text-sm hover:bg-bg-alt"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Register
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden transition-opacity duration-300',
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div
          className="absolute inset-0 bg-black/30"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-full max-w-sm bg-primary text-white transform transition-transform duration-300',
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex flex-col h-full pt-20 px-6 pb-8">
            <nav className="flex flex-col gap-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-display text-xl font-medium hover:text-accent transition-colors"
                  onClick={() => setDrawerOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-4">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/account"
                    className="font-display text-lg"
                    onClick={() => setDrawerOpen(false)}
                  >
                    My Account
                  </Link>
                  <Link
                    href="/account/wishlist"
                    className="font-display text-lg"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Wishlist
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-left font-display text-lg text-accent"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="font-display text-lg"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="font-display text-lg"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
