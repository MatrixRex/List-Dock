import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UndoToastProps {
    message: string;
    undo: () => void;
    id: string;
    duration?: number;
}

const UndoToast: React.FC<UndoToastProps> = ({ message, undo, id, duration = 5000 }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleUndo = () => {
        undo();
        toast.dismiss(id);
    };

    return (
        <div
            className="group relative flex items-center gap-3 w-full min-w-[320px] px-4 py-3 overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <p className="text-sm text-gray-200 font-medium z-10">{message}</p>

            <button
                onClick={handleUndo}
                className="ml-auto p-1.5 rounded-lg text-purple-400 hover:bg-purple-400/20 transition-colors z-10 relative overflow-hidden group/btn"
                title="Undo"
            >
                <RotateCcw size={16} className="group-hover/btn:rotate-[-45deg] transition-transform duration-300" />
            </button>

            {/* Progress Bar Container */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700/50">
                <div
                    className="h-full bg-purple-500/60 transition-transform origin-left"
                    style={{
                        animation: `toast-progress ${duration}ms linear forwards`,
                        animationPlayState: isHovered ? 'paused' : 'running'
                    }}
                />
            </div>

            <style>{`
                @keyframes toast-progress {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }
            `}</style>
        </div>
    );
};

export default UndoToast;
