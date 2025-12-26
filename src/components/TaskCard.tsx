import React, { useRef, useState, useEffect } from 'react';
import type { Item } from '../types';
import { useStore } from '../store/useStore';
import { GripVertical, CheckCircle2, Circle, ChevronDown, ChevronRight, MoreVertical, Trash2, FolderInput, Edit2 } from 'lucide-react';
import { cn } from '../utils/utils';
import { useDnDContext } from '../store/DnDContext';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface TaskCardProps {
    item: Item;
    isSubtask?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ item, isSubtask = false }) => {
    const { updateItem, items, deleteItem } = useStore();
    const { dragState, updateDragState, clearDragState, calculateZone } = useDnDContext();
    const cardRef = useRef<HTMLDivElement>(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(item.title);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const { isMenuOpen, setIsMenuOpen } = useStore();
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

    const subtasks = items
        .filter(i => i.parent_id === item.id && i.type === 'subtask')
        .sort((a, b) => a.order_index - b.order_index);

    const completedSubtasks = subtasks.filter(s => s.is_completed).length;
    const hasSubtasks = subtasks.length > 0;

    const folders = items.filter(i => i.type === 'folder');

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showMenu &&
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                menuButtonRef.current &&
                !menuButtonRef.current.contains(event.target as Node)
            ) {
                setShowMenu(false);
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu, setIsMenuOpen]);

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', item.id);
        // Add small delay to allow ghost image to be created before state update hides it?
        // Actually Vite HMR/React might be fast enough.
        updateDragState(item.id, null, null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!cardRef.current || dragState.draggedItemId === item.id) return;

        const rect = cardRef.current.getBoundingClientRect();

        // Check if dragged item is a parent (has subtasks)
        const draggedHasSubtasks = items.some(i => i.parent_id === dragState.draggedItemId);
        const canAcceptSubtask = !draggedHasSubtasks && !isSubtask && item.type !== 'subtask';

        const zone = calculateZone(e, rect, false, canAcceptSubtask);
        updateDragState(dragState.draggedItemId, item.id, zone);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const draggedId = dragState.draggedItemId;
        const targetId = item.id;
        const zone = dragState.dropZone;

        if (!draggedId || draggedId === targetId) {
            clearDragState();
            return;
        }

        const draggedItem = items.find(i => i.id === draggedId);
        if (!draggedItem) return;

        if (zone === 'right') {
            updateItem(draggedId, {
                type: 'subtask',
                parent_id: targetId,
                order_index: subtasks.length
            });
            updateItem(targetId, { is_expanded: true });
        } else if (zone === 'top' || zone === 'bottom') {
            const newParentId = item.parent_id;
            const newType = item.type;

            updateItem(draggedId, {
                parent_id: newParentId,
                type: newType,
                order_index: zone === 'top' ? item.order_index - 0.5 : item.order_index + 0.5
            });
        }

        clearDragState();
    };

    const handleRename = () => {
        if (renameValue.trim()) {
            updateItem(item.id, { title: renameValue });
        } else {
            setRenameValue(item.title);
        }
        setIsRenaming(false);
    };

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!showMenu && menuButtonRef.current) {
            const rect = menuButtonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right
            });
            setIsMenuOpen(true);
        } else {
            setIsMenuOpen(false);
        }
        setShowMenu(!showMenu);
    };

    const handleMoveToFolder = (folderId: string | null) => {
        updateItem(item.id, {
            parent_id: folderId,
            type: 'task',
            order_index: Date.now()
        });
        setShowMenu(false);
        setIsMenuOpen(false);
    };

    return (
        <div className="group/task space-y-1 relative">
            <div
                ref={cardRef}
                draggable={!isMenuOpen}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={() => updateDragState(dragState.draggedItemId, null, null)}
                onDrop={handleDrop}
                onDoubleClick={() => !isMenuOpen && setIsRenaming(true)}
                className={cn(
                    "group relative bg-gray-800 border border-gray-700/50 rounded-lg p-3 transition-all cursor-pointer",
                    "hover:border-gray-600 active:scale-[0.98]",
                    dragState.targetItemId === item.id && dragState.dropZone === 'right' && "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]",
                    item.is_completed && "opacity-60",
                    isSubtask && "ml-6 py-2 bg-gray-800/50",
                    isMenuOpen && "pointer-events-none"
                )}
            >
                {/* Drop Indicators */}
                {dragState.targetItemId === item.id && dragState.dropZone === 'top' && (
                    <div className="absolute -top-[1.5px] left-0 right-0 h-0.5 bg-blue-500 z-50 rounded-full" />
                )}
                {dragState.targetItemId === item.id && dragState.dropZone === 'bottom' && (
                    <div className="absolute -bottom-[1.5px] left-0 right-0 h-0.5 bg-blue-500 z-50 rounded-full" />
                )}

                <div className="flex items-center gap-3">
                    <div className="text-gray-600 cursor-grab active:cursor-grabbing hover:text-gray-400 transition-colors">
                        <GripVertical size={16} />
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isMenuOpen) return;
                            updateItem(item.id, { is_completed: !item.is_completed });
                        }}
                        className={cn(
                            "transition-all transform hover:scale-110",
                            item.is_completed ? "text-green-500" : "text-gray-600 hover:text-gray-500"
                        )}
                    >
                        {item.is_completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>

                    <div className="flex-1 min-w-0">
                        {isRenaming ? (
                            <input
                                autoFocus
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={handleRename}
                                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                className="w-full bg-gray-700 border-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 text-sm outline-none"
                            />
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "text-sm font-medium truncate text-gray-200",
                                    item.is_completed && "text-gray-500 line-through"
                                )}>
                                    {item.title}
                                </span>
                                {hasSubtasks && (
                                    <span className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded-full font-bold">
                                        {completedSubtasks}/{subtasks.length}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isSubtask && hasSubtasks && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateItem(item.id, { is_expanded: !item.is_expanded });
                                }}
                                className="p-1 text-gray-500 hover:text-white transition-colors"
                            >
                                {item.is_expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                        )}

                        <button
                            ref={menuButtonRef}
                            onClick={toggleMenu}
                            className="p-1 text-gray-500 hover:text-white transition-colors pointer-events-auto"
                        >
                            <MoreVertical size={16} />
                        </button>
                    </div>
                </div>

                {/* Progress Bar for Parent Tasks */}
                {!isSubtask && hasSubtasks && (
                    <div className="mt-2.5 h-1 bg-gray-700/50 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-500 ease-out",
                                completedSubtasks === subtasks.length ? "bg-green-500" : "bg-blue-500"
                            )}
                            style={{ width: `${(completedSubtasks / subtasks.length) * 100}%` }}
                        />
                    </div>
                )}

                {/* Floating Context Menu - Portaled to escape stacking context */}
                {createPortal(
                    <AnimatePresence>
                        {showMenu && (
                            <>
                                {/* Full-screen backdrop with blur */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(false);
                                        setIsMenuOpen(false);
                                    }}
                                    className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] z-[9998]"
                                />

                                <motion.div
                                    ref={menuRef}
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    draggable={false}
                                    onDragStart={(e) => e.stopPropagation()}
                                    className="fixed w-48 bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-2xl z-[9999] py-1.5 overflow-hidden"
                                    style={{
                                        top: menuPosition.top,
                                        right: menuPosition.right
                                    }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => { setIsRenaming(true); setShowMenu(false); setIsMenuOpen(false); }}
                                        className="w-full text-left px-3.5 py-2.5 text-xs text-gray-300 hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                                    >
                                        <Edit2 size={14} /> Rename
                                    </button>
                                    <div className="h-px bg-gray-800/50 mx-2 my-1" />
                                    <div className="px-3.5 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Move To</div>
                                    <button
                                        onClick={() => handleMoveToFolder(null)}
                                        className="w-full text-left px-3.5 py-2.5 text-xs text-gray-300 hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                                    >
                                        <FolderInput size={14} /> Default List
                                    </button>
                                    {folders.map(folder => (
                                        folder.id !== item.parent_id && (
                                            <button
                                                key={folder.id}
                                                onClick={() => handleMoveToFolder(folder.id)}
                                                className="w-full text-left px-3.5 py-2.5 text-xs text-gray-300 hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                                            >
                                                <FolderInput size={14} /> {folder.title}
                                            </button>
                                        )
                                    ))}
                                    <div className="h-px bg-gray-800/50 mx-2 my-1" />
                                    <button
                                        onClick={() => { deleteItem(item.id); setShowMenu(false); setIsMenuOpen(false); }}
                                        className="w-full text-left px-3.5 py-2.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors font-medium"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
            </div>

            {/* Subtasks Accordion */}
            <AnimatePresence initial={false}>
                {!isSubtask && item.is_expanded && hasSubtasks && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden space-y-1"
                    >
                        {subtasks.map(subtask => (
                            <TaskCard key={subtask.id} item={subtask} isSubtask />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TaskCard;
