import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Plus, Search, FolderPlus, ListTodo } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { Item } from '../types';
import { cn } from '../utils/utils';

interface SmartInputProps {
    isMobileOverlay?: boolean;
    onClose?: () => void;
    mode?: 'task' | 'folder' | 'search';
    onModeChange?: (mode: 'task' | 'folder' | 'search') => void;
}

const SmartInput: React.FC<SmartInputProps> = ({ isMobileOverlay, onClose, mode: initialMode, onModeChange }) => {
    const [value, setValue] = useState('');
    const [mode, setMode] = useState<'task' | 'folder' | 'search'>(initialMode || 'task');
    const { addItem, currentView, currentFolderId, setSearchQuery, isMenuOpen, selectedTaskIds, items } = useStore();
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Auto-focus when in mobile overlay
    React.useEffect(() => {
        if (isMobileOverlay) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isMobileOverlay]);

    const isFolderView = currentView === 'folder';
    const isSubtaskMode = selectedTaskIds.length === 1;
    const selectedItem = isSubtaskMode ? items.find((i: Item) => i.id === selectedTaskIds[0]) : null;
    const isMultiSelected = selectedTaskIds.length > 1;

    // Reset mode to task when entering folder view or subtask mode
    React.useEffect(() => {
        if ((isFolderView && mode === 'folder') || (isSubtaskMode && mode !== 'task')) {
            setMode('task');
        }
    }, [isFolderView, isSubtaskMode, mode]);

    // Sync search query with store when in search mode
    React.useEffect(() => {
        if (mode === 'search') {
            setSearchQuery(value);
        } else {
            setSearchQuery('');
        }
    }, [mode, value, setSearchQuery]);

    // Report mode change
    React.useEffect(() => {
        onModeChange?.(mode);
    }, [mode, onModeChange]);

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
        const isAddingSubtask = mode === 'task' && selectedItem;
        
        if (isAddingSubtask) {
            inputRef.current?.focus();
        }

        if (isMobileOverlay && onClose && !isAddingSubtask) onClose();
    };

    const getPlaceholder = () => {
        if (mode === 'search') {
            return isFolderView ? "Search in folder..." : "Search all tasks...";
        }
        if (mode === 'folder') {
            if (isMultiSelected) return `Create folder with ${selectedTaskIds.length} tasks...`;
            return "New folder name...";
        }

        if (selectedItem) {
            if (selectedItem.type === 'subtask') {
                const parent = items.find((i: Item) => i.id === selectedItem.parent_id);
                return `Add subtask to "${parent?.title || 'task'}"...`;
            }
            return `Add subtask to "${selectedItem.title}"...`;
        }

        return isFolderView ? "Add task to folder..." : "Add task to root...";
    };

    const modes = (isSubtaskMode ? [
        { id: 'task', icon: ListTodo, label: 'Task' },
    ] : [
        { id: 'task', icon: ListTodo, label: 'Task' },
        { id: 'search', icon: Search, label: 'Search' },
        ...(currentView === 'root' ? [{ id: 'folder', icon: FolderPlus, label: 'Folder' }] : []),
    ]) as const;

    return (
        <div
            className={cn(
                "shrink-0 z-[200] sticky bottom-0 w-full",
                isMobileOverlay ? "p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] bg-[#050408]/95 backdrop-blur-3xl border-t border-white/10 rounded-t-[2.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.8)]" : "glass glass-top-only p-4"
            )}
            onClick={(e) => e.stopPropagation()}
        >
            {isMobileOverlay && modes.length > 1 && (
                <div className="flex justify-center mb-6">
                    <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 shadow-inner">
                        {modes.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setMode(m.id as any)}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 relative",
                                    mode === m.id 
                                        ? "text-white shadow-lg" 
                                        : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                {mode === m.id && (
                                    <motion.div
                                        layoutId="activeMode"
                                        className="absolute inset-0 bg-purple-600 rounded-xl -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <m.icon size={18} className={cn(mode === m.id ? "text-white" : "opacity-70")} />
                                <span className="text-xs font-bold tracking-wide">{m.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className={cn(
                "flex items-center gap-3 glass !bg-white/[0.04] backdrop-blur-2xl rounded-2xl p-4 transition-all text-gray-200 shadow-xl",
                "focus-within:!bg-black/50 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:shadow-[0_0_50px_rgba(139,92,246,0.2)]",
                "border border-white/10",
                (selectedTaskIds.length > 0 && mode === 'task') && "border-purple-500/50 bg-purple-500/5",
                isMenuOpen && "pointer-events-none opacity-50 shadow-none border-gray-800"
            )}>
                <div className="pl-1">
                    {mode === 'search' ? (
                        <Search size={22} className="text-purple-400" />
                    ) : mode === 'folder' ? (
                        <FolderPlus size={22} className="text-purple-400" />
                    ) : (
                        <Plus size={22} className={cn(selectedTaskIds.length > 0 ? "text-purple-400" : "text-gray-500")} />
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        if (mode === 'search') setSearchQuery(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAction()}
                    placeholder={getPlaceholder()}
                    className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-lg py-1 px-1 placeholder:text-gray-600 text-gray-100 font-medium"
                />
                
                {value.trim() && mode !== 'search' && (
                    <motion.button 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={handleAction}
                        className="p-3 rounded-xl bg-purple-600 text-white shadow-xl shadow-purple-600/30 active:scale-95 transition-all"
                    >
                        {mode === 'folder' ? <FolderPlus size={22} /> : <Plus size={22} />}
                    </motion.button>
                )}
            </div>
        </div>
    );
};

export default SmartInput;
