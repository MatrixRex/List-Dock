import { useMemo } from 'react';

export type Platform = 'extension' | 'mobile-pwa' | 'desktop-web';

export const usePlatform = () => {
  const platform = useMemo((): Platform => {
    // Check if running as a Chrome extension
    const isExtension = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
    
    if (isExtension) {
      return 'extension';
    }

    // Check if running as a standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    // Check if mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isStandalone && isMobile) {
      return 'mobile-pwa';
    }

    // Fallback for desktop web or mobile browser (non-standalone)
    return 'desktop-web';
  }, []);

  return {
    platform,
    isExtension: platform === 'extension',
    isMobilePWA: platform === 'mobile-pwa',
    isDesktopWeb: platform === 'desktop-web',
  };
};
