import React from 'react';
import { useStore } from '../store/useStore';
import TaskCard from './TaskCard';
import FolderCard from './FolderCard';

const RootView: React.FC = () => {
    const items = useStore((state) => state.items);
    const searchQuery = useStore((state) => state.searchQuery);

    const rootTasks = items
        .filter(i => i.type === 'task' && i.parent_id === null)
        .filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => a.order_index - b.order_index);

    const folders = items
        .filter(i => i.type === 'folder')
        .filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => a.order_index - b.order_index);

    return (
        <div className="space-y-6">
            {/* Top Section: Root Tasks */}
            <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">Tasks</h2>
                {rootTasks.length > 0 ? (
                    <div className="space-y-2">
                        {rootTasks.map(task => (
                            <TaskCard key={task.id} item={task} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">No pending tasks.</div>
                )}
            </section>

            {/* Bottom Section: Folder Grid */}
            <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">Folders</h2>
                {folders.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {folders.map(folder => (
                            <FolderCard key={folder.id} item={folder} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">No folders.</div>
                )}
            </section>
        </div>
    );
};

export default RootView;
