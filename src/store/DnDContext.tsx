import React, { createContext, useContext, type ReactNode } from 'react';
import { useDnD, type DropZone } from '../hooks/useDnD';

interface DnDContextType {
    dragState: {
        draggedItemId: string | null;
        targetItemId: string | null;
        dropZone: DropZone;
    };
    updateDragState: (draggedId: string | null, targetId: string | null, zone: DropZone) => void;
    clearDragState: () => void;
    calculateZone: (e: React.MouseEvent | MouseEvent, targetRect: DOMRect, isFolder: boolean, canAcceptSubtask: boolean) => DropZone;
}

const DnDContext = createContext<DnDContextType | undefined>(undefined);

export const DnDProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const dnd = useDnD();
    return <DnDContext.Provider value={dnd}>{children}</DnDContext.Provider>;
};

export const useDnDContext = () => {
    const context = useContext(DnDContext);
    if (!context) {
        throw new Error('useDnDContext must be used within a DnDProvider');
    }
    return context;
};
