import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

interface UndoToastProps {
    message: string;
    undo: () => void;
    id: string;
    duration?: number;
    visible?: boolean;
}

const UndoToast: React.FC<UndoToastProps> = ({ message, undo, id, duration = 3000, visible = true }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleUndo = () => {
        undo();
        toast.dismiss(id);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{
                opacity: visible ? 1 : 0,
                y: visible ? 0 : 20,
                scale: visible ? 1 : 0.9
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="group relative flex items-center gap-2.5 w-full min-w-[260px] px-3.5 py-2 overflow-hidden rounded-xl border border-white/10 backdrop-blur-2xl transition-all"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Base Layer: Semi-transparent gray-toned track */}
            <div className="absolute inset-0 bg-white/[0.03] z-0" />

            {/* Active Layer: Progress Slider (Subtle White Highlight) */}
            <div
                className="absolute inset-0 bg-white/[0.06] origin-left z-0"
                style={{
                    animation: `toast-progress ${duration}ms linear forwards`,
                    animationPlayState: isHovered ? 'paused' : 'running'
                }}
            />

            <p className="text-[11px] text-gray-300 font-medium z-10 relative tracking-wide uppercase">{message}</p>

            <button
                onClick={handleUndo}
                className="ml-auto p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all z-10 relative group/btn"
                title="Undo"
            >
                <RotateCcw size={12} className="group-hover/btn:rotate-[-45deg] transition-transform duration-300" />
            </button>

            <style>{`
                @keyframes toast-progress {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }
            `}</style>
        </motion.div>
    );
};

export default UndoToast;
