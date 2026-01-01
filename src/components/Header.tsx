import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import * as LucideIcons from 'lucide-react';
import SettingsPopup from './SettingsPopup';
import ConfirmDialog from './ui/ConfirmDialog';
import FolderSettingsPopup from './FolderSettingsPopup';
import { motion, AnimatePresence } from 'framer-motion';
import { type Item } from '../types';

const Header: React.FC = () => {
    const { currentView, currentFolderId, items, setView, isMenuOpen, updateItem, deleteItem } = useStore();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showFolderSettings, setShowFolderSettings] = useState(false);
    const [isIconHovered, setIsIconHovered] = useState(false);

    const folder = items.find((i: Item) => i.id === currentFolderId);
    const [titleValue, setTitleValue] = useState('');

    // Update titleValue when folder changes
    React.useEffect(() => {
        if (folder) setTitleValue(folder.title);
    }, [folder?.id]);

    const handleUpdateTitle = () => {
        if (titleValue.trim() && folder && titleValue !== folder.title) {
            useStore.getState().pushToUndoStack(`Renamed folder "${folder.title}" to "${titleValue}"`);
            updateItem(folder.id, { title: titleValue });
        }
        setIsEditingTitle(false);
    };

    const handleDeleteFolder = () => {
        if (folder) {
            deleteItem(folder.id);
            setView('root');
        }
        setShowDeleteConfirm(false);
    };

    const IconComponent = (folder && (LucideIcons as any)[folder.icon || 'Folder']) || LucideIcons.Folder;
    const isLetterIcon = folder && (!folder.icon || folder.icon === 'Letter');
    const folderColor = folder?.color || '#a855f7';

    return (
        <>
            <header className="flex items-center justify-between p-4 glass glass-bottom-only shrink-0">
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                    {currentView === 'folder' && (
                        <button
                            onClick={() => !isMenuOpen && setView('root')}
                            className="p-1 hover:bg-white/10 rounded transition-colors shrink-0"
                        >
                            <LucideIcons.ChevronLeft size={18} />
                        </button>
                    )}
                    {currentView === 'root' ? (
                        <h1 className="font-bold text-lg truncate">List Dock</h1>
                    ) : (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {/* Folder Icon in Header */}
                            <div
                                className="shrink-0 transition-all duration-200 relative w-5 h-5 flex items-center justify-center p-0.5 cursor-pointer font-bold"
                                onMouseEnter={() => setIsIconHovered(true)}
                                onMouseLeave={() => setIsIconHovered(false)}
                                onClick={() => setShowFolderSettings(true)}
                                style={{ color: folderColor }}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={isIconHovered ? 'pen' : 'icon'}
                                        initial={{ opacity: 0, rotate: -20, scale: 0.8 }}
                                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                        exit={{ opacity: 0, rotate: 20, scale: 0.8 }}
                                        transition={{ duration: 0.15 }}
                                        className="flex items-center justify-center"
                                    >
                                        {isIconHovered ? (
                                            <LucideIcons.Edit2 size={16} />
                                        ) : isLetterIcon ? (
                                            <span className="text-[15px] leading-none uppercase">{folder?.title.charAt(0) || '?'}</span>
                                        ) : (
                                            <IconComponent size={16} />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {isEditingTitle ? (
                                <div className="flex items-center gap-1 flex-1">
                                    <input
                                        autoFocus
                                        value={titleValue}
                                        onChange={(e) => setTitleValue(e.target.value)}
                                        onBlur={handleUpdateTitle}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
                                        className="w-full bg-white/10 border-none focus:ring-1 focus:ring-purple-500 rounded px-1.5 py-0.5 text-sm font-bold outline-none"
                                    />
                                    <button onClick={handleUpdateTitle} className="text-green-500 p-1 hover:bg-white/10 rounded shrink-0">
                                        <LucideIcons.Check size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 group overflow-hidden">
                                    <h1
                                        className="font-bold text-sm truncate cursor-pointer hover:text-white transition-colors"
                                        onClick={() => setIsEditingTitle(true)}
                                    >
                                        {folder?.title || 'Folder'}
                                    </h1>
                                    <LucideIcons.Edit2
                                        size={12}
                                        className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                                        onClick={() => setIsEditingTitle(true)}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className={isMenuOpen ? "pointer-events-none opacity-50 transition-opacity" : "transition-opacity"}>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            {currentView === 'folder' && (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                    title="Delete Folder"
                                >
                                    <LucideIcons.Trash2 size={18} />
                                </button>
                            )}
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
                            >
                                <LucideIcons.Settings size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <SettingsPopup
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            {folder && (
                <>
                    <FolderSettingsPopup
                        isOpen={showFolderSettings}
                        onClose={() => setShowFolderSettings(false)}
                        folder={folder}
                    />
                    <ConfirmDialog
                        isOpen={showDeleteConfirm}
                        onClose={() => setShowDeleteConfirm(false)}
                        onConfirm={handleDeleteFolder}
                        title="Delete Folder?"
                        message={`Are you sure you want to delete "${folder.title}" and everything inside?`}
                        confirmText="Delete Folder"
                        variant="danger"
                    />
                </>
            )}
        </>
    );
};

export default Header;
