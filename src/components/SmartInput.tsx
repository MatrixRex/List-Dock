import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Search, FolderPlus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { Item } from '../types';
import { cn } from '../utils/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartInputProps {
    isMobileOverlay?: boolean;
    onClose?: () => void;
    onModeChange?: (mode: 'task' | 'folder' | 'search') => void;
}

const SmartInput: React.FC<SmartInputProps> = ({ isMobileOverlay, onClose, onModeChange }) => {
    const [value, setValue] = useState('');
    const [mode, setMode] = useState<'task' | 'folder' | 'search'>('task');
    const { addItem, currentView, currentFolderId, setSearchQuery, isMenuOpen, selectedTaskIds, items } = useStore();
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Auto-focus when in mobile overlay
    React.useEffect(() => {
        if (isMobileOverlay) {
            // Small delay to ensure the keyboard is invoked correctly on all mobile browsers
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isMobileOverlay]);

    const isFolderView = currentView === 'folder';
    const selectedItem = selectedTaskIds.length === 1 ? items.find((i: Item) => i.id === selectedTaskIds[0]) : null;
    const isMultiSelected = selectedTaskIds.length > 1;

    // Reset mode to task when entering folder view
    React.useEffect(() => {
        if (isFolderView && mode === 'folder') {
            setMode('task');
        }
    }, [isFolderView]);

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
        
        // Keep keyboard focused if adding subtask
        if (isAddingSubtask) {
            inputRef.current?.focus();
        }

        if (isMobileOverlay && onClose && !isAddingSubtask) onClose();
    };

    const getPlaceholder = () => {
        if (mode === 'search') return "Search lists...";
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

        if (isMultiSelected) {
            return `Add task (ignoring selection)...`;
        }

        return isFolderView ? "Add task to folder..." : "Add task to root...";
    };

    return (
        <div
            className={cn(
                "shrink-0 z-[200] sticky bottom-0 w-full",
                isMobileOverlay ? "p-6 bg-[#050408]/90 backdrop-blur-3xl border-t border-white/10 rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.5)]" : "glass glass-top-only p-4"
            )}
            onClick={(e) => e.stopPropagation()}
        >
            <div className={cn(
                "flex items-center gap-3 glass !bg-white/[0.03] backdrop-blur-xl rounded-2xl p-3 transition-all text-gray-200",
                "focus-within:!bg-black/40 focus-within:ring-1 focus-within:ring-white/10 focus-within:shadow-[0_0_40px_rgba(139,92,246,0.15)]",
                "border border-white/5",
                (selectedTaskIds.length > 0 && mode === 'task') && "border-blue-500/50 bg-blue-500/5",
                isMenuOpen && "pointer-events-none opacity-50 shadow-none border-gray-800"
            )}>
                <div className="pl-2 text-gray-500">
                    {mode === 'search' ? <Search size={20} /> : <Plus size={20} />}
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
                    className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-base py-1 px-1 placeholder:text-gray-600 text-gray-100"
                />
                
                {value.trim() && mode !== 'search' && (
                    <button 
                        onClick={handleAction}
                        className="p-2 rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                    >
                        <Plus size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SmartInput;
