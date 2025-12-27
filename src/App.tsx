import React from 'react';
import { useStore } from './store/useStore';
import Header from './components/Header';
import RootView from './components/RootView';
import FolderView from './components/FolderView';
import SmartInput from './components/SmartInput';
import { Toaster } from 'sonner';
import { DnDProvider } from './store/DnDContext';

const App: React.FC = () => {
  const currentView = useStore((state) => state.currentView);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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
      <div className="flex flex-col h-screen overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          {currentView === 'root' ? <RootView /> : <FolderView />}
        </main>

        <SmartInput />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              padding: 0,
              marginBottom: '80px',
            },
          }}
        />
      </div>
    </DnDProvider>
  );
};

export default App;
