import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ChevronLeft, Settings } from 'lucide-react';
import SettingsPopup from './SettingsPopup';

const Header: React.FC = () => {
    const { currentView, currentFolderId, items, setView, isMenuOpen } = useStore();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const folder = items.find(i => i.id === currentFolderId);

    return (
        <>
            <header className="flex items-center justify-between p-4 glass glass-bottom-only shrink-0">
                <div className="flex items-center gap-2 overflow-hidden">
                    {currentView === 'folder' && (
                        <button
                            onClick={() => !isMenuOpen && setView('root')}
                            className="p-1 hover:bg-gray-800 rounded transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <h1 className="font-bold text-lg truncate">
                        {currentView === 'root' ? 'List Dock' : folder?.title || 'Folder'}
                    </h1>
                </div>
                <div className={isMenuOpen ? "pointer-events-none opacity-50 transition-opacity" : "transition-opacity"}>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-1 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white"
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <SettingsPopup
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </>
    );
};

export default Header;
