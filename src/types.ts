export type ItemType = 'folder' | 'task' | 'subtask';

export interface Item {
    id: string;          // UUID
    type: ItemType;
    title: string;
    is_completed: boolean;
    parent_id: string | null; // NULL for Root Default List or if folder is at root
    order_index: number;
    is_expanded: boolean; // For accordion state
    created_at: number;
}

export interface AppState {
    items: Item[];
    currentView: 'root' | 'folder';
    currentFolderId: string | null;
    searchQuery: string;
}
