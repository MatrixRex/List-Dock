import React from 'react';
import Header from '../Header';
import RootView from '../RootView';
import FolderView from '../FolderView';
import SmartInput from '../SmartInput';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, type StoreState } from '../../store/useStore';

const SidebarLayout: React.FC = () => {
  const currentView = useStore((state: StoreState) => state.currentView);

  return (
    <div className="flex flex-col h-dvh overflow-hidden border-x border-white/5 bg-[#050408]/50 max-w-[450px] mx-auto shadow-2xl relative">
      <Header />

      <main className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {currentView === 'root' ? <RootView /> : <FolderView />}
          </motion.div>
        </AnimatePresence>
      </main>

      <SmartInput />
    </div>
  );
};

export default SidebarLayout;
