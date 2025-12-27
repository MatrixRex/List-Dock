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
    'Folder', 'Hash', 'Star', 'Layout', 'List', 'Activity', 'Target', 'Shield',
    'Zap', 'Flame', 'Heart', 'Smile', 'Palette', 'Briefcase', 'GraduationCap',
    'Home', 'Coffee', 'Plane', 'Music', 'Code', 'Calendar', 'Camera', 'Gift', 'Rocket'
];

const COLORS = [
    '#a855f7', // Purple (Default)
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
];

const FolderSettingsPopup: React.FC<FolderSettingsPopupProps> = ({ isOpen, onClose, folder }) => {
    const { updateItem } = useStore();
    const [title, setTitle] = useState(folder.title);
    const [selectedColor, setSelectedColor] = useState(folder.color || COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState(folder.icon || 'Folder');

    const handleSave = () => {
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
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Name</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                        placeholder="Folder Name"
                    />
                </div>

                {/* Color */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Color</label>
                    <div className="grid grid-cols-4 gap-2">
                        {COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className={cn(
                                    "h-8 rounded-lg transition-all",
                                    selectedColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900" : "opacity-60 hover:opacity-100"
                                )}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                {/* Icons */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Icon</label>
                    <div className="grid grid-cols-6 gap-2">
                        {ICONS.map(iconName => {
                            const IconComponent = (LucideIcons as any)[iconName];
                            return (
                                <button
                                    key={iconName}
                                    onClick={() => setSelectedIcon(iconName)}
                                    className={cn(
                                        "p-2 rounded-lg bg-white/5 border transition-all hover:bg-white/10",
                                        selectedIcon === iconName ? "border-purple-500 text-purple-400" : "border-white/5 text-gray-400"
                                    )}
                                >
                                    {IconComponent && <IconComponent size={18} />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        onClick={handleSave}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-500/20"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default FolderSettingsPopup;
