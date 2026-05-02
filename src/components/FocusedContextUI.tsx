import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
// import { type Item } from '../types';
import TaskCard from './TaskCard';
import FolderCard from './FolderCard';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
// import { cn } from '../utils/utils';
import { Check } from 'lucide-react';

interface FocusedContextUIProps {
    mode: 'task' | 'folder' | 'search';
    onClose?: () => void;
}

const FocusedContextUI: React.FC<FocusedContextUIProps> = ({ mode, onClose }) => {
    const { items, selectedTaskIds, searchQuery, showCompleted, currentView, currentFolderId } = useStore();
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    
    const isSubtaskMode = mode === 'task' && selectedTaskIds.length === 1;
    const isSearchMode = mode === 'search';

    // Subtask Mode Context
    const subtaskContext = useMemo(() => {
        if (!isSubtaskMode) return null;
        
        const selectedTaskId = selectedTaskIds[0];
        const selectedItem = items.find(i => i.id === selectedTaskId);
        if (!selectedItem) return null;

        // If selected item is a subtask, find its parent
        const parentTask = selectedItem.type === 'subtask' 
            ? items.find(i => i.id === selectedItem.parent_id)
            : selectedItem;
        
        if (!parentTask) return null;

        const subtasks = items.filter(i => i.parent_id === parentTask.id && i.type === 'subtask');
        
        return {
            parent: parentTask,
            subtasks: subtasks.sort((a, b) => a.order_index - b.order_index)
        };
    }, [items, selectedTaskIds, isSubtaskMode]);

    // Search Mode Context
    const searchResults = useMemo(() => {
        if (!isSearchMode || !searchQuery.trim()) return { tasks: [], folders: [] };

    const searchableTasks = items.filter(i => {
        const isTaskOrSubtask = i.type === 'task' || i.type === 'subtask';
        const isVisible = showCompleted || !i.is_completed;
        
        if (currentView === 'folder') {
            // In folder view, search within this folder and its subtasks
            if (i.parent_id === currentFolderId) return isTaskOrSubtask && isVisible;
            if (i.type === 'subtask') {
                const parent = items.find(p => p.id === i.parent_id);
                return parent?.parent_id === currentFolderId && isVisible;
            }
            return false;
        }
        
        return isTaskOrSubtask && isVisible;
    });

    const searchableFolders = currentView === 'root' 
        ? items.filter(i => i.type === 'folder')
        : [];

        const fuseOptions = {
            keys: ['title'],
            threshold: 0.35,
            includeScore: true,
            ignoreLocation: true
        };

        const taskFuse = new Fuse(searchableTasks, fuseOptions);
        const folderFuse = new Fuse(searchableFolders, fuseOptions);

        return {
            tasks: taskFuse.search(searchQuery).map(r => r.item),
            folders: folderFuse.search(searchQuery).map(r => r.item)
        };
    }, [items, searchQuery, isSearchMode, showCompleted, currentView, currentFolderId]);

    const scrollToBottom = (instant = false) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: instant ? 'auto' : 'smooth'
            });
        }
    };

    // Scroll to bottom when subtasks change
    React.useEffect(() => {
        if (isSubtaskMode) {
            const timer = setTimeout(() => scrollToBottom(), 100);
            return () => clearTimeout(timer);
        }
    }, [subtaskContext?.subtasks.length, isSubtaskMode]);

    // Handle viewport/keyboard changes
    React.useEffect(() => {
        const handleViewportChange = () => {
            if (isSubtaskMode || isSearchMode) {
                scrollToBottom(true);
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportChange);
            window.visualViewport.addEventListener('scroll', handleViewportChange);
        }

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleViewportChange);
                window.visualViewport.removeEventListener('scroll', handleViewportChange);
            }
        };
    }, [isSubtaskMode, isSearchMode]);

    if (!isSubtaskMode && !isSearchMode) return null;

    return (
        <div className="flex-1 flex flex-col w-full px-6 pb-4 overflow-x-hidden min-h-0 transition-all duration-300">
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 scroll-smooth"
            >
                <AnimatePresence mode="popLayout">
                    {isSubtaskMode && subtaskContext && (
                        <motion.div
                            key="subtask-context"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4 w-full"
                        >
                            <div className="sticky top-0 z-30 bg-[#0a090f]/95 backdrop-blur-xl py-4 -mx-6 px-6 border-b border-white/10 mb-4 shadow-2xl flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0 scale-95 origin-left">
                                    <TaskCard item={subtaskContext.parent} hideSubtasks />
                                </div>
                                <button 
                                    onClick={onClose}
                                    className="shrink-0 p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 active:scale-90 transition-all shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                                >
                                    <Check size={24} strokeWidth={3} />
                                </button>
                            </div>
                            
                            {subtaskContext.subtasks.length > 0 && (
                                <div className="space-y-2 opacity-80 pb-4">
                                    {subtaskContext.subtasks.map((subtask, index) => (
                                        <TaskCard key={`focused-sub-${subtask.id || index}`} item={subtask} isSubtask />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {isSearchMode && (
                        <motion.div
                            key="search-context"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {searchResults.tasks.length > 0 && (
                                <section className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 px-1">Tasks</h3>
                                    <div className="space-y-2">
                                        {searchResults.tasks.map((task, index) => (
                                            <TaskCard key={`focused-task-${task.id || index}`} item={task} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {searchResults.folders.length > 0 && (
                                <section className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 px-1">Folders</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {searchResults.folders.map((folder, index) => (
                                            <FolderCard key={`focused-folder-${folder.id || index}`} item={folder} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {searchQuery.trim() && searchResults.tasks.length === 0 && searchResults.folders.length === 0 && (
                                <div className="text-center py-10 text-gray-500 text-sm italic">
                                    No matches found for "{searchQuery}"
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FocusedContextUI;
