'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const SHOP_LINKS = [
  { href: '/products?new=true', label: 'New Arrivals' },
  { href: '/shop', label: 'All Products' },
  { href: '/cart', label: 'Cart' },
  { href: '/categories', label: 'Categories' },
  { href: '/products/flash-sale', label: 'Sale' },
];

const HELP_LINKS = [
  { href: '/track', label: 'Track Order' },
  { href: '/faqs', label: 'FAQs' },
  { href: '/returns', label: 'Returns Policy' },
  { href: '/contact', label: 'Contact Us' },
];

const SOCIAL_LINKS = [
  { href: 'https://instagram.com', label: 'Instagram', icon: 'instagram' },
  { href: 'https://tiktok.com', label: 'TikTok', icon: 'tiktok' },
  { href: 'https://facebook.com', label: 'Facebook', icon: 'facebook' },
  { href: 'https://wa.me/234', label: 'WhatsApp', icon: 'whatsapp' },
];

function SocialIcon({ icon }: { icon: string }) {
  const base = 'w-9 h-9 rounded-full border border-current flex items-center justify-center hover:bg-accent hover:border-accent hover:text-white transition-colors';
  if (icon === 'instagram') {
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  }
  if (icon === 'tiktok') {
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
      </svg>
    );
  }
  if (icon === 'facebook') {
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  if (icon === 'whatsapp') {
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    );
  }
  return null;
}

function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="lg:block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="lg:hidden w-full flex items-center justify-between py-4 border-b border-border text-left font-display text-heading-3"
      >
        {title}
        <svg
          className={cn('w-5 h-5 transition-transform', open && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={cn('lg:block', !open && 'hidden')}>
        {children}
      </div>
    </div>
  );
}

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="bg-bg-alt border-t border-border">
      <div className="max-w-[1536px] mx-auto px-4 lg:px-10 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          <AccordionSection title="Brand" defaultOpen>
            <div className="py-4 lg:py-0">
              <Link href="/" className="font-display font-semibold text-xl tracking-[0.2em] text-primary">
                YAC FASHION HOUSE
              </Link>
              <p className="mt-3 text-body text-text-muted max-w-xs">
                Luxury-accessible Nigerian fashion. Timeless pieces for the modern wardrobe.
              </p>
              <div className="flex gap-3 mt-4">
                {SOCIAL_LINKS.map((s) => (
                  <a
                    key={s.icon}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-muted hover:bg-accent hover:border-accent hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label={s.label}
                  >
                    <SocialIcon icon={s.icon} />
                  </a>
                ))}
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="Shop">
            <ul className="py-4 lg:py-0 space-y-3">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body text-text-muted hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </AccordionSection>

          <AccordionSection title="Help">
            <ul className="py-4 lg:py-0 space-y-3">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body text-text-muted hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </AccordionSection>

          <AccordionSection title="Newsletter">
            <div className="py-4 lg:py-0">
              <h4 className="font-display font-semibold text-primary">Stay in the loop</h4>
              <p className="mt-1 text-small text-text-muted">
                New drops, exclusive offers, style tips.
              </p>
              {subscribed ? (
                <p className="mt-4 text-small text-success">Thanks for subscribing!</p>
              ) : (
                <form onSubmit={handleSubscribe} className="mt-4 flex gap-2">
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" variant="accent" size="md">
                    Subscribe
                  </Button>
                </form>
              )}
              <p className="mt-2 text-xs text-text-muted">
                By subscribing you agree to our Privacy Policy.
              </p>
            </div>
          </AccordionSection>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-small text-text-muted">
            © {new Date().getFullYear()} YAC Fashion House. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-small text-text-muted">
            <Link href="/privacy" className="hover:text-accent transition-colors">
              Privacy Policy
            </Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-accent transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
