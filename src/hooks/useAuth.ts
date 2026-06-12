import { useEffect } from 'react';
import { 
    signInWithPopup, 
    signInWithRedirect,
    getRedirectResult,
    signOut, 
    onAuthStateChanged,
    GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { usePlatform } from './usePlatform';
import { toast } from 'react-hot-toast';

export const useAuth = () => {
    const { user, isAuthLoading, setUser, setIsAuthLoading, setIsSyncEnabled, setRedirectToken } = useStore();
    const { isExtension, isMobile } = usePlatform();

    useEffect(() => {
        let isMounted = true;

        const handleRedirectAndAuth = async () => {
            let unsubscribe: (() => void) | undefined = undefined;
            
            // Redirect auth result is only applicable on the Web/PWA target
            if (!isExtension) {
                try {
                    const result = await getRedirectResult(auth);
                    if (result && isMounted) {
                        const credential = GoogleAuthProvider.credentialFromResult(result);
                        const token = credential?.accessToken;
                        const idToken = credential?.idToken;
                        if (token && idToken) {
                            setIsSyncEnabled(true);
                            setRedirectToken(JSON.stringify({ idToken, accessToken: token }));
                            console.log('[ListDock Auth] Google credentials obtained via redirect');
                        }
                        toast.success('Successfully logged in!');
                    }
                } catch (error) {
                    console.error('[ListDock Auth] Redirect sign-in error:', error);
                    toast.error('Failed to log in with Google.');
                }
            }

            if (isMounted) {
                // Subscribe to auth state changes on both PWA and Extension
                unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
                    if (firebaseUser) {
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                        });
                    } else {
                        setUser(null);
                    }
                    setIsAuthLoading(false);
                });
            }
            return unsubscribe;
        };

        setIsAuthLoading(true);
        const unsubscribePromise = handleRedirectAndAuth();

        return () => {
            isMounted = false;
            unsubscribePromise.then((unsubscribe) => {
                if (unsubscribe) unsubscribe();
            });
        };
    }, [setUser, setIsAuthLoading, setIsSyncEnabled, setRedirectToken, isExtension]);

    const login = async (): Promise<{ idToken: string; accessToken: string } | undefined> => {
        try {
            setIsAuthLoading(true);

            if (isExtension && typeof chrome !== 'undefined' && chrome.runtime?.id) {
                // Extension CSP blocks popups; redirect user to secure Web PWA auth bridge
                const extensionId = chrome.runtime.id;
                let webUrl = `https://matrixrex.github.io/List-Dock/?extAuth=${extensionId}`;
                
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 1000);
                    
                    await fetch('http://localhost:3102/', {
                        method: 'HEAD',
                        mode: 'no-cors',
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    webUrl = `http://localhost:3102/?extAuth=${extensionId}`;
                    console.log('[ListDock Auth] Dev server active. Redirecting locally.');
                } catch {
                    console.log('[ListDock Auth] Dev server not active. Redirecting to production.');
                }

                toast.loading('Opening secure tab for authentication...', { id: 'ext-auth-loading', duration: 3000 });
                window.open(webUrl, '_blank');
                setIsAuthLoading(false);
                return;
            }

            if (isMobile) {
                try {
                    console.log('[ListDock Auth] Attempting popup login on mobile...');
                    const result = await signInWithPopup(auth, googleProvider);
                    
                    const credential = GoogleAuthProvider.credentialFromResult(result);
                    const token = credential?.accessToken;
                    const idToken = credential?.idToken;
                    
                    if (token && idToken) {
                        setIsSyncEnabled(true);
                        toast.success('Successfully logged in!');
                        return { idToken, accessToken: token };
                    }
                } catch (popupError) {
                    const err = popupError as { code?: string };
                    console.warn('[ListDock Auth] Popup failed on mobile, checking fallback:', popupError);
                    
                    if (err.code === 'auth/cancelled-popup-request') {
                        setIsAuthLoading(false);
                        return;
                    }

                    const isPopupBlocked = err.code === 'auth/popup-blocked';
                    const isUnsupported = err.code === 'auth/operation-not-supported-in-this-environment';
                    
                    if (isPopupBlocked || isUnsupported || isMobile) {
                        console.log('[ListDock Auth] Popup blocked/unsupported. Falling back to redirect...');
                        toast.loading('Redirecting to Google for sign-in...', { id: 'mobile-auth-loading', duration: 3000 });
                        await signInWithRedirect(auth, googleProvider);
                        return;
                    }
                    
                    throw popupError;
                }
            }

            // Standard Web PWA popup sign-in
            const result = await signInWithPopup(auth, googleProvider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;
            const idToken = credential?.idToken;
            
            if (token && idToken) {
                setIsSyncEnabled(true);
                toast.success('Successfully logged in!');
                return { idToken, accessToken: token };
            }
        } catch (error: unknown) {
            console.error('Login error:', error);
            const firebaseError = error as { code?: string };
            if (firebaseError.code === 'auth/popup-blocked') {
                toast.error('Login popup was blocked. Please allow popups for this site.');
            } else if (firebaseError.code === 'auth/cancelled-popup-request') {
                // User closed the popup, no need for error toast
            } else {
                toast.error('Failed to login with Google.');
            }
        } finally {
            setIsAuthLoading(false);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setIsSyncEnabled(false);
            toast.success('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Failed to logout');
        }
    };

    return {
        user,
        isAuthLoading,
        login,
        logout,
    };
};

