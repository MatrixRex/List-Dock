import React from 'react';
import { useStore } from './store/useStore';
import { type Item } from './types';
import { Toaster } from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { DnDProvider } from './store/DnDProvider';
import { usePlatform } from './hooks/usePlatform';
import { useAuth } from './hooks/useAuth';
import { useSync } from './hooks/useSync';
import LayoutSwitcher from './components/layouts/LayoutSwitcher';
import { CloudLightning, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

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
  const [extAuthSilent, setExtAuthSilent] = React.useState<boolean>(false);
  const [acquiredToken, setAcquiredToken] = React.useState<{ idToken: string; accessToken: string } | null>(null);

  const user = useStore((state) => state.user);
  const redirectToken = useStore((state) => state.redirectToken);
  const setRedirectToken = useStore((state) => state.setRedirectToken);
  const theme = useStore((state) => state.theme);

  React.useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const handleManualLogin = async () => {
    try {
      const creds = await login();
      if (creds) {
        setAcquiredToken(creds);
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
    const silent = urlParams.get('silent') === 'true';
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
    if (silent) {
      sessionStorage.setItem('ext_auth_silent', 'true');
      setExtAuthSilent(true);
    } else {
      const storedSilent = sessionStorage.getItem('ext_auth_silent') === 'true';
      setExtAuthSilent(storedSilent);
    }
  }, [isExtension]);

  // 2. Web Target: Send newly acquired credentials back to extension
  React.useEffect(() => {
    if (isExtension) return;
    const currentExtId = extAuthId || sessionStorage.getItem('ext_auth_id');
    
    // Parse redirect credentials if available
    let parsedRedirectCreds: { idToken: string; accessToken: string } | null = null;
    if (redirectToken) {
      try {
        parsedRedirectCreds = JSON.parse(redirectToken);
      } catch (e) {
        console.error('[ListDock Auth] Failed to parse redirectToken:', e);
      }
    }
    
    const credsToSend = acquiredToken || parsedRedirectCreds;
    
    if (user && credsToSend && currentExtId) {
      console.log('[ListDock Auth] Sending newly acquired credentials back to Extension:', currentExtId);
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        try {
          chrome.runtime.sendMessage(currentExtId, {
            type: 'EXT_AUTH_SUCCESS',
            user,
            idToken: credsToSend.idToken,
            accessToken: credsToSend.accessToken
          }, (response) => {
            console.log('[ListDock Auth] Extension auth response:', response);
            sessionStorage.removeItem('ext_auth_id');
            sessionStorage.removeItem('ext_auth_silent');
            setExtAuthId(null);
            setExtAuthSilent(false);
            setAcquiredToken(null);
            setRedirectToken(null);
            // Clean up the URL search parameter
            window.history.replaceState({}, document.title, window.location.pathname);
            
            if (extAuthSilent) {
              window.close();
            } else {
              import('react-hot-toast').then(({ toast }) => {
                toast.success('Successfully linked with Chrome Extension! Closing tab...');
                setTimeout(() => window.close(), 1500);
              });
            }
          });
        } catch (e) {
          console.error('[ListDock Auth] Messaging to extension failed:', e);
          if (extAuthSilent) window.close();
        }
      }
    }
  }, [user, acquiredToken, redirectToken, isExtension, extAuthId, setRedirectToken, extAuthSilent]);

  // 3. Extension Target: Listen for credentials from browser tab
  React.useEffect(() => {
    if (!isExtension) return;

    const handleExternalMessage = (
      message: unknown,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => {
      console.log('[ListDock Auth] Received credentials externally:', message);
      const msg = message as { type?: string; user?: import('./types').AuthUser; idToken?: string; accessToken?: string };
      if (msg && msg.type === 'EXT_AUTH_SUCCESS' && msg.idToken && msg.accessToken) {
        const { setUser, setIsSyncEnabled } = useStore.getState();
        
        import('./lib/firebase').then(({ auth }) => {
          import('firebase/auth').then(({ GoogleAuthProvider, signInWithCredential }) => {
            const credential = GoogleAuthProvider.credential(msg.idToken, msg.accessToken);
            signInWithCredential(auth, credential)
              .then((userCred) => {
                console.log('[ListDock Auth] Extension signed in successfully:', userCred.user.uid);
                setUser(msg.user || null);
                setIsSyncEnabled(true);
                
                import('react-hot-toast').then(({ toast }) => {
                  toast.success('Cloud Sync linked successfully!');
                });
                sendResponse({ success: true });
              })
              .catch((err) => {
                console.error('[ListDock Auth] Extension sign-in failed:', err);
                import('react-hot-toast').then(({ toast }) => {
                  toast.error('Sync link failed. Please retry.');
                });
                sendResponse({ success: false, error: err.message });
              });
          });
        });
        return true; // Keep response channel open for async execution
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
      // In Firestore implementation, Extension manages its own login session persistence.
      // We only refresh if needed, but for now we skipgis token refreshing
      console.log('[ListDock Auth] Silent auth bridge triggered for logged in PWA user.');
    };

    const timer = setTimeout(() => {
      trySilentAuth();
    }, 800);

    return () => clearTimeout(timer);
  }, [user, extAuthId, isExtension]);

  // 5. Web Target: Auto-close silent auth tab if user is not logged in or silent auth fails
  React.useEffect(() => {
    if (isExtension || !extAuthId || !extAuthSilent) return;

    const closeTimeout = setTimeout(() => {
      console.log('[ListDock Auth] Silent auth tab timing out. Closing...');
      sessionStorage.removeItem('ext_auth_id');
      sessionStorage.removeItem('ext_auth_silent');
      window.close();
    }, 6000);

    return () => clearTimeout(closeTimeout);
  }, [isExtension, extAuthId, extAuthSilent]);

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
    if (extAuthSilent) {
      return (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gray-950 text-gray-100 p-6 font-mono select-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.12),transparent_65%)] pointer-events-none" />
          <div className="flex flex-col items-center justify-center space-y-3 relative z-10">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-xs text-gray-400">Refreshing connection...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gray-950 text-gray-100 p-6 font-mono select-none">
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
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-[#ffffff] rounded-xl text-xs font-bold transition-all active:scale-[0.98] shadow-lg shadow-purple-600/20"
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
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-[#ffffff] text-[#111827] rounded-xl text-xs font-bold hover:bg-[#f3f4f6] transition-all active:scale-[0.98] shadow-lg shadow-black/10"
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
      {createPortal(
        <Toaster
          position={windowWidth < 500 ? "bottom-center" : "bottom-right"}
          containerClassName="toast-container"
          containerStyle={
            windowWidth < 500
              ? {
                  bottom: 100,
                  zIndex: 99999,
                }
              : {
                  bottom: 40,
                  right: 40,
                  zIndex: 99999,
                }
          }
          toastOptions={{
            duration: 3000,
            className: 'glass-toast',
          }}
        />,
        document.body
      )}
    </DnDProvider>
  );
};

export default App;
