import React from 'react';
import { useStore } from '../store/useStore';
import { ChevronLeft, Settings } from 'lucide-react';

const Header: React.FC = () => {
    const { currentView, currentFolderId, items, setView } = useStore();
    const folder = items.find(i => i.id === currentFolderId);

    return (
        <header className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800 shrink-0">
            <div className="flex items-center gap-2 overflow-hidden">
                {currentView === 'folder' && (
                    <button
                        onClick={() => setView('root')}
                        className="p-1 hover:bg-gray-800 rounded transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}
                <h1 className="font-bold text-lg truncate">
                    {currentView === 'root' ? 'List Dock' : folder?.title || 'Folder'}
                </h1>
            </div>
            <div className="flex items-center gap-2">
                <button className="p-1 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white">
                    <Settings size={20} />
                </button>
            </div>
        </header>
    );
};

export default Header;
