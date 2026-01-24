import React, { useEffect, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

export default function AdBlockerDetector() {
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Method 1: Try to detect ad blocker by attempting to load a fake ad
    const detectAdBlock = async () => {
      try {
        // Create a bait element that looks like an ad
        const bait = document.createElement('div');
        bait.className = 'ad ads adsbox doubleclick ad-placement ad-placeholder adbadge BannerAd';
        bait.style.cssText = 'position: absolute; top: -1px; left: -1px; width: 1px; height: 1px;';
        document.body.appendChild(bait);

        // Check if the element was hidden or removed by ad blocker
        setTimeout(() => {
          const isBlocked = 
            bait.offsetParent === null || 
            bait.offsetHeight === 0 || 
            bait.offsetWidth === 0 ||
            window.getComputedStyle(bait).display === 'none' ||
            window.getComputedStyle(bait).visibility === 'hidden';

          document.body.removeChild(bait);
          
          if (isBlocked) {
            setAdBlockDetected(true);
          }
        }, 100);
      } catch (e) {
        console.log('Ad block detection failed:', e);
      }
    };

    // Method 2: Check if common ad blocker variables exist
    const checkAdBlockerExtensions = () => {
      // Check for common ad blocker properties
      if (
        // @ts-ignore
        window.canRunAds === false ||
        // @ts-ignore
        window.canShowAds === false ||
        // @ts-ignore
        typeof window.adsbygoogle === 'undefined'
      ) {
        setAdBlockDetected(true);
      }
    };

    // Run both detection methods
    detectAdBlock();
    checkAdBlockerExtensions();

    // Check if user previously dismissed the warning
    const dismissedStorage = localStorage.getItem('adblocker-warning-dismissed');
    if (dismissedStorage) {
      const dismissedTime = parseInt(dismissedStorage);
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      // Show warning again after 24 hours
      if (Date.now() - dismissedTime < oneDayMs) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('adblocker-warning-dismissed', Date.now().toString());
  };

  if (!adBlockDetected || dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative max-w-md mx-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-red-500">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <ShieldAlert className="w-8 h-8 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Ad Blocker Detected
          </h2>
        </div>

        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <p>
            We've detected that you're using an ad blocker. We understand that ads can be annoying, 
            but they help us keep this service free for everyone.
          </p>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
              💡 This website is completely free and relies on ad revenue to cover hosting costs.
            </p>
          </div>

          <p className="text-sm">
            <strong>Please consider:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm ml-2">
            <li>Disabling your ad blocker for this site</li>
            <li>Whitelisting our domain in your ad blocker settings</li>
            <li>Supporting us to keep the service running</li>
          </ul>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            You can dismiss this message, but it will appear again tomorrow.
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Continue Anyway
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}
