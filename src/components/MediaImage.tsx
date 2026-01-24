import React, { useMemo, useState, useCallback } from 'react';
import { getMediaUrl } from '../lib/uploadService';
import type { Media } from '../lib/supabase';

// A robust image component that attempts multiple storage providers as fallbacks
// Useful when media records reference providers that aren't configured locally,
// or when bucket configuration differs between environments.

export type StorageId = 'storage1' | 'storage2' | 'storage3' | 'storage4';

interface MediaImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  filePath: string;
  storageProvider?: StorageId;
  fallbackOrder?: StorageId[]; // optional custom order
}

export default function MediaImage({
  filePath,
  storageProvider = 'storage1',
  fallbackOrder,
  alt,
  ...imgProps
}: MediaImageProps) {
  const providersOrder = useMemo<StorageId[]>(() => {
    const base: StorageId[] = ['storage1', 'storage2', 'storage3', 'storage4'];
    const preferredFirst = [storageProvider, ...base.filter((p) => p !== storageProvider)];
    return fallbackOrder && fallbackOrder.length > 0
      ? Array.from(new Set(fallbackOrder)) as StorageId[]
      : Array.from(new Set(preferredFirst)) as StorageId[];
  }, [storageProvider, fallbackOrder]);

  const [index, setIndex] = useState(0);

  const src = useMemo(() => {
    const current = providersOrder[Math.min(index, providersOrder.length - 1)];
    return getMediaUrl(filePath, current);
  }, [filePath, providersOrder, index]);

  const handleError = useCallback<React.ReactEventHandler<HTMLImageElement>>(() => {
    if (index < providersOrder.length - 1) {
      setIndex((i) => i + 1);
    }
    // else let it fail silently; caller can render fallback via CSS or parent onError
  }, [index, providersOrder.length]);

  return (
    <img
      {...imgProps}
      src={src}
      alt={alt}
      onError={handleError}
    />
  );
}
