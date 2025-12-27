import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import TaskCard from './TaskCard';
import { AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';

const FolderView: React.FC = () => {
    const { items, currentFolderId, searchQuery, showCompleted } = useStore();
    const folder = items.find(i => i.id === currentFolderId);

    const isSearching = searchQuery.trim().length > 0;

    const tasks = useMemo(() => {
        const folderTasks = items
            .filter(i => i.parent_id === currentFolderId && i.type === 'task')
            .filter(i => showCompleted || !i.is_completed);

        if (!isSearching) {
            return folderTasks.sort((a, b) => a.order_index - b.order_index);
        }

        const fuse = new Fuse(folderTasks, {
            keys: ['title'],
            threshold: 0.35,
            ignoreLocation: true
        });

        return fuse.search(searchQuery).map(r => r.item);
    }, [items, currentFolderId, searchQuery, showCompleted, isSearching]);

    if (!folder) return <div className="text-center py-8 text-gray-500">Folder not found.</div>;


    return (
        <div className="space-y-4">
            {isSearching && (
                <div className="flex items-center gap-3 mb-2 px-1">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap">Search results ({folder.title})</span>
                    <div className="h-px flex-1 bg-white/10" />
                </div>
            )}

            <div className="space-y-2">
                <AnimatePresence initial={false} mode="popLayout">
                    {tasks.length > 0 ? (
                        tasks.map(task => <TaskCard key={task.id} item={task} />)
                    ) : (
                        <div key="no-tasks" className="text-center py-12 border border-white/5 bg-white/[0.01] rounded-xl">
                            <p className="text-gray-500 text-sm italic">{isSearching ? `No matches in "${folder.title}"` : "No tasks in this folder."}</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FolderView;
