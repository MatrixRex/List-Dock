import React from 'react';
import RootView from '../RootView';
import FolderView from '../FolderView';
import SmartInput from '../SmartInput';
import TaskCard from '../TaskCard';
import FolderCard from '../FolderCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, type StoreState } from '../../store/useStore';
import { LayoutGrid, List, Settings, User, Search, Plus, Edit2, Trash2, Folder } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '../../utils/utils';
import SettingsPopup from '../SettingsPopup';
import FolderSettingsPopup from '../FolderSettingsPopup';
import ConfirmDialog from '../ui/ConfirmDialog';

const DesktopLayout: React.FC = () => {
  const { 
    items, 
    currentView, 
    currentFolderId, 
    setView, 
    selectedTaskIds, 
    toggleTaskSelection,
    isSettingsOpen,
    setIsSettingsOpen,
    deleteItem,
    showCompleted,
    hideCompletedSubtasks
  } = useStore();

  const [editingFolder, setEditingFolder] = React.useState<any>(null);
  const [deletingFolder, setDeletingFolder] = React.useState<any>(null);
  
  // 1. Folders Column Data
  const folders = items.filter(i => i.type === 'folder');
  const activeFolder = items.find(i => i.id === currentFolderId);
  
  // 2. Middle Column Data (Tasks)
  const tasks = React.useMemo(() => {
    if (currentView === 'root') {
      return items.filter(i => !i.parent_id && i.type === 'task')
                  .sort((a, b) => a.order_index - b.order_index);
    }
    return items.filter(i => i.parent_id === currentFolderId && i.type === 'task')
                .sort((a, b) => a.order_index - b.order_index);
  }, [items, currentView, currentFolderId]);

  const [focusedTaskId, setFocusedTaskId] = React.useState<string | null>(null);

  // Update focused task only when a top-level task is selected
  React.useEffect(() => {
    const lastSelectedId = selectedTaskIds[selectedTaskIds.length - 1];
    if (!lastSelectedId) {
      // Don't clear immediately, let showSubtasksSidebar handle visibility based on current subtasks
      return;
    }
    
    const item = items.find(i => i.id === lastSelectedId);
    // If it's a main task (not a subtask), focus it
    if (item?.type === 'task') {
      setFocusedTaskId(lastSelectedId);
    }
    // If it's a subtask, we keep the current focusedTaskId so the sidebar stays open on the parent
  }, [selectedTaskIds, items]);

  // 3. Right Column Data (Subtasks)
  // We use the focused task to show subtasks
  const activeTask = items.find(i => i.id === focusedTaskId);
  const subtasks = React.useMemo(() => {
    if (!focusedTaskId || activeTask?.type === 'folder') return [];
    
    return items
      .filter(i => i.parent_id === focusedTaskId && i.type === 'subtask')
      .filter(i => {
        if (showCompleted) return true;
        if (i.is_completed) {
          return !hideCompletedSubtasks;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.is_completed !== b.is_completed) {
            return a.is_completed ? 1 : -1;
        }
        return a.order_index - b.order_index;
      });
  }, [items, focusedTaskId, activeTask, showCompleted, hideCompletedSubtasks]);

  const showSubtasksSidebar = subtasks.length > 0;

  return (
    <div 
      className="flex h-dvh overflow-hidden bg-[#050408]/50 text-white selection:bg-purple-500/30"
    >
      {/* 1. Folders Column (Left) */}
      <aside 
        onClick={(e) => e.stopPropagation()}
        className="w-72 border-r border-white/5 bg-[#0a090f]/80 backdrop-blur-3xl flex flex-col shadow-2xl z-20"
      >
        {/* Header Section */}
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black text-white tracking-tighter flex items-center gap-3">
              <img src="/icons/icon128.png" alt="ListDock" className="w-8 h-8 rounded-lg shadow-lg" />
              ListDock
            </h1>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
          <nav className="space-y-6">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4 px-2">Folders</h3>
              <div className="space-y-2">
                {/* Pinned Default Folder */}
                {(() => {
                  const rootTaskCount = items.filter(i => !i.parent_id && i.type === 'task').length;
                  const isActive = currentView === 'root';
                  const folderColor = '#a855f7'; // Purple for Default

                  return (
                    <motion.div layout className="group relative">
                      <motion.button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setView('root');
                        }}
                        whileHover={{
                          backgroundColor: `${folderColor}15`,
                          borderColor: folderColor,
                          boxShadow: `0 0 20px ${folderColor}20`
                        }}
                        className={cn(
                          "glass w-full flex items-center gap-3 p-2 px-3 mb-1 rounded-xl transition-all border border-transparent relative z-10",
                          isActive
                          ? 'bg-white/10 text-white shadow-inner' 
                          : 'text-white/30 hover:text-white'
                        )}
                        style={isActive ? { borderColor: folderColor, backgroundColor: `${folderColor}15` } : {}}
                      >
                        <LayoutGrid 
                          size={18} 
                          className={isActive ? 'text-purple-400' : 'group-hover:text-purple-400 transition-colors'} 
                        />
                        <span className="font-bold text-sm truncate flex-1 text-left">Default</span>
                        
                        <div className="flex items-center gap-2 shrink-0">
                           <span className="text-[10px] font-black text-white/10 transition-all uppercase tracking-tighter group-hover:hidden">
                             {rootTaskCount} {rootTaskCount === 1 ? 'Item' : 'Items'}
                           </span>
                        </div>
                      </motion.button>
                    </motion.div>
                  );
                })()}

                {/* Actual Folders */}
                {folders.map(folder => (
                  <FolderCard 
                    key={folder.id} 
                    item={folder} 
                    isSidebar 
                    isActive={currentView === 'folder' && currentFolderId === folder.id} 
                  />
                ))}
              </div>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 space-y-1">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/30 hover:bg-white/5 hover:text-white transition-all group"
          >
            <Settings size={20} className="group-hover:text-purple-400 transition-colors" />
            <span className="font-bold text-sm">Settings</span>
          </button>
          
          <button 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/30 hover:bg-white/5 hover:text-white transition-all group"
          >
            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-purple-500/50 transition-colors">
              <User size={12} className="group-hover:text-purple-400 transition-colors" />
            </div>
            <span className="font-bold text-sm">Profile</span>
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
          </button>
        </div>
      </aside>

      {/* 2. Tasks Column (Middle) */}
      <section 
        onClick={(e) => e.stopPropagation()}
        className="flex-1 flex flex-col min-w-[500px] bg-white/[0.01] backdrop-blur-3xl relative"
      >
        <header className="px-10 py-8 border-b border-white/5 flex items-center justify-between z-10 h-[105px]">
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-1">Current Folder</p>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                {currentView === 'root' ? (
                  <LayoutGrid size={24} className="text-purple-400" />
                ) : activeFolder ? (
                  <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-white/5" style={{ color: activeFolder.color || '#a855f7' }}>
                    {(() => {
                      const IconComponent = (LucideIcons[activeFolder.icon as keyof typeof LucideIcons] as React.ElementType) || Folder;
                      const isLetterIcon = !activeFolder.icon || activeFolder.icon === 'Letter';
                      return isLetterIcon ? (
                        <span className="text-base font-black uppercase">{activeFolder.title.charAt(0)}</span>
                      ) : (
                        <IconComponent size={20} />
                      );
                    })()}
                  </div>
                ) : null}
                
                <span className="truncate">{currentView === 'root' ? 'Default Folder' : activeFolder?.title || 'Folder'}</span>
                
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-white/40 uppercase tracking-widest ml-1">
                  {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
                </div>
              </h2>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            <div className="py-12 px-10 flex-1">
                {currentView === 'root' ? <RootView /> : <FolderView />}
            </div>
        </main>

        <footer className="z-10 w-full">
           <SmartInput />
        </footer>
      </section>

      {/* 3. Subtasks Column (Right) */}
      <AnimatePresence>
        {showSubtasksSidebar && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 440, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="border-l border-white/5 bg-[#0a090f]/60 backdrop-blur-3xl flex flex-col overflow-hidden"
          >
            <header className="px-10 py-8 border-b border-white/5 flex items-center justify-between shrink-0 h-[105px]">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-1">Subtasks Breakdown</p>
                  <h3 className="text-2xl font-black text-white tracking-tight truncate pr-4">
                    {activeTask?.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                   <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-white/40 uppercase tracking-widest">
                     {subtasks.length} {subtasks.length === 1 ? 'Item' : 'Items'}
                   </div>
                </div>
            </header>
              
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
              <div className="space-y-1">
                {subtasks.map(subtask => (
                  <TaskCard 
                    key={subtask.id}
                    item={subtask}
                    isSubtask={false} 
                    hideSubtasks={true} 
                  />
                ))}

                {subtasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                    <List size={40} className="mb-4" />
                    <p className="text-sm font-medium">No subtasks found</p>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <SettingsPopup 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {editingFolder && (
        <FolderSettingsPopup 
          isOpen={!!editingFolder}
          onClose={() => setEditingFolder(null)}
          folder={editingFolder}
        />
      )}

      {deletingFolder && (
        <ConfirmDialog 
          isOpen={!!deletingFolder}
          onClose={() => setDeletingFolder(null)}
          onConfirm={() => {
            deleteItem(deletingFolder.id);
            if (currentFolderId === deletingFolder.id) setView('root');
            setDeletingFolder(null);
          }}
          title="Delete Folder?"
          message={`Are you sure you want to delete "${deletingFolder.title}"? All tasks inside will be permanently removed.`}
          confirmText="Delete Folder"
          variant="danger"
        />
      )}
    </div>
  );
};

export default DesktopLayout;
