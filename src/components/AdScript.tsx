import { useEffect } from 'react';

interface AdScriptProps {
  src: string;
  id?: string; // unique id to prevent duplicates
}

export default function AdScript({ src, id = 'external-ad-script' }: AdScriptProps) {
  useEffect(() => {
    try {
      // Prevent duplicate injection
      if (document.querySelector(`script[data-ad-id=\"${id}\"]`)) return;
      const s = document.createElement('script');
      s.type = 'text/javascript';
      s.src = src;
      s.async = true;
      s.defer = true;
      s.setAttribute('data-ad-id', id);
      s.onload = () => console.info(`[Ads] Loaded script ${id}`);
      s.onerror = () => console.warn(`[Ads] Failed to load script ${id}`);
      document.body.appendChild(s);
    } catch (e) {
      console.warn('[Ads] Injection error', e);
    }
    return () => {
      // Keep ad script persistent after injection; do not remove on unmount
    };
  }, [src, id]);

  return null;
}
