import React from 'react';
import Header from '../Header';
import RootView from '../RootView';
import FolderView from '../FolderView';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, type StoreState } from '../../store/useStore';
import { List, Settings, User, Plus } from 'lucide-react';
import { useBackHandler } from '../../hooks/useBackHandler';
// import FocusedContextUI from '../FocusedContextUI';
import { cn } from '../../utils/utils';
import { useDnDContext } from '../../store/useDnDContext';
import MobileFocusedView from '../MobileFocusedView';
import SettingsContent from '../SettingsContent';

const MobileLayout: React.FC = () => {
  const currentView = useStore((state: StoreState) => state.currentView);
  const selectedTaskIds = useStore((state: StoreState) => state.selectedTaskIds);
  const isSettingsOpen = useStore((state: StoreState) => state.isSettingsOpen);
  const setIsSettingsOpen = useStore((state: StoreState) => state.setIsSettingsOpen);
  
  const [activeTab, setActiveTab] = React.useState<'lists' | 'account' | 'settings'>('lists');
  const [prevTab, setPrevTab] = React.useState<'lists' | 'account' | 'settings'>('lists');
  const [showAddBar, setShowAddBar] = React.useState(false);
  const [addBarMode, setAddBarMode] = React.useState<'task' | 'folder' | 'search'>('task');
  const { clearTaskSelection, setView } = useStore();
  const { dragState } = useDnDContext();

  // Tab index for transition logic
  const tabOrder = { lists: 0, account: 1, settings: 2 };

  // 1. Sync from global store (isSettingsOpen) to local tab state
  React.useEffect(() => {
    if (isSettingsOpen && activeTab !== 'settings') {
      setActiveTab('settings');
    } else if (!isSettingsOpen && activeTab === 'settings') {
      setActiveTab('lists');
    }
  }, [isSettingsOpen]); // Only sync when the global store state changes

  // 2. Sync from local tab state to global store and handle animation state
  React.useEffect(() => {
    // Update global store
    const shouldBeOpen = activeTab === 'settings';
    if (isSettingsOpen !== shouldBeOpen) {
      setIsSettingsOpen(shouldBeOpen);
    }
    
    // Update prevTab for transition logic
    if (activeTab !== prevTab) {
      setPrevTab(activeTab);
    }
  }, [activeTab, setIsSettingsOpen]); // Only sync when the active tab changes


  const tabDirection = tabOrder[activeTab] > tabOrder[prevTab] ? 1 : -1;
  const isTabSwitch = activeTab !== prevTab;

  const handleClose = () => {
    if (dragState.draggedItemId) return;
    setShowAddBar(false);
    clearTaskSelection();
  };

  // Open add bar when a task is selected
  React.useEffect(() => {
    if (selectedTaskIds.length > 0) {
      setShowAddBar(true);
    }
  }, [selectedTaskIds]);

  // 1. Handle folder view back navigation
  useBackHandler(currentView === 'folder', () => setView('root'), 'mobile-folder-view');

  // 2. Handle tab navigation (Account/Settings -> Lists)
  useBackHandler(activeTab !== 'lists', () => setActiveTab('lists'), 'mobile-active-tab');

  // 3. Handle Add Bar / Focus View back navigation
  useBackHandler(showAddBar, handleClose, 'mobile-focused-view');
  
  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#050408] relative">
      <Header 
        hideSettings 
        title={activeTab === 'account' ? 'Account' : activeTab === 'settings' ? 'Settings' : undefined} 
      />

      <main 
        className="flex-1 relative overflow-hidden"
        onClick={() => {
            if (showAddBar) handleClose();
        }}
      >
        <AnimatePresence initial={false} custom={isTabSwitch ? tabDirection : (currentView === 'folder' ? 1 : -1)}>
          <motion.div
            key={activeTab === 'lists' ? `${activeTab}-${currentView}` : activeTab}
            custom={isTabSwitch ? tabDirection : (currentView === 'folder' ? 1 : -1)}
            variants={{
              enter: (direction: number) => ({
                x: direction > 0 ? '100%' : '-100%',
                opacity: 0
              }),
              center: {
                zIndex: 1,
                x: 0,
                opacity: 1
              },
              exit: (direction: number) => ({
                zIndex: 0,
                x: direction < 0 ? '100%' : '-100%',
                opacity: 0
              })
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 32 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 overflow-y-auto custom-scrollbar"
          >
            {activeTab === 'lists' ? (
                <div className="px-4 py-2">
                    {currentView === 'root' ? <RootView /> : <FolderView />}
                </div>
            ) : activeTab === 'account' ? (
                <div className="flex flex-col h-full">
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full" />
                            <div className="relative w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl mb-2 rotate-3">
                                <User size={48} className="text-purple-400/50" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-white tracking-tight">Cloud Sync</h3>
                            <p className="text-gray-400 text-sm leading-relaxed max-w-[280px]">
                                Seamlessly sync your lists across all your devices with end-to-end encryption.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 w-full max-w-[240px]">
                            <button className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-600/20 border border-white/10 active:scale-95">
                                Stay Updated
                            </button>
                            <button className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-sm font-medium transition-all border border-white/5">
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                        <SettingsContent onClose={() => setActiveTab('lists')} />
                    </div>
                </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FAB - Only on Lists Tab */}
      <AnimatePresence>
        {activeTab === 'lists' && !showAddBar && (
          <motion.button 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setShowAddBar(true)}
            className="fixed right-6 bottom-28 w-14 h-14 rounded-2xl bg-purple-600 text-white shadow-xl shadow-purple-600/30 flex items-center justify-center active:scale-90 transition-all z-[150] border border-white/10"
          >
            <Plus size={32} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* SmartInput Isolated View (Panel) */}
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
      <nav className="h-24 glass glass-top-only bg-[#0a090f]/90 backdrop-blur-3xl flex items-center justify-around px-6 pt-2 pb-[env(safe-area-inset-bottom,1rem)] shrink-0 relative z-[550]">
        <button 
          onClick={() => setActiveTab('lists')}
          className={cn(
            "flex flex-col items-center gap-1.5 transition-all",
            activeTab === 'lists' ? "text-white/90" : "text-white/30 hover:text-white/60"
          )}
        >
          <div className={cn(
            "p-2 rounded-xl transition-all",
            activeTab === 'lists' ? "bg-white/10 shadow-lg border border-white/10" : ""
          )}>
            <List size={22} className={cn(activeTab === 'lists' && "text-purple-400")} />
          </div>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-[0.2em]",
            activeTab === 'lists' ? "opacity-80 text-purple-400" : "opacity-40"
          )}>Lists</span>
        </button>

        <button 
          onClick={() => setActiveTab('account')}
          className={cn(
            "flex flex-col items-center gap-1.5 transition-all",
            activeTab === 'account' ? "text-white/90" : "text-white/30 hover:text-white/60"
          )}
        >
          <div className={cn(
            "p-2 rounded-xl transition-all",
            activeTab === 'account' ? "bg-white/10 shadow-lg border border-white/10" : ""
          )}>
            <User size={22} className={cn(activeTab === 'account' && "text-purple-400")} />
          </div>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-[0.2em]",
            activeTab === 'account' ? "opacity-80 text-purple-400" : "opacity-40"
          )}>Account</span>
        </button>

        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex flex-col items-center gap-1.5 transition-all",
            activeTab === 'settings' ? "text-white/90" : "text-white/30 hover:text-white/60"
          )}
        >
          <div className={cn(
            "p-2 rounded-xl transition-all",
            activeTab === 'settings' ? "bg-white/10 shadow-lg border border-white/10" : ""
          )}>
            <Settings size={22} className={cn(activeTab === 'settings' && "text-purple-400")} />
          </div>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-[0.2em]",
            activeTab === 'settings' ? "opacity-80 text-purple-400" : "opacity-40"
          )}>Settings</span>
        </button>
      </nav>
    </div>
  );
};

export default MobileLayout;
