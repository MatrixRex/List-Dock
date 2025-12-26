import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Item, AppState } from '../types';

interface StoreState extends AppState {
    items: Item[];
    currentView: 'root' | 'folder';
    currentFolderId: string | null;
    searchQuery: string;
    undoStack: Item[][];

    // Actions
    setItems: (items: Item[]) => void;
    addItem: (item: Item) => void;
    updateItem: (id: string, updates: Partial<Item>) => void;
    deleteItem: (id: string) => void;
    setView: (view: 'root' | 'folder', folderId?: string | null) => void;
    setSearchQuery: (query: string) => void;
    undo: () => void;
    pushToUndoStack: () => void;
}

// Custom storage for chrome.storage.local
const chromeStorage = {
    getItem: (name: string): string | Promise<string | null> => {
        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get([name], (result) => {
                    resolve(result[name] ? JSON.stringify(result[name]) : null);
                });
            } else {
                resolve(localStorage.getItem(name));
            }
        });
    },
    setItem: (name: string, value: string): void | Promise<void> => {
        const parsedValue = JSON.parse(value);
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return new Promise((resolve) => {
                chrome.storage.local.set({ [name]: parsedValue.state }, () => {
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

export const useStore = create<StoreState>()(
    persist(
        (set, get) => ({
            items: [],
            currentView: 'root',
            currentFolderId: null,
            searchQuery: '',
            undoStack: [],

            setItems: (items) => set({ items }),

            addItem: (item) => {
                const { items } = get();
                get().pushToUndoStack();
                set({ items: [...items, item] });
            },

            updateItem: (id, updates) => {
                const { items } = get();
                set({
                    items: items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
                });
            },

            deleteItem: (id) => {
                const { items } = get();
                get().pushToUndoStack();

                // When deleting a folder, also delete all items inside it or move them?
                // Let's delete them for now.
                const itemToDelete = items.find(i => i.id === id);
                let newItems;
                if (itemToDelete?.type === 'folder') {
                    newItems = items.filter(i => i.id !== id && i.parent_id !== id);
                } else {
                    newItems = items.filter(i => i.id !== id);
                }

                set({ items: newItems });
            },

            setView: (view, folderId = null) => set({ currentView: view, currentFolderId: folderId }),

            setSearchQuery: (query) => set({ searchQuery: query }),

            pushToUndoStack: () => {
                const { items, undoStack } = get();
                set({ undoStack: [...undoStack.slice(-19), items] }); // Keep last 20 states
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
        }),
        {
            name: 'list-dock-storage',
            storage: createJSONStorage(() => chromeStorage),
            partialize: (state) => ({ items: state.items }), // Only persist items
        }
    )
);
