import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/utils';

interface ContextMenuProps {
    isOpen: boolean;
    onClose: () => void;
    anchorRect: DOMRect | null;
    children: React.ReactNode;
    className?: string;
    width?: number;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
    isOpen,
    onClose,
    anchorRect,
    children,
    className,
    width = 192 // default 48 * 4
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside (since we use a portal)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                // Check if the click was on the trigger button (if possible)
                // Actually the backdrop handles this better in React Portals if we use one.
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!anchorRect) return null;

    // Calculate position
    const top = anchorRect.bottom + 8;
    const right = window.innerWidth - anchorRect.right;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="fixed inset-0 z-[9998] bg-gray-950/20 backdrop-blur-[1px]"
                    />

                    {/* Menu Content */}
                    <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className={cn(
                            "fixed bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-2xl z-[9999] py-1.5 overflow-hidden",
                            className
                        )}
                        style={{
                            top,
                            right,
                            width
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ContextMenu;
