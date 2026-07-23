'use client';

import { useEffect } from 'react';

// Registers the service worker so the demo is installable and works offline.
// Kept intentionally minimal — see public/sw.js.
export function ServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* offline support is a nice-to-have; ignore failures */
      });
    }
  }, []);
  return null;
}
