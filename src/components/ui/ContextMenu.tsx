import React, { useRef, useEffect, useLayoutEffect } from 'react';
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

    // Calculate position
    useLayoutEffect(() => {
        if (!isOpen || !anchorRect || !menuRef.current) return;

        // Estimate height if not yet rendered, or measure it
        const menuHeight = menuRef.current.offsetHeight || 200; // estimated default
        const spaceBelow = window.innerHeight - anchorRect.bottom;
        const spaceAbove = anchorRect.top;

        let top = anchorRect.bottom + 8;
        let isBottom = false;

        // If not enough space below AND more space above, or if just not enough space below
        if (spaceBelow < menuHeight + 20 && spaceAbove > spaceBelow) {
            top = anchorRect.top - menuHeight - 8;
            isBottom = true;
        }

        // Final safety check: ensure top is not negative
        if (top < 8) top = 8;

        // Final safety check: ensure it doesn't overflow bottom if forced there
        if (!isBottom && top + menuHeight > window.innerHeight - 8) {
            top = window.innerHeight - menuHeight - 8;
        }

        const right = window.innerWidth - anchorRect.right;
        
        menuRef.current.style.top = `${top}px`;
        menuRef.current.style.right = `${right}px`;
        menuRef.current.style.setProperty('--menu-y-offset', isBottom ? '10px' : '-10px');
    }, [isOpen, anchorRect]);

    // Close on click outside (since we use a portal)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                // Handled by backdrop
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    if (!anchorRect) return null;

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
                        initial={{ opacity: 0, scale: 0.95, y: 'var(--menu-y-offset, -10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 'var(--menu-y-offset, -10px)' }}
                        className={cn(
                            "fixed bg-[#0c0a13]/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl z-[9999] py-1.5 overflow-hidden",
                            className
                        )}
                        style={{
                            width
                        } as React.CSSProperties}
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
