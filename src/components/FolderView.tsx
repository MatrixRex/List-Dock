import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import TaskCard from './TaskCard';
import { Trash2, Edit2, Check } from 'lucide-react';

const FolderView: React.FC = () => {
    const { items, currentFolderId, searchQuery, updateItem, deleteItem, setView } = useStore();
    const folder = items.find(i => i.id === currentFolderId);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState(folder?.title || '');

    const tasks = items
        .filter(i => i.parent_id === currentFolderId && i.type === 'task')
        .filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => a.order_index - b.order_index);

    const handleUpdateTitle = () => {
        if (titleValue.trim() && folder) {
            updateItem(folder.id, { title: titleValue });
        }
        setIsEditingTitle(false);
    };

    const handleDeleteFolder = () => {
        if (folder && confirm('Delete this folder and all tasks inside?')) {
            deleteItem(folder.id);
            setView('root');
        }
    };

    if (!folder) return <div className="text-center py-8 text-gray-500">Folder not found.</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                {isEditingTitle ? (
                    <div className="flex items-center gap-2 flex-1">
                        <input
                            autoFocus
                            value={titleValue}
                            onChange={(e) => setTitleValue(e.target.value)}
                            onBlur={handleUpdateTitle}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
                            className="flex-1 bg-gray-800 border-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 text-lg font-bold outline-none"
                        />
                        <button onClick={handleUpdateTitle} className="text-green-500 p-1 hover:bg-gray-800 rounded">
                            <Check size={20} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 group flex-1">
                        <h2 className="text-xl font-bold truncate">{folder.title}</h2>
                        <button
                            onClick={() => { setTitleValue(folder.title); setIsEditingTitle(true); }}
                            className="p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Edit2 size={16} />
                        </button>
                    </div>
                )}
                <button
                    onClick={handleDeleteFolder}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all ml-2"
                    title="Delete Folder"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            <div className="space-y-2">
                {tasks.length > 0 ? (
                    tasks.map(task => <TaskCard key={task.id} item={task} />)
                ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-xl">
                        <p className="text-gray-500 text-sm">No tasks in this folder.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FolderView;
