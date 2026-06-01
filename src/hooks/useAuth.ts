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
    const { user, isAuthLoading, setUser, setIsAuthLoading, setGoogleAccessToken, setIsSyncEnabled, setRedirectToken } = useStore();
    const { isExtension, isMobile } = usePlatform();

    useEffect(() => {
        if (isExtension) {
            setIsAuthLoading(false);
            return;
        }

        let isMounted = true;

        const handleRedirectAndAuth = async () => {
            let unsubscribe: (() => void) | undefined = undefined;
            try {
                // Check if we have redirect result (runs immediately and resolves)
                const result = await getRedirectResult(auth);
                if (result && isMounted) {
                    const credential = GoogleAuthProvider.credentialFromResult(result);
                    const token = credential?.accessToken;
                    if (token) {
                        setGoogleAccessToken(token);
                        setIsSyncEnabled(true);
                        setRedirectToken(token);
                        console.log('[ListDock Auth] Google Access Token obtained & stored via redirect result');
                    }
                    toast.success('Successfully logged in!');
                }
            } catch (error) {
                console.error('[ListDock Auth] Redirect sign-in error:', error);
                toast.error('Failed to log in with Google.');
            }

            if (isMounted) {
                // Subscribe to normal auth state changes
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
    }, [setUser, setIsAuthLoading, setGoogleAccessToken, setIsSyncEnabled, setRedirectToken, isExtension]);

    const login = async () => {
        try {
            setIsAuthLoading(true);

            if (isExtension && typeof chrome !== 'undefined' && chrome.runtime?.id) {
                // In Manifest V3 Extensions, popup sign-in violates CSP.
                // We redirect the user to the secure web app in a browser tab to complete authentication.
                const extensionId = chrome.runtime.id;
                let webUrl = `https://matrixrex.github.io/List-Dock/?extAuth=${extensionId}`;
                
                try {
                    // Quick probe with a 1-second timeout to see if a local dev server is running
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 1000);
                    
                    await fetch('http://localhost:3102/', {
                        method: 'HEAD',
                        mode: 'no-cors',
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    webUrl = `http://localhost:3102/?extAuth=${extensionId}`;
                    console.log('[ListDock Auth] Local development server running on port 3102. Redirecting locally.');
                } catch {
                    console.log('[ListDock Auth] Local server not active. Redirecting to production URL.');
                }

                toast.loading('Opening secure tab for authentication...', { id: 'ext-auth-loading', duration: 3000 });
                window.open(webUrl, '_blank');
                setIsAuthLoading(false);
                return;
            }

            if (isMobile) {
                // Use redirect sign-in for mobile devices/PWAs
                toast.loading('Redirecting to Google for sign-in...', { id: 'mobile-auth-loading', duration: 3000 });
                await signInWithRedirect(auth, googleProvider);
                return;
            }

            // Standard Web PWA popup sign-in
            const result = await signInWithPopup(auth, googleProvider);
            
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;
            
            if (token) {
                setGoogleAccessToken(token);
                setIsSyncEnabled(true);
                console.log('Google Access Token obtained & stored');
            }

            toast.success('Successfully logged in!');
            return token || undefined;
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
            setGoogleAccessToken(null);
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
