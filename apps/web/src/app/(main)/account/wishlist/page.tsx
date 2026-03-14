'use client';

import Link from 'next/link';
import { useWishlist } from '@/hooks/useWishlist';
import { useToast } from '@/components/ui/ToastContext';
import { ProductCard } from '@/components/shared/ProductCard';

export default function WishlistPage() {
  const { wishlist, removeWithUndo } = useWishlist();
  const { toast } = useToast();

  const handleWishlistRemove = async (productId: string) => {
    const result = await removeWithUndo(productId);
    if (result?.undo) {
      toast('Removed from wishlist', 'info', { undo: result.undo });
    }
  };

  if (wishlist.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 mx-auto rounded-full bg-accent-light flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-accent"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h2 className="font-display text-xl text-primary">Your wishlist is empty</h2>
        <p className="mt-2 text-text-muted">Save items you love for later</p>
        <Link
          href="/shop"
          className="inline-block mt-6 min-h-[44px] px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-colors"
        >
          Browse Shop
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-primary">Wishlist</h1>
      <p className="mt-1 text-text-muted">{wishlist.length} saved items</p>

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {wishlist.map((product: any, i: number) => (
          <div key={product._id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
            <ProductCard
              product={product}
              index={i}
              onWishlistRemove={handleWishlistRemove}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
