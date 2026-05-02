import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
    showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    className,
    showCloseButton = true
}) => {
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 640);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Prevent scroll on body when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className={cn(
                    "fixed inset-0 z-[10000] flex",
                    isMobile ? "items-end justify-center" : "items-center justify-center p-4"
                )}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 }}
                        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
                        exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 }}
                        transition={isMobile ? { type: "spring", damping: 30, stiffness: 300, mass: 0.8 } : { type: "spring", duration: 0.4, bounce: 0.3 }}
                        className={cn(
                            "relative w-full bg-gray-900 border-gray-800 shadow-2xl overflow-hidden",
                            isMobile ? "rounded-t-[2.5rem] border-t max-w-none pb-[env(safe-area-inset-bottom,20px)]" : "max-w-sm border rounded-2xl",
                            className
                        )}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Mobile Handle */}
                        {isMobile && (
                            <div className="w-full flex justify-center pt-3 pb-1">
                                <div className="w-12 h-1.5 bg-white/10 rounded-full" />
                            </div>
                        )}

                        {/* Header */}
                        {(title || showCloseButton) && (
                            <div className={cn(
                                "flex items-center justify-between border-b border-gray-800",
                                isMobile ? "px-8 py-5" : "px-6 py-4"
                            )}>
                                {title && <h2 className={cn("font-bold text-gray-100", isMobile ? "text-xl" : "text-lg")}>{title}</h2>}
                                {showCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-xl transition-all active:scale-90"
                                    >
                                        <X size={isMobile ? 24 : 20} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Body */}
                        <div className={cn(
                            isMobile ? "p-8 max-h-[85vh] overflow-y-auto custom-scrollbar" : "p-6"
                        )}>
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default Modal;
