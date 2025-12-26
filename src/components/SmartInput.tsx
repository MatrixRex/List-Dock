import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Search, FolderPlus, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../utils/utils';

const SmartInput: React.FC = () => {
    const [value, setValue] = useState('');
    const [mode, setMode] = useState<'task' | 'folder' | 'search'>('task');
    const { addItem, currentView, currentFolderId, setSearchQuery, isMenuOpen } = useStore();

    // Mode 2: Add Subtask (if task selected - let's simplify and use mode for UI)
    // Mode 3: Add Folder toggle (Root only)

    const isFolderView = currentView === 'folder';

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

    return (
        <div className="p-4 glass !border-b-0 !border-x-0 !rounded-none border-t border-white/10 shrink-0 sticky bottom-0 z-[200]">
            <div className={cn(
                "flex items-center gap-2 bg-gray-800/80 backdrop-blur-md rounded-xl border border-gray-700/50 p-1.5 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all shadow-2xl",
                isMenuOpen && "pointer-events-none opacity-50 shadow-none border-gray-800"
            )}>
                <div className="flex bg-gray-900/50 rounded-lg p-0.5">
                    <button
                        onClick={() => setMode('task')}
                        className={cn(
                            "p-1.5 rounded-md transition-all",
                            mode === 'task' ? "bg-blue-500 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                        )}
                        title="Add Task"
                    >
                        <Plus size={18} />
                    </button>
                    {!isFolderView && (
                        <button
                            onClick={() => setMode('folder')}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                mode === 'folder' ? "bg-blue-500 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                            )}
                            title="Add Folder"
                        >
                            <FolderPlus size={18} />
                        </button>
                    )}
                    <button
                        onClick={() => setMode('search')}
                        className={cn(
                            "p-1.5 rounded-md transition-all",
                            mode === 'search' ? "bg-blue-500 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                        )}
                        title="Search"
                    >
                        <Search size={18} />
                    </button>
                </div>

                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        if (mode === 'search') setSearchQuery(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAction()}
                    placeholder={
                        mode === 'task' ? (isFolderView ? "Add task to folder..." : "Add task to root...") :
                            mode === 'folder' ? "New folder name..." : "Search lists..."
                    }
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1.5 px-2 placeholder:text-gray-600 text-gray-100"
                />

                {value ? (
                    <button
                        onClick={() => {
                            setValue('');
                            if (mode === 'search') setSearchQuery('');
                        }}
                        className="p-1 px-2 text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                ) : mode !== 'search' && (
                    <div className="px-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest hidden sm:block">
                        Enter
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmartInput;
