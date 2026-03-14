'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const MIN = 0;
const MAX = 500000;
const STEP = 1000;

export function PriceRangeSlider({ min, max, onChange }) {
  const minVal = min !== '' && min != null ? parseInt(String(min), 10) : MIN;
  const maxVal = max !== '' && max != null ? parseInt(String(max), 10) : MAX;
  const [localMin, setLocalMin] = useState(minVal);
  const [localMax, setLocalMax] = useState(maxVal);
  const minRef = useRef(null);
  const maxRef = useRef(null);

  useEffect(() => {
    setLocalMin(minVal);
    setLocalMax(maxVal);
  }, [minVal, maxVal]);

  const handleMinChange = (e) => {
    const v = Math.min(parseInt(e.target.value, 10) || MIN, localMax - STEP);
    setLocalMin(v);
    onChange?.(String(v), String(localMax));
  };

  const handleMaxChange = (e) => {
    const v = Math.max(parseInt(e.target.value, 10) || MAX, localMin + STEP);
    setLocalMax(v);
    onChange?.(String(localMin), String(v));
  };

  const minPercent = ((localMin - MIN) / (MAX - MIN)) * 100;
  const maxPercent = ((localMax - MIN) / (MAX - MIN)) * 100;

  return (
    <div className="py-4">
      <div className="relative h-2 bg-bg-alt rounded-full">
        <div
          className="absolute h-full bg-accent rounded-full"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <input
          ref={minRef}
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={localMin}
          onChange={handleMinChange}
          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
        />
        <input
          ref={maxRef}
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={localMax}
          onChange={handleMaxChange}
          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-text-muted">
        <span>₦{localMin.toLocaleString()}</span>
        <span>₦{localMax.toLocaleString()}</span>
      </div>
    </div>
  );
}
