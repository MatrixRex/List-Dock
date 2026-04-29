import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FocusedContextUI from './FocusedContextUI';
import SmartInput from './SmartInput';
import { cn } from '../utils/utils';
import { useStore } from '../store/useStore';
import { useDnDContext } from '../store/DnDContext';

interface MobileFocusedViewProps {
    onClose: () => void;
    mode: 'task' | 'folder' | 'search';
    onModeChange: (mode: 'task' | 'folder' | 'search') => void;
}

const MobileFocusedView: React.FC<MobileFocusedViewProps> = ({ onClose, mode, onModeChange }) => {
    const { selectedTaskIds } = useStore();
    const { dragState } = useDnDContext();

    return (
        <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[500] bg-[#050408] flex flex-col"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Safe Area Top Spacing */}
            <div className="h-[env(safe-area-inset-top)] bg-[#050408]" />
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0">
                <FocusedContextUI mode={mode} />
            </div>

            {/* Input Area at Bottom */}
            <SmartInput 
                isMobileOverlay 
                onClose={onClose} 
                onModeChange={onModeChange} 
            />
        </motion.div>
    );
};

export default MobileFocusedView;
