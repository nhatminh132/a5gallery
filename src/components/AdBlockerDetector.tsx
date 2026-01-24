import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

/**
 * Ad Blocker Detector Component
 * Detects if user has an ad blocker and shows a blocking modal
 */
export default function AdBlockerDetector() {
  const [adBlockDetected, setAdBlockDetected] = useState(false);

  useEffect(() => {
    // Method 1: Try to detect ad blocker by attempting to load a fake ad
    const detectAdBlock = async () => {
      try {
        // Create a bait element that looks like an ad
        const bait = document.createElement('div');
        bait.className = 'ad ads adsbox doubleclick ad-placement ad-placeholder adbadge BannerAd';
        bait.style.cssText = 'position: absolute; top: -1px; left: -1px; width: 1px; height: 1px;';
        bait.innerHTML = '&nbsp;';
        document.body.appendChild(bait);

        // Check if the element was hidden or removed by ad blocker
        setTimeout(() => {
          try {
            const computedStyle = window.getComputedStyle(bait);
            const isBlocked = 
              bait.offsetParent === null || 
              bait.offsetHeight === 0 || 
              bait.offsetLeft === 0 ||
              computedStyle.display === 'none' ||
              computedStyle.visibility === 'hidden';

            if (document.body.contains(bait)) {
              document.body.removeChild(bait);
            }
            
            // Only mark as blocked if definitely blocked
            if (isBlocked) {
              console.warn('Ad blocker detected via DOM inspection');
              setAdBlockDetected(true);
            } else {
              console.log('No ad blocker detected');
            }
          } catch (e) {
            console.log('Ad block check error:', e);
            // If we can't check, assume no blocker
          }
        }, 150);
      } catch (e) {
        console.log('Ad block detection failed:', e);
      }
    };

    // Method 2: Try to fetch a Google Ads script (more reliable)
    const checkGoogleAds = async () => {
      try {
        const response = await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
          method: 'HEAD',
          mode: 'no-cors'
        });
        // If fetch succeeds without error, ads are not blocked
        console.log('Google Ads script accessible');
      } catch (e) {
        // If fetch fails, it's likely blocked
        console.warn('Ad blocker detected via fetch test');
        setAdBlockDetected(true);
      }
    };

    // Run detection methods
    detectAdBlock();
    checkGoogleAds();
  }, []);

  if (!adBlockDetected) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-md mx-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-red-500">

        <div className="flex items-center gap-3 mb-4">
          <ShieldAlert className="w-8 h-8 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            tắt chặn quảng cáo cho bố ~
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

          <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-4">
            ⚠️ You must disable your ad blocker to use this website.
          </p>
        </div>

        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
          >
            🔄 Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}
