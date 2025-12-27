import React from 'react';
import { useStore } from '../store/useStore';
import TaskCard from './TaskCard';
import { AnimatePresence } from 'framer-motion';

const FolderView: React.FC = () => {
    const { items, currentFolderId, searchQuery, showCompleted } = useStore();
    const folder = items.find(i => i.id === currentFolderId);

    const tasks = items
        .filter(i => i.parent_id === currentFolderId && i.type === 'task')
        .filter(i => showCompleted || !i.is_completed)
        .filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => a.order_index - b.order_index);

    if (!folder) return <div className="text-center py-8 text-gray-500">Folder not found.</div>;

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <AnimatePresence initial={false} mode="popLayout">
                    {tasks.length > 0 ? (
                        tasks.map(task => <TaskCard key={task.id} item={task} />)
                    ) : (
                        <div key="no-tasks" className="text-center py-12 border-2 border-dashed border-gray-800 rounded-xl">
                            <p className="text-gray-500 text-sm">No tasks in this folder.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FolderView;
