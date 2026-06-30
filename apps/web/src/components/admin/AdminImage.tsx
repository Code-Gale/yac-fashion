'use client';

import { resolveImageUrl } from '@/lib/image-url';
import { cn } from '@/lib/utils';

type AdminImageProps = {
  src: string;
  alt?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
};

/** Native img for admin previews — avoids next/image remotePatterns blocking fresh uploads. */
export function AdminImage({ src, alt = '', fill, width, height, className }: AdminImageProps) {
  const resolvedSrc = resolveImageUrl(src);

  if (fill) {
    return (
      <img
        src={resolvedSrc}
        alt={alt}
        className={cn('absolute inset-0 h-full w-full', className)}
      />
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}
