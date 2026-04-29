import React from 'react';
import Header from '../Header';
import RootView from '../RootView';
import FolderView from '../FolderView';
import SmartInput from '../SmartInput';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { List, Settings, User, Plus } from 'lucide-react';

const MobileLayout: React.FC = () => {
  const currentView = useStore((state: any) => state.currentView);
  const selectedTaskIds = useStore((state: any) => state.selectedTaskIds);
  const [showAddBar, setShowAddBar] = React.useState(false);
  const { clearTaskSelection } = useStore();

  const handleClose = () => {
    setShowAddBar(false);
    clearTaskSelection();
  };

  // Open add bar when a task is selected
  React.useEffect(() => {
    if (selectedTaskIds.length > 0) {
      setShowAddBar(true);
    }
  }, [selectedTaskIds]);
  
  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#050408] relative">
      <Header />

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
        className="fixed right-6 bottom-28 w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/30 flex items-center justify-center active:scale-90 transition-all z-[150] border border-white/10"
      >
        <Plus size={32} />
      </button>

      {/* SmartInput Overlay */}
      <AnimatePresence>
        {showAddBar && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[190]"
            />
            
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[200]"
            >
              <SmartInput isMobileOverlay onClose={handleClose} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="h-20 border-t border-white/5 bg-[#0a090f]/80 backdrop-blur-2xl flex items-center justify-around px-6 pb-4 shrink-0">
        <button className="flex flex-col items-center gap-1.5 text-white/90">
          <div className="p-2 rounded-xl bg-white/10 shadow-lg border border-white/10">
            <List size={22} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Lists</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 text-white/30 hover:text-white/60 transition-all">
          <div className="p-2">
            <User size={22} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Account</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 text-white/30 hover:text-white/60 transition-all">
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
