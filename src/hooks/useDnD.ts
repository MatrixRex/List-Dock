import { useState, useCallback } from 'react';

export type DropZone = 'top' | 'bottom' | 'left' | 'right' | 'folder' | null;

interface DragState {
    draggedItemId: string | null;
    targetItemId: string | null;
    dropZone: DropZone;
}

export function useDnD() {
    const [dragState, setDragState] = useState<DragState>({
        draggedItemId: null,
        targetItemId: null,
        dropZone: null,
    });

    const clearDragState = useCallback(() => {
        setDragState({
            draggedItemId: null,
            targetItemId: null,
            dropZone: null,
        });
    }, []);

    const updateDragState = useCallback((draggedId: string | null, targetId: string | null, zone: DropZone) => {
        setDragState({
            draggedItemId: draggedId,
            targetItemId: targetId,
            dropZone: zone,
        });
    }, []);

    const calculateZone = useCallback((
        e: React.MouseEvent | MouseEvent,
        targetRect: DOMRect,
        isFolderTarget: boolean,
        canAcceptSubtask: boolean,
        isFolderDrag: boolean = false
    ): DropZone => {
        const { clientX, clientY } = e;
        const relativeX = clientX - targetRect.left;
        const relativeY = clientY - targetRect.top;

        const widthPercentage = relativeX / targetRect.width;
        const heightPercentage = relativeY / targetRect.height;

        if (isFolderTarget) {
            // If dragging a folder, we want to reorder (left/right)
            if (isFolderDrag) {
                return widthPercentage < 0.5 ? 'left' : 'right';
            }
            // If dragging a task, we want to move into folder
            return 'folder';
        }

        // Right 60% is the subtask zone
        if (widthPercentage > 0.4 && canAcceptSubtask) {
            return 'right';
        }

        // Left 75% is split into top 50% / bottom 50%
        if (heightPercentage < 0.5) {
            return 'top';
        } else {
            return 'bottom';
        }
    }, []);

    return {
        dragState,
        updateDragState,
        clearDragState,
        calculateZone,
    };
}
