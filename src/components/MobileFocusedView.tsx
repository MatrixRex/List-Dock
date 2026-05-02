import React from 'react';
import { motion } from 'framer-motion';
import FocusedContextUI from './FocusedContextUI';
import SmartInput from './SmartInput';
// import { cn } from '../utils/utils';

interface MobileFocusedViewProps {
    onClose: () => void;
    mode: 'task' | 'folder' | 'search';
    onModeChange: (mode: 'task' | 'folder' | 'search') => void;
}

const MobileFocusedView: React.FC<MobileFocusedViewProps> = ({ onClose, mode, onModeChange }) => {
    // const { selectedTaskIds } = useStore();
    // const { dragState } = useDnDContext();
    const [viewportHeight, setViewportHeight] = React.useState(window.innerHeight);
    const [viewportOffset, setViewportOffset] = React.useState(0);

    React.useEffect(() => {
        const handleResize = () => {
            if (window.visualViewport) {
                setViewportHeight(window.visualViewport.height);
                setViewportOffset(window.visualViewport.offsetTop);
            } else {
                setViewportHeight(window.innerHeight);
            }
        };

        window.visualViewport?.addEventListener('resize', handleResize);
        window.visualViewport?.addEventListener('scroll', handleResize);
        handleResize();

        return () => {
            window.visualViewport?.removeEventListener('resize', handleResize);
            window.visualViewport?.removeEventListener('scroll', handleResize);
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 z-[500] bg-[#050408] flex flex-col"
            style={{ 
                height: viewportHeight,
                top: viewportOffset,
                bottom: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Safe Area Top Spacing */}
            <div className="h-[env(safe-area-inset-top)] bg-[#050408]" />
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0">
                <FocusedContextUI mode={mode} onClose={onClose} />
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
