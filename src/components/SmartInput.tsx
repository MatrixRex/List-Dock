import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Search, FolderPlus, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../utils/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SmartInput: React.FC = () => {
    const [value, setValue] = useState('');
    const [mode, setMode] = useState<'task' | 'folder' | 'search'>('task');
    const { addItem, currentView, currentFolderId, setSearchQuery, isMenuOpen, selectedTaskId, setSelectedTaskId, items } = useStore();

    // Mode 2: Add Subtask (if task selected - let's simplify and use mode for UI)
    // Mode 3: Add Folder toggle (Root only)

    const isFolderView = currentView === 'folder';
    const selectedItem = items.find(i => i.id === selectedTaskId);

    const handleAction = () => {
        if (!value.trim() && mode !== 'search') return;

        if (mode === 'search') return;

        addItem({
            id: uuidv4(),
            type: mode === 'folder' ? 'folder' : 'task',
            title: value,
            is_completed: false,
            parent_id: isFolderView ? currentFolderId : null,
            order_index: Date.now(),
            is_expanded: false,
            created_at: Date.now(),
        });

        setValue('');
    };

    const getPlaceholder = () => {
        if (mode === 'search') return "Search lists...";
        if (mode === 'folder') return "New folder name...";

        if (selectedItem) {
            return `Add subtask to "${selectedItem.title}"...`;
        }

        return isFolderView ? "Add task to folder..." : "Add task to root...";
    };

    return (
        <div className="p-4 glass glass-top-only shrink-0 sticky bottom-0 z-[200]">
            <div className={cn(
                "flex items-center gap-2 glass !bg-white/[0.03] backdrop-blur-xl rounded-xl p-1.5 transition-all text-gray-200",
                "focus-within:!bg-white/[0.08] focus-within:shadow-[0_0_30px_-5px_rgba(255,255,255,0.08)]",
                "border border-white/5",
                selectedTaskId && "border-purple-500/50 bg-purple-500/5",
                isMenuOpen && "pointer-events-none opacity-50 shadow-none border-gray-800"
            )}>
                <div className="flex bg-white/5 rounded-lg p-0.5 relative">
                    <AnimatePresence mode="popLayout">
                        <button
                            onClick={() => setMode('task')}
                            className={cn(
                                "p-1.5 rounded-md transition-all relative z-10",
                                mode === 'task' ? "text-white" : "text-gray-500 hover:text-gray-300"
                            )}
                            title="Add Task"
                        >
                            <Plus size={18} />
                            {mode === 'task' && (
                                <motion.div
                                    layoutId="mode-pill"
                                    className={cn(
                                        "absolute inset-0 rounded-md shadow-lg -z-10",
                                        selectedTaskId ? "bg-purple-600" : "bg-blue-500"
                                    )}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                        {!isFolderView && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8, width: 0 }}
                                animate={{ opacity: 1, scale: 1, width: 'auto' }}
                                exit={{ opacity: 0, scale: 0.8, width: 0 }}
                                onClick={() => setMode('folder')}
                                className={cn(
                                    "p-1.5 rounded-md transition-all relative z-10",
                                    mode === 'folder' ? "text-white" : "text-gray-500 hover:text-gray-300"
                                )}
                                title="Add Folder"
                            >
                                <FolderPlus size={18} />
                                {mode === 'folder' && (
                                    <motion.div
                                        layoutId="mode-pill"
                                        className="absolute inset-0 bg-blue-500 rounded-md shadow-lg -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </motion.button>
                        )}
                        <button
                            onClick={() => setMode('search')}
                            className={cn(
                                "p-1.5 rounded-md transition-all relative z-10",
                                mode === 'search' ? "text-white" : "text-gray-500 hover:text-gray-300"
                            )}
                            title="Search"
                        >
                            <Search size={18} />
                            {mode === 'search' && (
                                <motion.div
                                    layoutId="mode-pill"
                                    className="absolute inset-0 bg-blue-500 rounded-md shadow-lg -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    </AnimatePresence>
                </div>

                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        if (mode === 'search') setSearchQuery(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAction()}
                    placeholder={getPlaceholder()}
                    className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm py-1.5 px-2 placeholder:text-gray-600 text-gray-100"
                />

                {(value || (selectedTaskId && mode === 'task')) && (
                    <button
                        onClick={() => {
                            if (value) {
                                setValue('');
                                if (mode === 'search') setSearchQuery('');
                            } else if (selectedTaskId) {
                                setSelectedTaskId(null);
                            }
                        }}
                        className="p-1 px-2 text-gray-500 hover:text-white transition-colors"
                        title={value ? "Clear input" : "Deselect task"}
                    >
                        <X size={16} />
                    </button>
                )}
                {mode !== 'search' && !value && (
                    <div className="px-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest hidden sm:block">
                        Enter
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmartInput;
