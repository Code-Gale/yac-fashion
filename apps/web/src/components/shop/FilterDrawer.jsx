'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { PriceRangeSlider } from '@/components/shop/PriceRangeSlider';
import { cn } from '@/lib/utils';

const PRICE_MIN = 0;
const PRICE_MAX = 500000;

export function FilterDrawer({
  open,
  onClose,
  categories = [],
  category,
  minPrice,
  maxPrice,
  inStock,
  minRating,
  updateParams,
  embedded = false,
}) {
  const [localCategory, setLocalCategory] = useState(category);
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);
  const [localStock, setLocalStock] = useState(inStock);
  const [localRating, setLocalRating] = useState(minRating);

  useEffect(() => {
    setLocalCategory(category);
    setLocalMin(minPrice);
    setLocalMax(maxPrice);
    setLocalStock(inStock);
    setLocalRating(minRating);
  }, [category, minPrice, maxPrice, inStock, minRating]);

  const apply = () => {
    const u = {
      category: localCategory || undefined,
      minPrice: localMin && parseInt(localMin, 10) !== PRICE_MIN ? localMin : undefined,
      maxPrice: localMax && parseInt(localMax, 10) !== PRICE_MAX ? localMax : undefined,
      inStock: localStock || undefined,
      minRating: localRating || undefined,
    };
    if (updateParams) updateParams(u);
    if (onClose) onClose();
  };

  const clear = () => {
    setLocalCategory('');
    setLocalMin('');
    setLocalMax('');
    setLocalStock('');
    setLocalRating('');
    if (updateParams) updateParams({});
    if (onClose) onClose();
  };

  const content = (
    <div className="space-y-6">
      <div>
        <h4 className="font-display font-semibold text-sm mb-2">Categories</h4>
        <div className="space-y-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="cat"
              checked={!localCategory}
              onChange={() => setLocalCategory('')}
              className="rounded-full"
            />
            <span className="text-sm">All</span>
          </label>
          {categories.map((c) => (
            <label key={c._id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="cat"
                checked={localCategory === c.slug}
                onChange={() => setLocalCategory(c.slug)}
                className="rounded-full"
              />
              <span className="text-sm">{c.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-display font-semibold text-sm mb-2">Price Range</h4>
        <PriceRangeSlider
          min={localMin}
          max={localMax}
          onChange={(min, max) => {
            setLocalMin(min);
            setLocalMax(max);
          }}
        />
      </div>
      <div>
        <h4 className="font-display font-semibold text-sm mb-2">Availability</h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={localStock === 'true'}
            onChange={(e) => setLocalStock(e.target.checked ? 'true' : '')}
          />
          <span className="text-sm">In stock only</span>
        </label>
      </div>
      <div>
        <h4 className="font-display font-semibold text-sm mb-2">Rating</h4>
        <div className="space-y-1">
          {[4, 3, 2, 1].map((r) => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                checked={localRating === String(r)}
                onChange={() => setLocalRating(localRating === String(r) ? '' : String(r))}
                className="rounded-full"
              />
              <span className="text-sm">{r}+ stars</span>
            </label>
          ))}
        </div>
      </div>
      {!embedded && (
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={clear} className="flex-1">
            Clear
          </Button>
          <Button onClick={apply} className="flex-1">
            Apply
          </Button>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div>
        {content}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={clear}>
            Clear all
          </Button>
          <Button size="sm" onClick={apply}>
            Apply
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Filters">
      {content}
    </Modal>
  );
}
