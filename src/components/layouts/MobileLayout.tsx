import React from 'react';
import Header from '../Header';
import RootView from '../RootView';
import FolderView from '../FolderView';
import SmartInput from '../SmartInput';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { List, Settings, User, Plus } from 'lucide-react';
import FocusedContextUI from '../FocusedContextUI';
import { cn } from '../../utils/utils';
import { useDnDContext } from '../../store/DnDContext';
import MobileFocusedView from '../MobileFocusedView';

const MobileLayout: React.FC = () => {
  const currentView = useStore((state: any) => state.currentView);
  const selectedTaskIds = useStore((state: any) => state.selectedTaskIds);
  const setIsSettingsOpen = useStore((state: any) => state.setIsSettingsOpen);
  const [showAddBar, setShowAddBar] = React.useState(false);
  const [addBarMode, setAddBarMode] = React.useState<'task' | 'folder' | 'search'>('task');
  const { clearTaskSelection } = useStore();
  const { dragState } = useDnDContext();

  const handleClose = () => {
    if (dragState.draggedItemId) return;
    if (showAddBar) {
      window.history.back();
    } else {
      setShowAddBar(false);
      clearTaskSelection();
    }
  };

  // Open add bar when a task is selected
  React.useEffect(() => {
    if (selectedTaskIds.length > 0) {
      setShowAddBar(true);
    }
  }, [selectedTaskIds]);

  // Handle back button to close add bar
  React.useEffect(() => {
    if (showAddBar) {
      window.history.pushState({ action: 'add' }, '');
    }
    
    const handlePopState = () => {
      if (showAddBar) {
        setShowAddBar(false);
        clearTaskSelection();
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showAddBar, clearTaskSelection]);
  
  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#050408]/50 relative">
      <Header hideSettings />

      <main 
        className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar relative"
        onClick={() => {
            if (showAddBar) handleClose();
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {currentView === 'root' ? <RootView /> : <FolderView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FAB */}
      <button 
        onClick={() => setShowAddBar(true)}
        className="fixed right-6 bottom-28 w-14 h-14 rounded-2xl bg-purple-600 text-white shadow-xl shadow-purple-600/30 flex items-center justify-center active:scale-90 transition-all z-[150] border border-white/10"
      >
        <Plus size={32} />
      </button>

      {/* SmartInput Isolated View */}
      <AnimatePresence>
        {showAddBar && (
          <MobileFocusedView 
            onClose={handleClose}
            mode={addBarMode}
            onModeChange={setAddBarMode}
          />
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="h-24 border-t border-white/5 bg-[#0a090f]/80 backdrop-blur-3xl flex items-center justify-around px-6 pt-2 pb-4 shrink-0">
        <button className="flex flex-col items-center gap-1.5 text-white/90">
          <div className="p-2 rounded-xl bg-white/10 shadow-lg border border-white/10">
            <List size={22} className="text-purple-400" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 text-purple-400">Lists</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 text-white/30 hover:text-white/60 transition-all">
          <div className="p-2">
            <User size={22} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Account</span>
        </button>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="flex flex-col items-center gap-1.5 text-white/30 hover:text-white/60 transition-all"
        >
          <div className="p-2">
            <Settings size={22} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Settings</span>
        </button>
      </nav>
    </div>
  );
};

export default MobileLayout;
