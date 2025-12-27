import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Item, AppState } from '../types';
import { toast } from 'sonner';
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

    // Actions
    setItems: (items: Item[]) => void;
    addItem: (item: Item) => void;
    updateItem: (id: string, updates: Partial<Item>) => void;
    moveItem: (id: string, newParentId: string | null, newType: 'task' | 'subtask', orderIndex?: number) => void;
    deleteItem: (id: string) => void;
    setView: (view: 'root' | 'folder', folderId?: string | null) => void;
    setSearchQuery: (query: string) => void;
    undo: () => void;
    pushToUndoStack: (message?: string) => void;
    setIsMenuOpen: (isOpen: boolean) => void;
    clearItems: () => void;
    setShowCompleted: (show: boolean) => void;
    setHideCompletedSubtasks: (hide: boolean) => void;
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
        (set, get) => ({
            items: [],
            currentView: 'root',
            currentFolderId: null,
            searchQuery: '',
            undoStack: [],
            isMenuOpen: false,
            showCompleted: false,
            hideCompletedSubtasks: true,

            setItems: (items) => set({ items }),

            addItem: (item) => {
                const { items } = get();
                get().pushToUndoStack(`Added ${item.title}`);
                set({ items: [...items, item] });
            },

            updateItem: (id, updates) => {
                const { items } = get();
                set({
                    items: items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
                });
            },

            moveItem: (id, newParentId, newType, orderIndex) => {
                const { items, updateItem, pushToUndoStack } = get();
                const item = items.find((i) => i.id === id);
                if (!item) return;

                const oldParentId = item.parent_id;
                let message = `Moved "${item.title}"`;

                if (newType === 'subtask') {
                    const parentTask = items.find((t) => t.id === newParentId);
                    message = `Moved "${item.title}" as subtask of "${parentTask?.title || 'task'}"`;
                } else if (newParentId !== oldParentId) {
                    if (newParentId) {
                        const newFolder = items.find((f) => f.id === newParentId);
                        message = `Moved "${item.title}" to "${newFolder?.title || 'folder'}" folder`;
                    } else if (oldParentId) {
                        const oldParent = items.find((p) => p.id === oldParentId);
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

            deleteItem: (id) => {
                const { items } = get();
                const itemToDelete = items.find((i) => i.id === id);
                get().pushToUndoStack(`Deleted ${itemToDelete?.title || 'item'}`);

                let newItems;
                if (itemToDelete?.type === 'folder') {
                    newItems = items.filter((i) => i.id !== id && i.parent_id !== id);
                } else {
                    newItems = items.filter((i) => i.id !== id);
                }

                set({ items: newItems });
            },

            setView: (view, folderId = null) => set({ currentView: view, currentFolderId: folderId }),

            setSearchQuery: (query) => set({ searchQuery: query }),

            pushToUndoStack: (message = 'Action performed') => {
                const { items, undoStack } = get();
                set({ undoStack: [...undoStack.slice(-19), items] }); // Keep last 20 states

                toast.custom(
                    (id) =>
                        React.createElement(UndoToast, {
                            id,
                            message,
                            undo: () => get().undo(),
                            duration: 5000,
                        }),
                    { duration: 5000, unstyled: true }
                );
            },

            undo: () => {
                const { undoStack } = get();
                if (undoStack.length === 0) return;
                const previousState = undoStack[undoStack.length - 1];
                set({
                    items: previousState,
                    undoStack: undoStack.slice(0, -1),
                });
            },

            setIsMenuOpen: (isOpen) => set({ isMenuOpen: isOpen }),

            clearItems: () => {
                set({ items: [], undoStack: [] });
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.remove('list-dock-storage');
                } else {
                    localStorage.removeItem('list-dock-storage');
                }
                toast.success('All data cleared');
            },

            setShowCompleted: (show) => set({ showCompleted: show }),

            setHideCompletedSubtasks: (hide) => set({ hideCompletedSubtasks: hide }),
        }),
        {
            name: 'list-dock-storage',
            storage: createJSONStorage(() => chromeStorage),
            version: STORAGE_VERSION,
            partialize: (state) => ({
                items: state.items,
                showCompleted: state.showCompleted,
                hideCompletedSubtasks: state.hideCompletedSubtasks
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
