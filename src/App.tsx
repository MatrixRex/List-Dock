import React from 'react';
import { useStore } from './store/useStore';
import { type Item } from './types';
import Header from './components/Header';
import RootView from './components/RootView';
import FolderView from './components/FolderView';
import SmartInput from './components/SmartInput';
import { Toaster } from 'react-hot-toast';
import { DnDProvider } from './store/DnDContext';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const currentView = useStore((state: any) => state.currentView);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      // Global Undo (Ctrl+Z)
      const isZ = e.key === 'z' || e.key === 'Z' || e.code === 'KeyZ';
      if ((e.ctrlKey || e.metaKey) && isZ && !e.shiftKey && !e.altKey) {
        // If in input, only override if input is empty
        if (isInput) {
          const target = e.target as HTMLInputElement;
          if (target.value !== '') return;
        }

        e.preventDefault();
        e.stopPropagation();

        const state = useStore.getState();
        if (state.undo) {
          state.undo();
        }
        return;
      }

      // Input Guard for other shortcuts
      if (isInput) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const state = useStore.getState();
        if (state.selectedTaskIds.length > 0) {
          const { items, selectedTaskIds, copyWithSubtasks } = state;
          const selectedItems = items.filter((i: Item) => selectedTaskIds.includes(i.id));

          let textToCopy = '';

          if (copyWithSubtasks) {
            // Find top-level items among selection to avoid duplicates
            const topLevelSelected = selectedItems.filter(item =>
              !item.parent_id || !selectedTaskIds.includes(item.parent_id)
            );

            const formatItemRecursive = (item: Item, depth = 0): string => {
              const indent = "  ".repeat(depth);
              let text = `${indent}- ${item.title}`;

              // Find children in the full items list
              const children = items
                .filter((i: Item) => i.parent_id === item.id)
                .sort((a: Item, b: Item) => a.order_index - b.order_index);

              if (children.length > 0) {
                const childrenText = children.map(c => formatItemRecursive(c, depth + 1)).join('\n');
                text += '\n' + childrenText;
              }
              return text;
            };

            textToCopy = topLevelSelected
              .map(item => formatItemRecursive(item))
              .join('\n');
          } else {
            textToCopy = selectedItems.map(i => i.title).join('\n');
          }

          if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
              import('react-hot-toast').then(({ toast }) => {
                const message = copyWithSubtasks && selectedItems.some(item => items.some(i => i.parent_id === item.id))
                  ? (selectedItems.length > 1 ? `Copied ${selectedItems.length} items with subtasks` : 'Copied with subtasks')
                  : (selectedItems.length > 1 ? `Copied ${selectedItems.length} items` : 'Copied to clipboard');

                toast.success(message, {
                  duration: 3000,
                  id: 'copy-toast',
                  className: 'glass-toast-standard',
                });
              });
            });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (isInput) return;

      const text = e.clipboardData?.getData('text');
      if (text) {
        useStore.getState().handlePaste(text);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  React.useEffect(() => {
    const handleClick = () => {
      const { selectedTaskIds, clearTaskSelection } = useStore.getState();
      if (selectedTaskIds.length > 0) {
        clearTaskSelection();
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  React.useEffect(() => {
    // Establish connection with background script to track open state
    const port = chrome.runtime.connect({ name: 'sidepanel' });

    // Handle messages from background
    port.onMessage.addListener((msg) => {
      if (msg.type === 'CLOSE_SIDE_PANEL') {
        window.close();
      }
    });

    // Find the current window ID and notify background
    chrome.windows.getCurrent().then((window) => {
      if (window.id) {
        port.postMessage({ type: 'INIT_SIDE_PANEL', windowId: window.id });
      }
    });

    return () => port.disconnect();
  }, []);

  return (
    <DnDProvider>
      <div className="flex flex-col h-screen overflow-hidden border border-white/5 bg-[#050408]/50">
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
        <Toaster
          position="bottom-center"
          containerClassName="toast-container"
          containerStyle={{
            bottom: 80,
          }}
          toastOptions={{
            duration: 3000,
            className: 'glass-toast',
          }}
        />
      </div>
    </DnDProvider>
  );
};

export default App;
