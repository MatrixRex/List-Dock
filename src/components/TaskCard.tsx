import React, { useRef, useState, useMemo } from 'react';
import type { Item } from '../types';
import { useStore } from '../store/useStore';
import { GripVertical, CheckCircle2, Circle, ChevronDown, ChevronRight, MoreVertical, Trash2, FolderInput, Edit2 } from 'lucide-react';
import { cn } from '../utils/utils';
import { useDnDContext } from '../store/DnDContext';
import { motion, AnimatePresence } from 'framer-motion';
import ContextMenu from './ui/ContextMenu';

interface TaskCardProps {
    item: Item;
    isSubtask?: boolean;
    isLast?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ item, isSubtask = false, isLast = false }) => {
    const { updateItem, items, deleteItem, moveItem, showCompleted, hideCompletedSubtasks, selectedTaskId, setSelectedTaskId, pushToUndoStack } = useStore();
    const { dragState, updateDragState, clearDragState, calculateZone } = useDnDContext();
    const cardRef = useRef<HTMLDivElement>(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(item.title);
    const [showMenu, setShowMenu] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const { isMenuOpen, setIsMenuOpen } = useStore();
    const [isVisualCompleted, setIsVisualCompleted] = useState(item.is_completed);

    // Sync visual state with store state (important for Undo)
    React.useEffect(() => {
        setIsVisualCompleted(item.is_completed);
    }, [item.is_completed]);

    const isSelected = selectedTaskId === item.id;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isMenuOpen) return;

        const nextCompleted = !item.is_completed;
        setIsVisualCompleted(nextCompleted);

        const toggleAction = () => {
            pushToUndoStack(nextCompleted ? `Completed "${item.title}"` : `Marked "${item.title}" as active`);
            updateItem(item.id, { is_completed: nextCompleted });
        };

        // If we are completing a task and "show completed" is off, 
        // delay the store update so the animation can play before it's filtered out
        if (nextCompleted && !showCompleted) {
            setTimeout(toggleAction, 800);
        } else {
            toggleAction();
        }
    };

    const subtasks = items
        .filter(i => i.parent_id === item.id && i.type === 'subtask')
        .filter(i => {
            if (!i.is_completed) return true;
            if (showCompleted) return true;
            return !hideCompletedSubtasks;
        })
        .sort((a, b) => {
            if (a.is_completed !== b.is_completed) {
                return a.is_completed ? 1 : -1;
            }
            return a.order_index - b.order_index;
        });

    const completedSubtasks = subtasks.filter(s => s.is_completed).length;
    const hasSubtasks = subtasks.length > 0;

    // Determine the color for the selection border and glow
    const activeColor = useMemo(() => {
        if (item.parent_id) {
            const parent = items.find(i => i.id === item.parent_id);
            if (parent) {
                if (parent.type === 'folder' && parent.color) return parent.color;
                if (parent.type === 'task') {
                    const grandParent = items.find(i => i.id === parent.parent_id);
                    if (grandParent?.type === 'folder' && grandParent.color) return grandParent.color;
                }
            }
        }
        return "#a855f7"; // Default purple-500
    }, [item.parent_id, items]);

    const folders = useMemo(() => items.filter(i => i.type === 'folder'), [items]);

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
        if (dragState.draggedItemId === item.id) return;

        const { draggedItemId, targetItemId, dropZone } = dragState;
        if (!draggedItemId || !targetItemId) return;

        const draggedItem = items.find(i => i.id === draggedItemId);
        if (!draggedItem) return;

        if (dropZone === 'right') {
            moveItem(draggedItemId, item.id, 'subtask');
        } else {
            const isTargetSubtask = item.type === 'subtask';
            const newType = isTargetSubtask ? 'subtask' : 'task';
            const newParentId = item.parent_id;

            // Get siblings to calculate order
            const siblings = items
                .filter(i => i.parent_id === newParentId && i.type === newType)
                .sort((a, b) => a.order_index - b.order_index);

            const targetIndex = siblings.findIndex(s => s.id === item.id);
            let newOrder;

            if (dropZone === 'top') {
                const prev = siblings[targetIndex - 1];
                newOrder = prev ? (prev.order_index + item.order_index) / 2 : item.order_index - 1000;
            } else {
                const next = siblings[targetIndex + 1];
                newOrder = next ? (item.order_index + next.order_index) / 2 : item.order_index + 1000;
            }

            moveItem(draggedItemId, newParentId, newType, newOrder);
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
            setIsMenuOpen(true);
        } else {
            setIsMenuOpen(false);
        }
        setShowMenu(!showMenu);
    };

    const handleMoveToFolder = (folderId: string | null) => {
        moveItem(item.id, folderId, 'task');
        setShowMenu(false);
        setIsMenuOpen(false);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isMenuOpen || isVisualCompleted) return;

        const currentSearch = useStore.getState().searchQuery;

        if (currentSearch.trim()) {
            // Exit search and go to item's location
            let targetFolderId: string | null = null;

            if (item.type === 'subtask') {
                const parentTask = items.find(i => i.id === item.parent_id);
                if (parentTask) {
                    targetFolderId = parentTask.parent_id || null;
                    // Expand parent task so the subtask is visible
                    updateItem(parentTask.id, { is_expanded: true });
                }
            } else {
                targetFolderId = item.parent_id || null;
            }

            useStore.getState().setSearchQuery('');
            useStore.getState().setView(targetFolderId ? 'folder' : 'root', targetFolderId);
        }

        setSelectedTaskId(item.id);
    };

    return (
        <motion.div
            layout
            className="group/task space-y-1 relative"
        >
            <motion.div
                ref={cardRef}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                    opacity: 1,
                    y: 0,
                    borderColor: (isSelected || (dragState.targetItemId === item.id && dragState.dropZone === 'right')) ? activeColor : "rgba(255, 255, 255, 0.05)",
                    borderWidth: (isSelected || (dragState.targetItemId === item.id && dragState.dropZone === 'right')) ? "1.5px" : "1px",
                    backgroundColor: (isSelected || (dragState.targetItemId === item.id && dragState.dropZone === 'right')) ? `${activeColor}15` : "rgba(255, 255, 255, 0)",
                    boxShadow: (isSelected || (dragState.targetItemId === item.id && dragState.dropZone === 'right')) ? `0 0 20px ${activeColor}20` : "none"
                }}
                exit={{
                    opacity: 0,
                    scale: 0.95,
                    transition: { duration: 0.2 }
                }}
                whileHover={{
                    backgroundColor: isSelected ? `${activeColor}25` : "rgba(255, 255, 255, 0.12)",
                    borderColor: activeColor,
                    boxShadow: `0 0 15px ${activeColor}15`
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                draggable={!isMenuOpen}
                onDragStart={handleDragStart as any}
                onDragOver={handleDragOver as any}
                onDragLeave={() => updateDragState(dragState.draggedItemId, null, null)}
                onDrop={handleDrop as any}
                onDoubleClick={() => !isMenuOpen && setIsRenaming(true)}
                onClick={handleClick}
                className={cn(
                    "group relative glass p-3 cursor-pointer select-none rounded-xl",
                    isSubtask ? "ml-4" : "",
                    (isSelected || (dragState.targetItemId === item.id && dragState.dropZone === 'right')) && "z-10",
                    item.is_completed && "opacity-60 grayscale-[0.5]",
                    isMenuOpen && "pointer-events-none"
                )}
            >
                {/* Drop Indicators */}
                {dragState.targetItemId === item.id && dragState.dropZone === 'top' && (
                    <div className="absolute -top-[1.5px] left-0 right-0 h-0.5 bg-purple-500 z-50 rounded-full" />
                )}
                {dragState.targetItemId === item.id && dragState.dropZone === 'bottom' && (
                    <div className="absolute -bottom-[1.5px] left-0 right-0 h-0.5 bg-purple-500 z-50 rounded-full" />
                )}

                {/* Tooltip for Subtask Drop */}
                <AnimatePresence>
                    {dragState.targetItemId === item.id && dragState.dropZone === 'right' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: 20 }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-[100] flex items-center gap-2 pointer-events-none"
                        >
                            <div className="px-2 py-1 bg-purple-600 rounded text-[10px] font-bold text-white uppercase tracking-widest shadow-lg border border-white/20">
                                Convert to Subtask
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-3">
                    <div
                        className="cursor-grab active:cursor-grabbing transition-colors opacity-40 hover:opacity-100"
                        style={{ color: activeColor }}
                    >
                        <GripVertical size={16} />
                    </div>

                    <motion.button
                        onClick={handleToggle}
                        whileTap={{ scale: 0.8 }}
                        animate={{
                            scale: isVisualCompleted ? [1, 1.2, 1] : 1,
                            rotate: isVisualCompleted ? [0, 10, 0] : 0
                        }}
                        transition={{ duration: 0.3 }}
                        className="transition-colors"
                        style={{ color: isVisualCompleted ? "#22c55e" : activeColor }}
                    >
                        {isVisualCompleted ? (
                            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                                <CheckCircle2 size={16} />
                            </motion.div>
                        ) : (
                            <Circle size={16} />
                        )}
                    </motion.button>

                    <div className="flex-1 min-w-0">
                        {isRenaming ? (
                            <input
                                autoFocus
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={handleRename}
                                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                className="w-full bg-gray-700 border-none focus:ring-1 focus:ring-purple-500 rounded px-1 py-0.5 text-sm outline-none"
                            />
                        ) : (
                            <div className="flex items-start gap-2">
                                <span className={cn(
                                    "text-sm font-medium text-gray-200 transition-all duration-200 flex-1 min-w-0 block",
                                    (!isSelected) ? "truncate group-hover/task:whitespace-normal group-hover/task:break-words" : "whitespace-normal break-words",
                                    isVisualCompleted && "text-gray-500 line-through"
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
                                completedSubtasks === subtasks.length ? "bg-green-500" : "bg-purple-500"
                            )}
                            style={{ width: `${(completedSubtasks / subtasks.length) * 100}%` }}
                        />
                    </div>
                )}

                {/* Reusable Context Menu */}
                <ContextMenu
                    isOpen={showMenu}
                    onClose={() => { setShowMenu(false); setIsMenuOpen(false); }}
                    anchorRect={menuButtonRef.current?.getBoundingClientRect() || null}
                >
                    <button
                        onClick={() => { setIsRenaming(true); setShowMenu(false); setIsMenuOpen(false); }}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-gray-300 hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                    >
                        <Edit2 size={14} /> Rename
                    </button>
                    <div className="h-px bg-gray-800/50 mx-2 my-1" />
                    <div className="px-3.5 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Move To</div>
                    {item.parent_id !== null && (
                        <button
                            onClick={() => handleMoveToFolder(null)}
                            className="w-full text-left px-3.5 py-2.5 text-xs text-gray-300 hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                        >
                            <FolderInput size={14} /> Default List
                        </button>
                    )}
                    {folders
                        .filter(f => f.id !== item.parent_id)
                        .map(folder => (
                            <button
                                key={folder.id}
                                onClick={() => handleMoveToFolder(folder.id)}
                                className="w-full text-left px-3.5 py-2.5 text-xs text-gray-300 hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                            >
                                <FolderInput size={14} /> {folder.title}
                            </button>
                        ))
                    }
                    <div className="h-px bg-gray-800/50 mx-2 my-1" />
                    <button
                        onClick={() => { deleteItem(item.id); setShowMenu(false); setIsMenuOpen(false); }}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors font-medium"
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                </ContextMenu>
            </motion.div>

            {/* Subtasks Accordion */}
            <AnimatePresence initial={false}>
                {!isSubtask && item.is_expanded && hasSubtasks && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden space-y-[2px] mt-[1px]"
                    >
                        {subtasks.map((subtask, index) => (
                            <TaskCard
                                key={subtask.id}
                                item={subtask}
                                isSubtask
                                isLast={(!isSubtask || isLast) && index === subtasks.length - 1}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default TaskCard;
