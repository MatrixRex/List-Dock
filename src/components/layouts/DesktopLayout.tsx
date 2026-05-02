import React from 'react';
import RootView from '../RootView';
import FolderView from '../FolderView';
import SmartInput from '../SmartInput';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, type StoreState } from '../../store/useStore';
import { LayoutGrid, List, Settings, User, Search, Plus } from 'lucide-react';
import SettingsPopup from '../SettingsPopup';

const DesktopLayout: React.FC = () => {
  const currentView = useStore((state: StoreState) => state.currentView);
  const isSettingsOpen = useStore((state: StoreState) => state.isSettingsOpen);
  const setIsSettingsOpen = useStore((state: StoreState) => state.setIsSettingsOpen);
  
  return (
    <div className="flex h-dvh overflow-hidden bg-[#050408]/50 text-white selection:bg-purple-500/30">
      {/* Sidebar Navigation (Left Column) */}
      <aside className="w-72 border-r border-white/5 bg-[#0a090f]/80 backdrop-blur-3xl flex flex-col shadow-2xl">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center shadow-xl shadow-purple-500/20 border border-white/10">
               <List size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">ListDock</h1>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-purple-500/80 leading-none">Professional</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button className="w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-white/5 text-white shadow-inner border border-white/10 transition-all hover:bg-white/10">
              <LayoutGrid size={20} className="text-purple-400" />
              <span className="font-semibold text-sm">Dashboard</span>
            </button>
            <button className="w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl text-white/30 hover:bg-white/5 hover:text-white/80 transition-all group">
              <Search size={20} className="group-hover:text-purple-400/50 transition-colors" />
              <span className="font-semibold text-sm">Quick Find</span>
            </button>
            <button className="w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl text-white/30 hover:bg-white/5 hover:text-white/80 transition-all group">
              <User size={20} className="group-hover:text-purple-400/50 transition-colors" />
              <span className="font-semibold text-sm">Account</span>
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl text-white/30 hover:bg-white/5 hover:text-white/80 transition-all group"
            >
              <Settings size={20} className="group-hover:text-purple-400/50 transition-colors" />
              <span className="font-semibold text-sm">Settings</span>
            </button>
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5 bg-white/[0.02]">
          <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold uppercase tracking-widest text-xs">
            <Plus size={20} />
            <span>Create List</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area (Middle Column) */}
      <section className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-[#0d0c14]/40 to-transparent">
        <header className="h-20 border-b border-white/5 flex items-center px-10 justify-between backdrop-blur-md z-10">
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
             <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white/30">
               {currentView === 'root' ? 'Universal Workspace' : 'Category View'}
             </h2>
           </div>
           
           <div className="flex items-center gap-4">
             <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-white/40">
               v1.5.1
             </div>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-10">
           <div className="max-w-5xl mx-auto">
             <AnimatePresence mode="wait">
               <motion.div
                 key={currentView}
                 initial={{ opacity: 0, scale: 0.98, y: 10 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 1.02, y: -10 }}
                 transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
               >
                 {currentView === 'root' ? <RootView /> : <FolderView />}
               </motion.div>
             </AnimatePresence>
           </div>
        </main>

        <footer className="p-10 z-10">
           <div className="max-w-3xl mx-auto w-full">
              <SmartInput />
           </div>
        </footer>
      </section>

      {/* Detail Panel (Right Column) */}
      <aside className="w-96 border-l border-white/5 bg-[#0a090f]/50 backdrop-blur-3xl hidden 2xl:flex flex-col p-10 overflow-y-auto custom-scrollbar">
        <div className="mb-10 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/20">Task Insights</h3>
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
            <Settings size={14} />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center text-center group">
          <div className="w-24 h-24 rounded-[2rem] bg-white/[0.03] border border-white/5 flex items-center justify-center mb-8 text-white/5 group-hover:bg-white/[0.05] group-hover:border-white/10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
            <List size={48} />
          </div>
          <h4 className="text-lg font-bold text-white/40 mb-2">No Active Selection</h4>
          <p className="text-white/10 text-sm max-w-[200px] leading-relaxed italic">Select any task from the workspace to view its properties, subtasks, and history.</p>
        </div>

        <div className="mt-10 p-6 rounded-3xl bg-purple-600/5 border border-purple-500/10">
          <p className="text-[10px] text-purple-400/60 font-bold uppercase tracking-widest mb-2">Pro Tip</p>
          <p className="text-xs text-white/30 leading-relaxed">Use <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-sans text-white/60">Ctrl + Z</kbd> to undo any action instantly from the universal workspace.</p>
        </div>
      </aside>

      <SettingsPopup 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default DesktopLayout;
