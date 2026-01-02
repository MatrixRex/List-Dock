import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Item, AppState, ItemType } from '../types';
import { toast } from 'react-hot-toast';
import React from 'react';
import UndoToast from '../components/UndoToast';

interface StoreState extends AppState {
    items: Item[];
    currentView: 'root' | 'folder';
    currentFolderId: string | null;
    searchQuery: string;
    undoStack: Item[][];
    isMenuOpen: boolean;
    showCompleted: boolean;
    hideCompletedSubtasks: boolean;
    selectedTaskIds: string[];
    persistLastFolder: boolean;

    // Actions
    setItems: (items: Item[]) => void;
    addItem: (item: Item) => void;
    updateItem: (id: string, updates: Partial<Item>) => void;
    moveItem: (id: string, newParentId: string | null, newType: ItemType, orderIndex?: number) => void;
    deleteItem: (id: string) => void;
    setView: (view: 'root' | 'folder', folderId?: string | null) => void;
    setSearchQuery: (query: string) => void;
    undo: () => void;
    pushToUndoStack: (message?: string) => void;
    setIsMenuOpen: (isOpen: boolean) => void;
    clearItems: () => void;
    setShowCompleted: (show: boolean) => void;
    setHideCompletedSubtasks: (hide: boolean) => void;
    setSelectedTaskIds: (ids: string[]) => void;
    toggleTaskSelection: (id: string, isMulti?: boolean, rangeIds?: string[]) => void;
    clearTaskSelection: () => void;
    deleteSelectedTasks: () => void;
    moveSelectedTasks: (newParentId: string | null) => void;
    moveMultipleItems: (ids: string[], newParentId: string | null, newType: ItemType, orderIndex?: number) => void;
    setPersistLastFolder: (persist: boolean) => void;
    exportItems: (includeCompleted: boolean) => void;
    importItems: (jsonData: string) => void;
    convertToFolder: (taskId: string) => void;
}

// Custom storage for chrome.storage.local
const chromeStorage = {
    getItem: (name: string): string | Promise<string | null> => {
        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get([name], (result) => {
                    const data = result[name] as any;
                    if (data) {
                        // If data is not in the {state, version} format, wrap it
                        if (data.state === undefined) {
                            resolve(JSON.stringify({ state: data, version: 0 }));
                        } else {
                            resolve(JSON.stringify(data));
                        }
                    } else {
                        resolve(null);
                    }
                });
            } else {
                resolve(localStorage.getItem(name));
            }
        });
    },
    setItem: (name: string, value: string): void | Promise<void> => {
        const data = JSON.parse(value);
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return new Promise((resolve) => {
                chrome.storage.local.set({ [name]: data }, () => {
                    resolve();
                });
            });
        } else {
            localStorage.setItem(name, value);
        }
    },
    removeItem: (name: string): void | Promise<void> => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return new Promise((resolve) => {
                chrome.storage.local.remove([name], () => {
                    resolve();
                });
            });
        } else {
            localStorage.removeItem(name);
        }
    },
};

const STORAGE_VERSION = 1;

