'use client';

import React, { useState } from 'react';

export interface SafeImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallbackSrc: string;
  alt: string;
}

/**
 * Lightweight client image component with a single-shot anti-loop onError fallback.
 * If the primary src fails (or is empty), it switches once to fallbackSrc and clears onerror.
 */
export function SafeImage({
  src,
  fallbackSrc,
  alt,
  className,
  onError,
  ...rest
}: SafeImageProps) {
  const normalizedSrc = src?.trim() || '';
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !normalizedSrc || failedSrc === normalizedSrc;
  const effectiveSrc = failed ? fallbackSrc : normalizedSrc;

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    if (!failed && normalizedSrc) {
      setFailedSrc(normalizedSrc);
    }
    onError?.(e);
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={effectiveSrc}
      alt={alt}
      className={className}
      onError={failed ? undefined : handleError}
    />
  );
}

export default SafeImage;
