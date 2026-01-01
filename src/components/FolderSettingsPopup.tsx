import React, { useState } from 'react';
import Modal from './ui/Modal';
import { useStore } from '../store/useStore';
import type { Item } from '../types';
import * as LucideIcons from 'lucide-react';
import { cn } from '../utils/utils';

interface FolderSettingsPopupProps {
    isOpen: boolean;
    onClose: () => void;
    folder: Item;
}

const ICONS = [
    'Letter', 'Folder', 'Hash', 'Star', 'Layout', 'List', 'Activity', 'Target', 'Shield',
    'Zap', 'Flame', 'Heart', 'Smile', 'Palette', 'Briefcase', 'GraduationCap',
    'Home', 'Coffee', 'Plane', 'Music', 'Code', 'Calendar', 'Camera', 'Gift', 'Rocket',
    'ShoppingBag', 'Clock', 'Globe', 'Lock', 'Settings'
];

const COLORS = [
    '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981',
    '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#f43f5e', '#ec4899',
    '#d946ef', '#64748b', '#94a3b8', '#ffffff'
];

const FolderSettingsPopup: React.FC<FolderSettingsPopupProps> = ({ isOpen, onClose, folder }) => {
    const { updateItem } = useStore();
    const [title, setTitle] = useState(folder.title);
    const [selectedColor, setSelectedColor] = useState(folder.color || COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState(folder.icon || 'Letter');

    const handleSave = () => {
        const { pushToUndoStack } = useStore.getState();
        pushToUndoStack(`Modified folder "${folder.title}"`);
        updateItem(folder.id, {
            title: title.trim(),
            color: selectedColor,
            icon: selectedIcon
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Folder Settings">
            <div className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Name</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-purple-500 outline-none transition-all focus:bg-white/10"
                        placeholder="Folder Name"
                    />
                </div>

                {/* Color */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Color</label>
                    <div className="grid grid-cols-10 gap-1.5 p-1">
                        {COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className={cn(
                                    "h-5 w-5 rounded-full transition-all hover:scale-125",
                                    selectedColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110" : "opacity-60 hover:opacity-100"
                                )}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                {/* Icons */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Icon</label>
                    <div className="grid grid-cols-6 gap-2">
                        {ICONS.map(iconName => {
                            const IconComponent = (LucideIcons as any)[iconName];
                            const isInitial = iconName === 'Letter';

                            return (
                                <button
                                    key={iconName}
                                    onClick={() => setSelectedIcon(iconName)}
                                    className={cn(
                                        "p-2 rounded-lg bg-white/5 border transition-all hover:bg-white/10 flex items-center justify-center font-bold",
                                        selectedIcon === iconName ? "border-purple-500 text-purple-400" : "border-white/5 text-gray-400"
                                    )}
                                    title={iconName}
                                >
                                    {isInitial ? (
                                        <span className="text-xs leading-none uppercase">{title.charAt(0) || '?'}</span>
                                    ) : (
                                        IconComponent && <IconComponent size={18} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        onClick={handleSave}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-[0.98]"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default FolderSettingsPopup;
