import React from 'react';
import { useStore } from './store/useStore';
import { type Item } from './types';
import { Toaster } from 'react-hot-toast';
import { DnDProvider } from './store/DnDProvider';
import { usePlatform } from './hooks/usePlatform';
import { useAuth } from './hooks/useAuth';
import { useSync } from './hooks/useSync';
import LayoutSwitcher from './components/layouts/LayoutSwitcher';
import { CloudLightning, CheckCircle, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const { login } = useAuth();
  useSync();
  // const currentView = useStore((state: any) => state.currentView);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      // Global Undo (Ctrl+Z)
      const isZ = e.key === 'z' || e.key === 'Z' || e.code === 'KeyZ';
      if ((e.ctrlKey || e.metaKey) && isZ && !e.shiftKey && !e.altKey) {
        // If in input, only override if input is empty
        if (isInput) {
          const target = e.target as HTMLInputElement;
          if (target.value !== '') return;
        }

        e.preventDefault();
        e.stopPropagation();

        const state = useStore.getState();
        if (state.undo) {
          state.undo();
        }
        return;
      }

      // Input Guard for other shortcuts
      if (isInput) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const state = useStore.getState();
        if (state.selectedTaskIds.length > 0) {
          const { items, selectedTaskIds, copyWithSubtasks } = state;
          const selectedItems = items.filter((i: Item) => selectedTaskIds.includes(i.id));

          let textToCopy = '';

          if (copyWithSubtasks) {
            // Find top-level items among selection to avoid duplicates
            const topLevelSelected = selectedItems.filter(item =>
              !item.parent_id || !selectedTaskIds.includes(item.parent_id)
            );

            const formatItemRecursive = (item: Item, depth = 0): string => {
              const indent = "  ".repeat(depth);
              let text = `${indent}- ${item.title}`;

              // Find children in the full items list
              const children = items
                .filter((i: Item) => i.parent_id === item.id)
                .sort((a: Item, b: Item) => a.order_index - b.order_index);

              if (children.length > 0) {
                const childrenText = children.map(c => formatItemRecursive(c, depth + 1)).join('\n');
                text += '\n' + childrenText;
              }
              return text;
            };

            textToCopy = topLevelSelected
              .map(item => formatItemRecursive(item))
              .join('\n');
          } else {
            textToCopy = selectedItems.map(i => i.title).join('\n');
          }

          if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
              import('react-hot-toast').then(({ toast }) => {
                const message = copyWithSubtasks && selectedItems.some(item => items.some(i => i.parent_id === item.id))
                  ? (selectedItems.length > 1 ? `Copied ${selectedItems.length} items with subtasks` : 'Copied with subtasks')
                  : (selectedItems.length > 1 ? `Copied ${selectedItems.length} items` : 'Copied to clipboard');

                toast.success(message, {
                  duration: 3000,
                  id: 'copy-toast',
                  className: 'glass-toast-standard',
                });
              });
            });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (isInput) return;

      const text = e.clipboardData?.getData('text');
      if (text) {
        useStore.getState().handlePaste(text);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  React.useEffect(() => {
    const handleClick = () => {
      const { selectedTaskIds, clearTaskSelection } = useStore.getState();
      if (selectedTaskIds.length > 0) {
        clearTaskSelection();
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const { isExtension, platform } = usePlatform();
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  const [extAuthId, setExtAuthId] = React.useState<string | null>(null);
  const [acquiredToken, setAcquiredToken] = React.useState<string | null>(null);

  const user = useStore((state) => state.user);
  const redirectToken = useStore((state) => state.redirectToken);
  const setRedirectToken = useStore((state) => state.setRedirectToken);

  const handleManualLogin = async () => {
    try {
      const token = await login();
      if (token) {
        setAcquiredToken(token);
      }
    } catch (err) {
      console.error('[ListDock Auth] Manual login error:', err);
    }
  };

  // 1. Web Target: Register incoming extension auth requests
  React.useEffect(() => {
    if (isExtension) return;
    const urlParams = new URLSearchParams(window.location.search);
    const extAuth = urlParams.get('extAuth');
    if (extAuth) {
      sessionStorage.setItem('ext_auth_id', extAuth);
      setExtAuthId(extAuth);
      console.log('[ListDock Auth] Registered extension auth target ID:', extAuth);
    } else {
      const stored = sessionStorage.getItem('ext_auth_id');
      if (stored) {
        setExtAuthId(stored);
      }
    }
  }, [isExtension]);

  // 2. Web Target: Send newly acquired credentials back to extension
  React.useEffect(() => {
    if (isExtension) return;
    const currentExtId = extAuthId || sessionStorage.getItem('ext_auth_id');
    const tokenToSend = acquiredToken || redirectToken;
    if (user && tokenToSend && currentExtId) {
      console.log('[ListDock Auth] Sending newly acquired credentials back to Extension:', currentExtId);
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        try {
          chrome.runtime.sendMessage(currentExtId, {
            type: 'EXT_AUTH_SUCCESS',
            user,
            token: tokenToSend
          }, (response) => {
            console.log('[ListDock Auth] Extension auth response:', response);
            sessionStorage.removeItem('ext_auth_id');
            setExtAuthId(null);
            setAcquiredToken(null);
            setRedirectToken(null);
            // Clean up the URL search parameter
            window.history.replaceState({}, document.title, window.location.pathname);
            
            import('react-hot-toast').then(({ toast }) => {
              toast.success('Successfully linked with Chrome Extension! Closing tab...');
              setTimeout(() => window.close(), 1500);
            });
          });
        } catch (e) {
          console.error('[ListDock Auth] Messaging to extension failed:', e);
        }
      }
    }
  }, [user, acquiredToken, redirectToken, isExtension, extAuthId, setRedirectToken]);

  // 3. Extension Target: Listen for credentials from browser tab
  React.useEffect(() => {
    if (!isExtension) return;

    const handleExternalMessage = (
      message: unknown,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => {
      console.log('[ListDock Auth] Received credentials externally:', message);
      const msg = message as { type?: string; user?: import('./types').AuthUser; token?: string };
      if (msg && msg.type === 'EXT_AUTH_SUCCESS') {
        const { setUser, setGoogleAccessToken, setIsSyncEnabled, triggerSync } = useStore.getState();
        setUser(msg.user || null);
        setGoogleAccessToken(msg.token || null);
        setIsSyncEnabled(true);
        
        import('react-hot-toast').then(({ toast }) => {
          toast.success('Google Sync linked successfully!');
        });

        // Trigger initial sync automatically
        triggerSync(msg.token);
        sendResponse({ success: true });
      }
    };

    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.onMessageExternal) {
        chrome.runtime.onMessageExternal.addListener(handleExternalMessage);
        return () => {
          chrome.runtime.onMessageExternal.removeListener(handleExternalMessage);
        };
      }
    } catch (e) {
      console.error('[ListDock Auth] Failed to register external listener:', e);
    }
  }, [isExtension]);

  // 4. Web Target: Auto silent re-auth when PWA is already signed in
  React.useEffect(() => {
    if (isExtension || !user || !extAuthId) return;

    const trySilentAuth = async () => {
      try {
        console.log('[ListDock Auth] User is already signed in on Web. Attempting silent token refresh...');
        const { refreshGoogleTokenSilently } = await import('./hooks/useSync');
        const token = await refreshGoogleTokenSilently(false);
        
        console.log('[ListDock Auth] Silent token refresh succeeded! Setting acquired token.');
        setAcquiredToken(token);
      } catch (err) {
        console.warn('[ListDock Auth] Silent token refresh failed, waiting for manual click:', err);
      }
    };

    // Delay briefly to allow GIS script loading
    const timer = setTimeout(() => {
      trySilentAuth();
    }, 800);

    return () => clearTimeout(timer);
  }, [user, extAuthId, isExtension]);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (!isExtension) {
      console.log(`[ListDock] Running on platform: ${platform}`);
      return;
    }

    // Establish connection with background script to track open state
    const port = chrome.runtime.connect({ name: 'sidepanel' });

    // Handle messages from background
    port.onMessage.addListener((msg) => {
      if (msg.type === 'CLOSE_SIDE_PANEL') {
        window.close();
      }
    });

    // Find the current window ID and notify background
    chrome.windows.getCurrent().then((window) => {
      if (window.id) {
        port.postMessage({ type: 'INIT_SIDE_PANEL', windowId: window.id });
      }
    });

    return () => port.disconnect();
  }, [isExtension, platform]);

  if (extAuthId && !isExtension) {
    return (
      <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#050408] text-white p-6 font-mono select-none">
        {/* Mesh Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.12),transparent_65%)] pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        
        <div className="w-full max-w-sm bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 text-center space-y-6 shadow-2xl relative z-10">
          <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto border border-purple-500/30">
            <CloudLightning size={32} className="text-purple-400 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-bold tracking-wider text-purple-300">EXTENSION AUTH</h2>
            <p className="text-xs text-gray-400">
              Link your tasks and folders securely with the Chrome Extension sidebar.
            </p>
          </div>
          
          <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
            {user ? (
              <>
                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <p className="text-xs text-green-400 font-bold flex items-center gap-1.5">
                    <CheckCircle size={14} /> Web Session Detected
                  </p>
                  <p className="text-[10px] text-gray-400 max-w-[220px] truncate">
                    {user.email}
                  </p>
                </div>
                
                <button
                  onClick={handleManualLogin}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] shadow-lg shadow-purple-600/20"
                >
                  Link Extension Sync
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <p className="text-xs text-yellow-400 font-bold flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Authorization Required
                  </p>
                </div>
                
                <button
                  onClick={handleManualLogin}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-white text-gray-900 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all active:scale-[0.98] shadow-lg shadow-white/10"
                >
                  <img 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    alt="Google" 
                    className="w-4 h-4"
                  />
                  Sign in with Google
                </button>
              </>
            )}
          </div>
          
          <p className="text-[9px] text-gray-600">
            LIST DOCK SECURE AUTH BRIDGE • MV3 COMPLIANT
          </p>
        </div>
      </div>
    );
  }

  return (
    <DnDProvider>
      <LayoutSwitcher />
      <Toaster
        position={windowWidth < 500 ? "bottom-center" : "bottom-right"}
        containerClassName="toast-container"
        containerStyle={{
          bottom: windowWidth < 500 ? 100 : 40,
          right: windowWidth < 500 ? undefined : 40,
          zIndex: 99999,
        }}
        toastOptions={{
          duration: 3000,
          className: 'glass-toast',
        }}
      />
    </DnDProvider>
  );
};

export default App;
