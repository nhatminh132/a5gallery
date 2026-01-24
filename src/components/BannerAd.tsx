import { useEffect, useRef } from 'react';

type BannerAdProps = {
  keyId: string; // atOptions.key
  width: number;
  height: number;
  format?: 'iframe' | 'banner';
  loaderSrc: string; // network invoke script that consumes atOptions
  className?: string;
};

export default function BannerAd({ keyId, width, height, format = 'iframe', loaderSrc, className }: BannerAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous content (if any)
    containerRef.current.innerHTML = '';

    // Inject atOptions config
    const cfg = document.createElement('script');
    cfg.type = 'text/javascript';
    cfg.innerHTML = `
      var atOptions = {
        key: ${JSON.stringify(keyId)},
        format: ${JSON.stringify(format)},
        height: ${JSON.stringify(height)},
        width: ${JSON.stringify(width)},
        params: {}
      };
    `;

    // Loader script that renders the banner into this container
    const loader = document.createElement('script');
    loader.type = 'text/javascript';
    loader.src = loaderSrc;
    loader.async = true;

    containerRef.current.appendChild(cfg);
    containerRef.current.appendChild(loader);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [keyId, width, height, format, loaderSrc]);

  return <div ref={containerRef} className={className} style={{ width, height }} />;
}
