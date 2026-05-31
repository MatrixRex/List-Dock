import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, Cloud, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AccountSection: React.FC = () => {
    const { user, isAuthLoading, login, logout } = useAuth();

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

                            <div className="flex items-center gap-2 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                <Cloud size={16} className="text-purple-400" />
                                <div className="flex-1">
                                    <p className="text-[11px] font-medium text-purple-300">Google Drive Sync Ready</p>
                                    <p className="text-[10px] text-purple-400/70 line-clamp-1">Data will be backed up automatically</p>
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
