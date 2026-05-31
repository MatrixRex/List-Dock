import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { usePlatform } from './usePlatform';

/**
 * Dynamically loads the Google Identity Services client script for PWA.
 */
function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Window unavailable'));
    if ((window as any).google?.accounts?.oauth2) return resolve();

    const existing = document.getElementById('google-gsi-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

/**
 * Initializes the Google Identity Services token client for silent background authentication on PWA.
 */
function initGisClient(callback: (token: string) => void, onError: (err: any) => void) {
  if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        onError(new Error('VITE_GOOGLE_CLIENT_ID is not configured.'));
        return null;
      }
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        prompt: 'none', // completely silent background request
        callback: (resp: any) => {
          if (resp.access_token) {
            callback(resp.access_token);
          } else {
            onError(resp);
          }
        },
        error_callback: (err: any) => {
          onError(err);
        },
      });
      return client;
    } catch (e) {
      console.error('[ListDock Sync] GIS init failed:', e);
      onError(e);
    }
  } else {
    onError(new Error('Google Identity Services client library not loaded.'));
  }
  return null;
}

/**
 * Silent re-authentication helper.
 * Resolves to a fresh Google Access Token or rejects if silent flow is unavailable.
 */
export async function refreshGoogleTokenSilently(isExtension: boolean): Promise<string> {
  if (isExtension && typeof chrome !== 'undefined' && chrome.identity?.getAuthToken) {
    // Only call getAuthToken if oauth2 configuration exists in manifest.json
    const manifest = chrome.runtime.getManifest();
    if (!manifest.oauth2 || !manifest.oauth2.client_id) {
      throw new Error('Extension OAuth2 client ID is not configured in manifest.json.');
    }

    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: false }, (tokenInfo: any) => {
        if (tokenInfo) {
          const tokenStr = typeof tokenInfo === 'object' ? tokenInfo.token : tokenInfo;
          if (tokenStr) {
            resolve(tokenStr);
          } else {
            reject(new Error('No token returned'));
          }
        } else {
          const err = chrome.runtime.lastError;
          reject(new Error(err ? err.message : 'Extension silent auth failed'));
        }
      });
    });
  } else {
    // PWA Web silent re-auth via GIS: first check if a Google Client ID is configured
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('VITE_GOOGLE_CLIENT_ID is not configured. Silent background refresh is unavailable.');
    }

    await loadGisScript();
    
    return new Promise((resolve, reject) => {
      const client = initGisClient(
        (token) => resolve(token),
        (err) => reject(err)
      );
      if (client) {
        client.requestAccessToken();
      } else {
        reject(new Error('Google Identity Services client unavailable'));
      }
    });
  }
}

/**
 * Custom React hook that drives the automatic background synchronization worker.
 * Handles startup sync, debounced changes sync, online/offline recovery, and silent re-auth.
 */
export const useSync = () => {
  const {
    items,
    deletedItems,
    isSyncEnabled,
    googleAccessToken,
    lastSynced,
    syncStatus,
    setGoogleAccessToken,
    triggerSync,
  } = useStore();

  const { isExtension } = usePlatform();
  const initialSyncAttempted = useRef(false);

  // Helper to determine if we have local unsynced edits
  const hasUnsyncedEdits = () => {
    const maxItemUpdate = items.reduce((max, item) => Math.max(max, item.updated_at || 0), 0);
    const maxDeletedUpdate = Object.values(deletedItems || {}).reduce((max, t) => Math.max(max, t), 0);
    const maxUpdate = Math.max(maxItemUpdate, maxDeletedUpdate);

    return !lastSynced || maxUpdate > lastSynced;
  };

  // 1. Startup Sync & Silent Re-auth
  useEffect(() => {
    if (!isSyncEnabled || initialSyncAttempted.current) return;

    const startupSync = async () => {
      initialSyncAttempted.current = true;
      console.log('[ListDock Sync] Startup triggered. Attempting silent re-auth...');
      
      try {
        const freshToken = await refreshGoogleTokenSilently(isExtension);
        setGoogleAccessToken(freshToken);
        console.log('[ListDock Sync] Silent re-auth succeeded. Triggering initial sync.');
        await triggerSync(freshToken);
      } catch (err) {
        console.warn('[ListDock Sync] Silent background re-auth failed, attempting standard stored token:', err);
        // Fallback: try with existing token
        if (googleAccessToken) {
          await triggerSync(googleAccessToken);
        }
      }
    };

    startupSync();
  }, [isSyncEnabled, isExtension, setGoogleAccessToken, triggerSync]);

  // 2. Debounced Sync on local user edits
  useEffect(() => {
    if (!isSyncEnabled || syncStatus === 'syncing') return;

    // Only schedule a sync if there are actual unsynced edits
    if (!hasUnsyncedEdits()) return;

    console.log('[ListDock Sync] Local modifications detected. Scheduling sync in 10s...');

    const delayDebounce = setTimeout(async () => {
      console.log('[ListDock Sync] Executing scheduled debounced sync...');
      
      let tokenToUse = googleAccessToken;
      try {
        // Attempt a silent token refresh before syncing to prevent expiration errors mid-flight
        const freshToken = await refreshGoogleTokenSilently(isExtension);
        setGoogleAccessToken(freshToken);
        tokenToUse = freshToken;
      } catch (err) {
        console.warn('[ListDock Sync] Pre-sync silent re-auth failed, using cached token:', err);
      }

      if (tokenToUse) {
        await triggerSync(tokenToUse);
      }
    }, 10000); // 10 seconds debounce

    return () => clearTimeout(delayDebounce);
  }, [items, deletedItems, isSyncEnabled, googleAccessToken, lastSynced, syncStatus]);

  // 3. Online/Offline state listener to resume sync when connection returns
  useEffect(() => {
    if (!isSyncEnabled) return;

    const handleOnline = async () => {
      console.log('[ListDock Sync] Device is online. Re-syncing...');
      let tokenToUse = googleAccessToken;
      try {
        const freshToken = await refreshGoogleTokenSilently(isExtension);
        setGoogleAccessToken(freshToken);
        tokenToUse = freshToken;
      } catch (err) {
        console.warn('[ListDock Sync] Online reconnect silent re-auth failed:', err);
      }

      if (tokenToUse) {
        await triggerSync(tokenToUse);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isSyncEnabled, googleAccessToken, isExtension, setGoogleAccessToken, triggerSync]);
};
export default useSync;
