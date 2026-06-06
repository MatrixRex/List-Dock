import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../store/useStore';
import { LogOut, User, Cloud, Loader2, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { usePlatform } from '../hooks/usePlatform';

const AccountSection: React.FC = () => {
    const { user, isAuthLoading, login, logout } = useAuth();
    const { syncStatus, lastSynced, syncError, triggerSync } = useStore();
    const { isExtension } = usePlatform();
    const handleManualSync = async () => {
        const { googleAccessToken, setGoogleAccessToken } = useStore.getState();
        let tokenToUse = googleAccessToken;

        toast.loading('Refreshing sync session...', { id: 'manual-sync' });

        try {
            const { refreshGoogleTokenSilently } = await import('../hooks/useSync');
            const freshToken = await refreshGoogleTokenSilently(isExtension);
            setGoogleAccessToken(freshToken);
            tokenToUse = freshToken;
        } catch (err) {
            console.warn('[ListDock Sync] Manual sync silent re-auth failed:', err);
            // If silent refresh failed and we have no cached token, we cannot proceed
            if (!tokenToUse) {
                toast.error('Sync session expired. Please reconnect.', { id: 'manual-sync' });
                useStore.setState({
                    syncStatus: 'error',
                    syncError: 'Google Drive session expired. Please reconnect.'
                });
                return;
            }
        }

        if (tokenToUse) {
            toast.loading('Syncing with Google Drive...', { id: 'manual-sync' });
            try {
                await triggerSync(tokenToUse);
                const updatedState = useStore.getState();
                if (updatedState.syncStatus === 'success') {
                    toast.success('Synced successfully!', { id: 'manual-sync' });
                } else {
                    toast.error(updatedState.syncError || 'Sync failed.', { id: 'manual-sync' });
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Sync failed.';
                toast.error(errorMessage, { id: 'manual-sync' });
            }
        }
    };

    // Helper to format last synced time dynamically
    const formatLastSynced = (timestamp: number | null): string => {
        if (!timestamp) return 'Never synced';
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 10) return 'Just now';
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    const [prevLastSynced, setPrevLastSynced] = useState<number | null>(lastSynced);
    const [timeText, setTimeText] = useState(() => formatLastSynced(lastSynced));

    if (lastSynced !== prevLastSynced) {
        setPrevLastSynced(lastSynced);
        setTimeText(formatLastSynced(lastSynced));
    }

    // Update the relative time every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeText(formatLastSynced(lastSynced));
        }, 10000);

        return () => clearInterval(interval);
    }, [lastSynced]);

    return (
        <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1"> 
                Account & Sync 
            </label>

            <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                <AnimatePresence mode="wait">
                    {isAuthLoading ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-8 flex flex-col items-center justify-center space-y-3"
                        >
                            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                            <p className="text-xs text-gray-400">Authenticating...</p>
                        </motion.div>
                    ) : user ? (
                        <motion.div 
                            key="user"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-4 space-y-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    {user.photoURL ? (
                                        <img 
                                            src={user.photoURL} 
                                            alt={user.displayName || 'User'} 
                                            className="w-10 h-10 rounded-full border border-white/10"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                            <User size={20} className="text-purple-400" />
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#1a1a1a] rounded-full" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">
                                        {user.displayName || 'ListDock User'}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {user.email}
                                    </p>
                                </div>
                                <button 
                                    onClick={logout}
                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                    title="Logout"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>

                            {/* Sync Status Banner */}
                            <div className="space-y-2">
                                <div className={`flex items-start gap-2.5 p-3 rounded-lg border transition-all ${
                                    syncStatus === 'syncing' 
                                        ? 'bg-purple-500/5 border-purple-500/20' 
                                        : syncStatus === 'error'
                                        ? 'bg-red-500/10 border-red-500/20 text-red-200'
                                        : 'bg-green-500/5 border-green-500/20'
                                }`}>
                                    {syncStatus === 'syncing' ? (
                                        <Loader2 size={16} className="text-purple-400 animate-spin mt-0.5" />
                                    ) : syncStatus === 'error' ? (
                                        <AlertCircle size={16} className="text-red-400 mt-0.5" />
                                    ) : (
                                        <Check size={16} className="text-green-400 mt-0.5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[11px] font-medium leading-none ${
                                            syncStatus === 'syncing' 
                                                ? 'text-purple-300' 
                                                : syncStatus === 'error'
                                                ? 'text-red-300'
                                                : 'text-green-300'
                                        }`}>
                                            {syncStatus === 'syncing' 
                                                ? 'Syncing with Google Drive...' 
                                                : syncStatus === 'error'
                                                ? 'Synchronization Error'
                                                : 'Google Drive Synced'
                                            }
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1 truncate">
                                            {syncStatus === 'error' 
                                                ? (syncError || 'Check internet connection.') 
                                                : `Last backup: ${timeText}`
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* Manual trigger controls */}
                                <div className="flex items-center justify-between gap-2 pt-1 font-mono">
                                    <button
                                        onClick={handleManualSync}
                                        disabled={syncStatus === 'syncing'}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 active:bg-white/15 text-xs text-purple-300 hover:text-white rounded-lg border border-purple-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        <RefreshCw size={12} className={`text-purple-400 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                                        Sync Now
                                    </button>

                                    {syncStatus === 'error' && syncError?.includes('expired') && (
                                        <button
                                            onClick={login}
                                            className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-xs text-white rounded-lg transition-all active:scale-[0.98]"
                                        >
                                            Reconnect
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="login"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-6 text-center space-y-4"
                        >
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-white/10">
                                <Cloud size={24} className="text-gray-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-white">Enable Cloud Sync</p>
                                <p className="text-xs text-gray-400 px-4">
                                    Sync your tasks across devices using your own Google Drive.
                                </p>
                            </div>
                            <button
                                onClick={login}
                                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white text-gray-900 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all shadow-xl shadow-white/5 active:scale-[0.98]"
                            >
                                <img 
                                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                                    alt="Google" 
                                    className="w-5 h-5"
                                />
                                Sign in with Google
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AccountSection;
