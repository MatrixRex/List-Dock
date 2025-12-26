import React, { useState } from 'react';
import type { Item } from '../types';
import { useStore } from '../store/useStore';
import { Folder as FolderIcon, Trash2 } from 'lucide-react';
import { useDnDContext } from '../store/DnDContext';
import { cn } from '../utils/utils';
import ConfirmDialog from './ui/ConfirmDialog';

interface FolderCardProps {
    item: Item;
}

const FolderCard: React.FC<FolderCardProps> = ({ item }) => {
    const setView = useStore(state => state.setView);
    const { items, deleteItem, moveItem, isMenuOpen, showCompleted } = useStore();
    const { dragState, updateDragState, clearDragState } = useDnDContext();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const folderItems = items
        .filter(i => i.parent_id === item.id)
        .filter(i => showCompleted || !i.is_completed);
    const taskCount = folderItems.length;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (isMenuOpen || dragState.draggedItemId === item.id) return;
        updateDragState(dragState.draggedItemId, item.id, 'folder');
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const draggedId = dragState.draggedItemId;
        if (draggedId && draggedId !== item.id) {
            // Move task into folder
            moveItem(draggedId, item.id, 'task');
        }
        clearDragState();
    };

    return (
        <div
            onClick={() => !isMenuOpen && setView('folder', item.id)}
            onDragOver={handleDragOver}
            onDragLeave={() => updateDragState(dragState.draggedItemId, null, null)}
            onDrop={handleDrop}
            className={cn(
                "bg-gray-800/80 border border-gray-700/50 rounded-lg p-2.5 hover:border-blue-500/50 transition-all cursor-pointer group relative overflow-hidden",
                dragState.targetItemId === item.id && "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]",
                isMenuOpen && "pointer-events-none"
            )}
        >
            <div className="flex flex-col gap-1 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="text-blue-400/80 shrink-0">
                        <FolderIcon size={16} />
                    </div>
                    <h3 className="text-sm font-medium truncate text-gray-100 flex-1">{item.title}</h3>
                </div>
                <div className="flex items-center justify-between h-5">
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">{taskCount} Items</p>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(true);
                        }}
                        className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => deleteItem(item.id)}
                title="Delete Folder?"
                message={`Are you sure you want to delete "${item.title}"? This will also remove all ${taskCount} tasks inside.`}
                confirmText="Delete Folder"
                variant="danger"
            />

            {/* Drop Indicator Overlay */}
            {dragState.targetItemId === item.id && (
                <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
            )}
        </div>
    );
};

export default FolderCard;
