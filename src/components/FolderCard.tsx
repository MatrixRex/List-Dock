import React, { useState } from 'react';
import type { Item } from '../types';
import { useStore } from '../store/useStore';
import * as LucideIcons from 'lucide-react';
import { useDnDContext } from '../store/DnDContext';
import { cn } from '../utils/utils';
import ConfirmDialog from './ui/ConfirmDialog';
import FolderSettingsPopup from './FolderSettingsPopup';
import { motion, AnimatePresence } from 'framer-motion';

interface FolderCardProps {
    item: Item;
}

const FolderCard: React.FC<FolderCardProps> = ({ item }) => {
    const setView = useStore((state: any) => state.setView);
    const { items, deleteItem, isMenuOpen, showCompleted } = useStore();
    const { dragState, updateDragState, clearDragState, calculateZone } = useDnDContext();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isIconHovered, setIsIconHovered] = useState(false);

    const folderItems = items
        .filter((i: Item) => i.parent_id === item.id)
        .filter((i: Item) => showCompleted || !i.is_completed);
    const taskCount = folderItems.length;

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', item.id);
        updateDragState(item.id, null, null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (isMenuOpen || dragState.draggedItemId === item.id) return;

        const draggedItem = items.find((i: Item) => i.id === dragState.draggedItemId);
        const isFolderDrag = draggedItem?.type === 'folder';
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

        const zone = calculateZone(e, rect, true, false, isFolderDrag);
        updateDragState(dragState.draggedItemId, item.id, zone);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const draggedId = dragState.draggedItemId;
        if (!draggedId || draggedId === item.id) return;

        const draggedItem = items.find((i: Item) => i.id === draggedId);
        if (!draggedItem) return;

        const selectedTaskIds = useStore.getState().selectedTaskIds;
        const isDraggingSelection = selectedTaskIds.includes(draggedId);
        const idsToMove = isDraggingSelection ? selectedTaskIds : [draggedId];

        if (draggedItem.type === 'folder') {
            // Folder reordering
            const dropFolder = item;
            const siblings = items
                .filter((i: Item) => i.type === 'folder' && !idsToMove.includes(i.id))
                .sort((a: Item, b: Item) => a.order_index - b.order_index);

            const targetIndex = siblings.findIndex((s: Item) => s.id === dropFolder.id);
            let newOrder;

            if (dragState.dropZone === 'left') {
                const prev = siblings[targetIndex - 1];
                newOrder = prev ? (prev.order_index + dropFolder.order_index) / 2 : dropFolder.order_index - 1000;
            } else {
                const next = siblings[targetIndex + 1];
                newOrder = next ? (dropFolder.order_index + next.order_index) / 2 : dropFolder.order_index + 1000;
            }

            useStore.getState().moveMultipleItems(idsToMove, null, 'folder', newOrder);
        } else {
            // Move tasks into folder
            useStore.getState().moveMultipleItems(idsToMove, item.id, 'task');
        }
        clearDragState();
    };

    const isLetterIcon = !item.icon || item.icon === 'Letter';
    const IconComponent = (LucideIcons as any)[item.icon || 'Folder'] || LucideIcons.Folder;
    const folderColor = item.color || '#a855f7';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{
                opacity: 0,
                scale: 0.9,
                x: -30,
                filter: "blur(8px)",
                transition: { duration: 0.3 }
            }}
            whileHover={{
                backgroundColor: `${folderColor}15`,
                borderColor: folderColor,
                boxShadow: `0 0 20px ${folderColor}20`
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            draggable={!isMenuOpen}
            onDragStart={handleDragStart as any}
            onClick={() => {
                if (isMenuOpen) return;
                useStore.getState().setSearchQuery('');
                setView('folder', item.id);
            }}
            onDragOver={handleDragOver as any}
            onDragLeave={() => updateDragState(dragState.draggedItemId, null, null)}
            onDrop={handleDrop as any}
            className={cn(
                "glass rounded-xl p-2.5 cursor-pointer group relative",
                dragState.targetItemId === item.id && dragState.dropZone === 'folder' && "border-purple-500 bg-purple-500/10 shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]",
                isMenuOpen && "pointer-events-none"
            )}
        >
            {/* Drop Indicators */}
            {dragState.targetItemId === item.id && dragState.dropZone === 'left' && (
                <div className="absolute -left-[1.5px] top-0 bottom-0 w-0.5 bg-purple-500 z-50 rounded-full" />
            )}
            {dragState.targetItemId === item.id && dragState.dropZone === 'right' && (
                <div className="absolute -right-[1.5px] top-0 bottom-0 w-0.5 bg-purple-500 z-50 rounded-full" />
            )}

            <div className="flex flex-col gap-1 relative z-10">
                <div className="flex items-center gap-2">
                    <div
                        className="shrink-0 transition-all duration-200 relative w-5 h-5 flex items-center justify-center p-0.5"
                        onMouseEnter={() => setIsIconHovered(true)}
                        onMouseLeave={() => setIsIconHovered(false)}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowSettings(true);
                        }}
                        style={{ color: folderColor }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isIconHovered ? 'pen' : 'icon'}
                                initial={{ opacity: 0, rotate: -20, scale: 0.8 }}
                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                exit={{ opacity: 0, rotate: 20, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                                className="flex items-center justify-center font-bold"
                            >
                                {isIconHovered ? (
                                    <LucideIcons.Edit2 size={16} />
                                ) : isLetterIcon ? (
                                    <span className="text-[15px] leading-none uppercase">{item.title.charAt(0) || '?'}</span>
                                ) : (
                                    <IconComponent size={16} />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <h3 className={cn(
                        "text-sm font-medium text-gray-100 flex-1 transition-all duration-200",
                        "truncate group-hover:whitespace-normal group-hover:break-words"
                    )}>
                        {item.title}
                    </h3>
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
                        <LucideIcons.Trash2 size={14} />
                    </button>
                </div>
            </div>

            <FolderSettingsPopup
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                folder={item}
            />

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
                <div className="absolute inset-0 bg-purple-500/5 pointer-events-none" />
            )}
        </motion.div>
    );
};

export default FolderCard;
