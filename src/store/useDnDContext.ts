import React, { createContext, useContext } from 'react';
import { useDnD, type DropZone } from '../hooks/useDnD';

export interface DnDContextType {
    dragState: {
        draggedItemId: string | null;
        targetItemId: string | null;
        dropZone: DropZone;
    };
    updateDragState: (draggedId: string | null, targetId: string | null, zone: DropZone) => void;
    clearDragState: () => void;
    calculateZone: (e: React.MouseEvent | MouseEvent, targetRect: DOMRect, isFolder: boolean, canAcceptSubtask: boolean, isFolderDrag?: boolean) => DropZone;
}

export const DnDContext = createContext<DnDContextType | undefined>(undefined);

export const useDnDContext = () => {
    const context = useContext(DnDContext);
    if (!context) {
        throw new Error('useDnDContext must be used within a DnDProvider');
    }
    return context;
};

export { useDnD };
export type { DropZone };
