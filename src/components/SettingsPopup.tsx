import React from 'react';
import { useStore } from '../store/useStore';
import { Trash2, X, Settings as SettingsIcon, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsPopup: React.FC<SettingsPopupProps> = ({ isOpen, onClose }) => {
    const {
        clearItems,
        showCompleted,
        setShowCompleted,
        hideCompletedSubtasks,
        setHideCompletedSubtasks,
        persistLastFolder,
        setPersistLastFolder
    } = useStore();
    const [showConfirm, setShowConfirm] = React.useState(false);

    // Reset confirm state when closing
    React.useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(() => setShowConfirm(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleClearData = () => {
        if (showConfirm) {
            clearItems();
            onClose();
        } else {
            setShowConfirm(true);
        }
    };

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
                        <div className="p-4 space-y-6">
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1"> Preferences </label>

                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-white">Show Completed</p>
                                            <p className="text-xs text-gray-400">Display tasks marked as done.</p>
                                        </div>
                                        <button
                                            onClick={() => setShowCompleted(!showCompleted)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showCompleted ? 'bg-purple-500' : 'bg-gray-700'}`}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showCompleted ? 'translate-x-5' : 'translate-x-0'}`}
                                            />
                                        </button>
                                    </div>

                                    <div className="h-px bg-gray-800/80 my-3" />

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-white">Hide Completed Subtasks</p>
                                            <p className="text-xs text-gray-400">Hide subtasks once finished.</p>
                                        </div>
                                        <button
                                            onClick={() => setHideCompletedSubtasks(!hideCompletedSubtasks)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${hideCompletedSubtasks ? 'bg-purple-500' : 'bg-gray-700'}`}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hideCompletedSubtasks ? 'translate-x-5' : 'translate-x-0'}`}
                                            />
                                        </button>
                                    </div>

                                    <div className="h-px bg-gray-800/80 my-3" />

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-white">Remember Last Folder</p>
                                            <p className="text-xs text-gray-400">Reopen the last used folder on startup.</p>
                                        </div>
                                        <button
                                            onClick={() => setPersistLastFolder(!persistLastFolder)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${persistLastFolder ? 'bg-purple-500' : 'bg-gray-700'}`}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${persistLastFolder ? 'translate-x-5' : 'translate-x-0'}`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1"> Data Management </label>

                                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-800/50">
                                    <AnimatePresence mode="wait">
                                        {showConfirm ? (
                                            <motion.div
                                                key="confirm"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-4"
                                            >
                                                <div className="flex gap-3 text-amber-400">
                                                    <AlertTriangle size={20} className="shrink-0" />
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium text-white">Are you absolutely sure?</p>
                                                        <p className="text-xs text-gray-400 leading-relaxed">
                                                            This will permanently delete all your tasks and folders. This action cannot be undone.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setShowConfirm(false)}
                                                        className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleClearData}
                                                        className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-red-500/20"
                                                    >
                                                        Clear Everything
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="button"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="flex items-center justify-between"
                                            >
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-white">Clear All Data</p>
                                                    <p className="text-xs text-gray-400">Delete all tasks and reset folders.</p>
                                                </div>
                                                <button
                                                    onClick={handleClearData}
                                                    className="p-2 bg-gray-800 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg border border-transparent hover:border-red-500/20 transition-all"
                                                    title="Clear all data"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="pb-2">
                                <p className="text-[10px] text-center text-gray-600 font-medium">
                                    LIST DOCK V1.0.0 • PERSISTENT STORAGE
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SettingsPopup;
