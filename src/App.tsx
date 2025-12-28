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
      // Don't override standard copy if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const state = useStore.getState();
        if (state.selectedTaskId) {
          const item = state.items.find((i: Item) => i.id === state.selectedTaskId);
          if (item) {
            navigator.clipboard.writeText(item.title).then(() => {
              // Using a simple toast for copy confirmation
              import('react-hot-toast').then(({ toast }) => {
                toast.success('Copied to clipboard', {
                  duration: 3000,
                  id: 'copy-toast',
                  className: 'glass-toast-standard',
                });
              });
            });
          }
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        useStore.getState().undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
