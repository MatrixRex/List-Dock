import React, { type ReactNode } from 'react';
import { useDnD, DnDContext } from './useDnDContext';

export const DnDProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const dnd = useDnD();
    return <DnDContext.Provider value={dnd}>{children}</DnDContext.Provider>;
};
