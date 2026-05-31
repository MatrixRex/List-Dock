import { useEffect } from 'react';
import { 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
    GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { toast } from 'react-hot-toast';

export const useAuth = () => {
    const { user, isAuthLoading, setUser, setIsAuthLoading } = useStore();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
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

        return () => unsubscribe();
    }, [setUser, setIsAuthLoading]);

    const login = async () => {
        try {
            setIsAuthLoading(true);
            const result = await signInWithPopup(auth, googleProvider);
            
            // This is where we can extract the access token for Google Drive later
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;
            
            if (token) {
                // In a real app, you might want to store this token securely
                // for the session to use with Drive API.
                // For now, we'll just log that we got it.
                console.log('Google Access Token obtained');
            }

            toast.success('Successfully logged in!');
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