export const useStore = create<StoreState>()(
    persist(
        (set: any, get: any) => ({
            items: [] as Item[],
            currentView: 'root' as 'root' | 'folder',
            currentFolderId: null as string | null,
            searchQuery: '',
            undoStack: [] as Item[][],
            isMenuOpen: false as boolean,
            showCompleted: false as boolean,
            hideCompletedSubtasks: true as boolean,
            selectedTaskIds: [] as string[],
            persistLastFolder: false as boolean,

            setItems: (items: Item[]) => set({ items }),

            addItem: (item: Item) => {
                const { items, selectedTaskIds } = get();

                let newItem = { ...item };

                // If multiple tasks are selected, just add as a normal task (ignore subtask logic)
                // If only one task is selected, follow subtask logic
                if (selectedTaskIds.length === 1 && item.type === 'task') {
                    const selectedTaskId = selectedTaskIds[0];
                    const selectedItem = items.find((i: Item) => i.id === selectedTaskId);
                    if (selectedItem) {
                        if (selectedItem.type === 'task') {
                            newItem.parent_id = selectedTaskId;
                            newItem.type = 'subtask';
                        } else if (selectedItem.type === 'subtask') {
                            newItem.parent_id = selectedItem.parent_id;
                            newItem.type = 'subtask';
                        }
                    }
                }

                get().pushToUndoStack(`Added ${newItem.title}`);

                // If we're adding a folder and have multiple tasks selected, move those tasks into the new folder
                let updatedItems = [...items, newItem];
                if (item.type === 'folder' && selectedTaskIds.length > 0) {
                    updatedItems = updatedItems.map(i =>
                        selectedTaskIds.includes(i.id) ? { ...i, parent_id: newItem.id, type: 'task' as ItemType } : i
                    );
                }

                set({ items: updatedItems, selectedTaskIds: [] });
            },

            updateItem: (id: string, updates: Partial<Item>) => {
                const { items, selectedTaskIds } = get();
                set({
                    items: items.map((item: Item) => (item.id === id ? { ...item, ...updates } : item)),
                    // Remove from selection if the task is completed
                    selectedTaskIds: updates.is_completed ? selectedTaskIds.filter((sid: string) => sid !== id) : selectedTaskIds,
                });
            },

            moveItem: (id: string, newParentId: string | null, newType: ItemType, orderIndex?: number) => {
                const { items, updateItem, pushToUndoStack } = get();
                const item = items.find((i: Item) => i.id === id);
                if (!item) return;

                let message = `Moved "${item.title}"`;

                if (newType === 'subtask') {
                    const parentTask = items.find((t: Item) => t.id === newParentId);
                    message = `Moved "${item.title}" as subtask of "${parentTask?.title || 'task'}"`;
                } else if (item.type === 'folder' && orderIndex !== undefined) {
                    message = `Reordered folder "${item.title}"`;
                } else if (newParentId !== item.parent_id) {
                    if (newParentId) {
                        const newFolder = items.find((f: Item) => f.id === newParentId);
                        message = `Moved "${item.title}" to "${newFolder?.title || 'folder'}" folder`;
                    } else if (item.parent_id) {
                        const oldParent = items.find((p: Item) => p.id === item.parent_id);
                        if (oldParent?.type === 'folder') {
                            message = `Moved "${item.title}" out of "${oldParent.title}"`;
                        } else {
                            message = `Moved "${item.title}" to Default List`;
                        }
                    }
                }

                pushToUndoStack(message);
                updateItem(id, {
                    parent_id: newParentId,
                    type: newType,
                    order_index: orderIndex ?? Date.now(),
                });
            },

            deleteItem: (id: string) => {
                const { items } = get();
                const itemToDelete = items.find((i: Item) => i.id === id);
                get().pushToUndoStack(`Deleted ${itemToDelete?.title || 'item'}`);

                let newItems;
                if (itemToDelete?.type === 'folder') {
                    newItems = items.filter((i: Item) => i.id !== id && i.parent_id !== id);
                } else {
                    newItems = items.filter((i: Item) => i.id !== id);
                }

                set({ items: newItems });
            },

            setView: (view: 'root' | 'folder', folderId: string | null = null) => set({
                currentView: view,
                currentFolderId: folderId,
                selectedTaskIds: []
            }),

            setSearchQuery: (query: string) => set({ searchQuery: query }),

            pushToUndoStack: (message = 'Action performed') => {
                const { items, undoStack } = get();
                set({ undoStack: [...undoStack.slice(-9), items] }); // Keep last 10 states

                toast.custom(
                    (t) =>
                        React.createElement(UndoToast, {
                            id: t.id,
                            message,
                            undo: () => get().undo(),
                            duration: 3000,
                            visible: t.visible,
                        }),
                    { duration: 3000 }
                );
            },

            undo: () => {
                const { undoStack } = get();
                if (undoStack.length === 0) {
                    toast.error('Nothing to undo', {
                        id: 'undo-empty',
                        className: 'glass-toast-standard',
                    });
                    return;
                }
                const previousState = undoStack[undoStack.length - 1];
                set({
                    items: previousState,
                    undoStack: undoStack.slice(0, -1),
                });
                toast.success('Action undone', {
                    id: 'undo-success',
                    className: 'glass-toast-standard',
                });
            },

            setIsMenuOpen: (isOpen: boolean) => set({ isMenuOpen: isOpen }),

            clearItems: () => {
                set({ items: [], undoStack: [] });
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.remove('list-dock-storage');
                } else {
                    localStorage.removeItem('list-dock-storage');
                }
                toast.success('All data cleared');
            },

            setShowCompleted: (show: boolean) => set({ showCompleted: show }),

            setHideCompletedSubtasks: (hide: boolean) => set({ hideCompletedSubtasks: hide }),

            setSelectedTaskIds: (ids: string[]) => set({ selectedTaskIds: ids }),

            toggleTaskSelection: (id: string, isMulti = false, rangeIds?: string[]) => set((state: StoreState) => {
                if (rangeIds) {
                    // Shift-click logic: toggle the entire range
                    const allInRageAlreadySelected = rangeIds.every((rid: string) => state.selectedTaskIds.includes(rid));
                    if (allInRageAlreadySelected) {
                        return { selectedTaskIds: state.selectedTaskIds.filter(sid => !rangeIds.includes(sid)) };
                    } else {
                        const newSelection = [...new Set([...state.selectedTaskIds, ...rangeIds])];
                        return { selectedTaskIds: newSelection };
                    }
                }

                if (isMulti) {
                    if (state.selectedTaskIds.includes(id)) {
                        return { selectedTaskIds: state.selectedTaskIds.filter((sid: string) => sid !== id) };
                    } else {
                        return { selectedTaskIds: [...state.selectedTaskIds, id] };
                    }
                } else {
                    if (state.selectedTaskIds.length === 1 && state.selectedTaskIds[0] === id) {
                        return { selectedTaskIds: [] };
                    } else {
                        return { selectedTaskIds: [id] };
                    }
                }
            }),

            clearTaskSelection: () => set({ selectedTaskIds: [] }),

            deleteSelectedTasks: () => {
                const { items, selectedTaskIds, pushToUndoStack } = get();
                if (selectedTaskIds.length === 0) return;

                pushToUndoStack(`Deleted ${selectedTaskIds.length} items`);

                // Get all items to delete including sub-items of folders
                const foldersToDelete = selectedTaskIds.filter((id: string) => items.find((i: Item) => i.id === id)?.type === 'folder');

                const newItems = items.filter((i: Item) => {
                    // Don't keep if it's explicitly selected
                    if (selectedTaskIds.includes(i.id)) return false;
                    // Don't keep if its parent is a folder being deleted
                    if (i.parent_id && foldersToDelete.includes(i.parent_id)) return false;
                    return true;
                });

                set({ items: newItems, selectedTaskIds: [] });
            },

            moveSelectedTasks: (newParentId: string | null) => {
                const { selectedTaskIds, moveMultipleItems } = get();
                if (selectedTaskIds.length === 0) return;
                moveMultipleItems(selectedTaskIds, newParentId, 'task');
            },

            moveMultipleItems: (ids: string[], newParentId: string | null, newType: ItemType, orderIndex?: number) => {
                const { items, pushToUndoStack } = get();
                if (ids.length === 0) return;

                let message = `Moved ${ids.length} items`;
                if (newParentId) {
                    const target = items.find((i: Item) => i.id === newParentId);
                    message = `Moved ${ids.length} items to "${target?.title || 'folder'}"`;
                }

                pushToUndoStack(message);

                const newItems = items.map((item: Item) => {
                    if (ids.includes(item.id)) {
                        return {
                            ...item,
                            parent_id: newParentId,
                            type: newType,
                            order_index: orderIndex !== undefined ? orderIndex + (Math.random() * 0.1) : Date.now() + Math.random()
                        };
                    }
                    return item;
                });

                set({ items: newItems, selectedTaskIds: [] });
            },

            setPersistLastFolder: (persist: boolean) => set({ persistLastFolder: persist }),

            exportItems: (includeCompleted: boolean) => {
                const { items } = get();
                const itemsToExport = includeCompleted ? items : items.filter((i: Item) => !i.is_completed);

                // If we're excluding completed tasks, we need to make sure we don't have dangling subtasks
                // although usually subtasks are completed if parent is. But just in case.
                const finalExport = itemsToExport;

                const dataStr = JSON.stringify(finalExport, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

                const exportFileDefaultName = `list-dock-backup-${new Date().toISOString().split('T')[0]}.json`;

                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();

                toast.success('Backup exported successfully');
            },

            importItems: (jsonData: string) => {
                try {
                    const importedItems = JSON.parse(jsonData);
                    if (!Array.isArray(importedItems)) {
                        throw new Error('Invalid format: Expected an array of items');
                    }

                    // Basic validation
                    const isValid = importedItems.every(item =>
                        item.id && item.type && item.title !== undefined
                    );

                    if (!isValid) {
                        throw new Error('Invalid format: Items missing required fields');
                    }

                    const { pushToUndoStack } = get();
                    pushToUndoStack('Imported data');

                    set({ items: importedItems });
                    toast.success(`Imported ${importedItems.length} items successfully`);
                } catch (error: any) {
                    toast.error(`Import failed: ${error.message}`);
                }
            },

            convertToFolder: (taskId: string) => {
                const { items, pushToUndoStack } = get();
                const task = items.find((i: Item) => i.id === taskId);
                if (!task || task.type !== 'task') return;

                pushToUndoStack(`Converted "${task.title}" to folder`);

                const newItems = items.map((item: Item) => {
                    if (item.id === taskId) {
                        return { ...item, type: 'folder' as ItemType, parent_id: null, is_expanded: true };
                    }
                    if (item.parent_id === taskId && item.type === 'subtask') {
                        return { ...item, type: 'task' as ItemType };
                    }
                    return item;
                });

                set({ items: newItems });
                toast.success(`"${task.title}" is now a folder`);
            },
        }),
        {
            name: 'list-dock-storage',
            storage: createJSONStorage(() => chromeStorage),
            version: STORAGE_VERSION,
            partialize: (state: StoreState) => ({
                items: state.items,
                showCompleted: state.showCompleted,
                hideCompletedSubtasks: state.hideCompletedSubtasks,
                persistLastFolder: state.persistLastFolder,
                undoStack: state.undoStack,
                // Only persist view and folder ID if the toggle is ON
                ...(state.persistLastFolder ? {
                    currentView: state.currentView,
                    currentFolderId: state.currentFolderId,
                } : {})
            }), // Persist items and settings
            migrate: (persistedState: any, version: number) => {
                if (version < STORAGE_VERSION) {
                    console.log(`Migrating storage from version ${version} to ${STORAGE_VERSION}`);

                    // Add version-specific migration steps here
                    if (version === 0) {
                        // Unversioned to v1: Ensure items array exists
                        if (persistedState && typeof persistedState === 'object') {
                            persistedState.items = persistedState.items || [];
                        }
                    }
                }
                return persistedState as StoreState;
            },
        }
    )
);
