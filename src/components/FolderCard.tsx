import React from 'react';
import type { Item } from '../types';
import { useStore } from '../store/useStore';
import { Folder as FolderIcon, Trash2 } from 'lucide-react';
import { useDnDContext } from '../store/DnDContext';
import { cn } from '../utils/utils';

interface FolderCardProps {
    item: Item;
}

const FolderCard: React.FC<FolderCardProps> = ({ item }) => {
    const setView = useStore(state => state.setView);
    const { items, updateItem, deleteItem } = useStore();
    const { dragState, updateDragState, clearDragState } = useDnDContext();

    const folderItems = items.filter(i => i.parent_id === item.id);
    const taskCount = folderItems.length;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (dragState.draggedItemId === item.id) return;
        updateDragState(dragState.draggedItemId, item.id, 'folder');
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const draggedId = dragState.draggedItemId;
        if (draggedId && draggedId !== item.id) {
            // Move task into folder
            updateItem(draggedId, {
                parent_id: item.id,
                type: 'task', // Ensure it's a task if moved from subtask
                order_index: Date.now()
            });
        }
        clearDragState();
    };

    return (
        <div
            onClick={() => setView('folder', item.id)}
            onDragOver={handleDragOver}
            onDragLeave={() => updateDragState(dragState.draggedItemId, null, null)}
            onDrop={handleDrop}
            className={cn(
                "bg-gray-800 border border-gray-700/50 rounded-xl p-4 hover:border-blue-500/50 transition-all cursor-pointer group relative overflow-hidden",
                dragState.targetItemId === item.id && "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]"
            )}
        >
            <div className="flex flex-col gap-2 relative z-10">
                <div className="flex items-start justify-between">
                    <div className="p-2 bg-gray-700/50 rounded-lg w-fit group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                        <FolderIcon size={20} />
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete folder and all its contents?')) {
                                deleteItem(item.id);
                            }
                        }}
                        className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
                <div>
                    <h3 className="text-sm font-semibold truncate text-gray-100">{item.title}</h3>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">{taskCount} Items</p>
                </div>
            </div>

            {/* Drop Indicator Overlay */}
            {dragState.targetItemId === item.id && (
                <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
            )}
        </div>
    );
};

export default FolderCard;
