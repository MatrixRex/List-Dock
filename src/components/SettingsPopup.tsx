import React from 'react';
import { X, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SettingsContent from './SettingsContent';
import { usePlatform } from '../hooks/usePlatform';

interface SettingsPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsPopup: React.FC<SettingsPopupProps> = ({ isOpen, onClose }) => {
    const { platform } = usePlatform();
    const isMobile = platform === 'mobile-pwa' || window.innerWidth < 640;

    // Reset confirm state when closing is handled in SettingsContent if needed, 
    // but here we just manage the visibility

    if (isMobile) {
        return null; // Handled by MobileLayout as a panel
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-sm bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <SettingsIcon className="text-gray-400" size={18} />
                                <h2 className="font-semibold text-white">Settings</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <SettingsContent onClose={onClose} />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SettingsPopup;
