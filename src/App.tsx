import React from 'react';
import { useStore } from './store/useStore';
import Header from './components/Header';
import RootView from './components/RootView';
import FolderView from './components/FolderView';
import SmartInput from './components/SmartInput';
import ToastContainer from './components/ToastContainer';
import { DnDProvider } from './store/DnDContext';

const App: React.FC = () => {
  const currentView = useStore((state) => state.currentView);

  return (
    <DnDProvider>
      <div className="flex flex-col h-screen bg-gray-900 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          {currentView === 'root' ? <RootView /> : <FolderView />}
        </main>

        <SmartInput />
        <ToastContainer />
      </div>
    </DnDProvider>
  );
};

export default App;
