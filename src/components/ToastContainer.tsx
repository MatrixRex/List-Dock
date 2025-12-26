import React from 'react';
import { useStore } from '../store/useStore';
import { RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContainer: React.FC = () => {
    const { undo, undoStack } = useStore();

    const hasUndo = undoStack.length > 0;

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
            <AnimatePresence>
                {hasUndo && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        className="bg-gray-800 border border-gray-700 shadow-2xl rounded-full px-4 py-2 flex items-center gap-3"
                    >
                        <p className="text-xs text-gray-300">Action performed</p>
                        <button
                            onClick={undo}
                            className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider transition-colors"
                        >
                            <RotateCcw size={12} />
                            Undo
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ToastContainer;
