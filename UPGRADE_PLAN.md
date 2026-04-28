# ListDock PWA & Cloud Sync Upgrade Plan

## 1. Core Architecture
- **Dual-Platform Build**: A single codebase using Vite to output both a Chrome Extension (via `crxjs`) and a PWA (via `vite-plugin-pwa`).
- **Storage Strategy**: "Local-First" approach.
    - **Guest Mode**: All data is stored in browser `IndexedDB` (via Zustand Persist). No account required.
    - **Cloud Mode**: Once signed in, data is synced to the user's personal **Google Drive**.
- **Data Structure**: **File-per-List**. Each list is a `.json` file in a dedicated `ListDock` folder.

## 2. Authentication (Hybrid Approach)
- **Auth Provider**: Use **Firebase Auth** as the primary identity manager (Google Provider).
- **Drive Integration**: 
    - Firebase handles the Google OAuth 2.0 flow.
    - Extract the `accessToken` from the Firebase User object to authorize Google Drive API calls.
- **Benefits**: Easier session management; no need to manually handle OAuth popups/redirects.

## 3. Synchronization & CRDTs
- **Conflict Resolution**: Use a JSON-based CRDT (Last Writer Wins with timestamps) for every task property.
- **Offline Sync**: 
    - Changes are saved to local storage instantly.
    - Pending changes are queued in a `syncQueue`.
    - Sync triggers on: Login, Re-connect, App Focus, and manual refresh.
- **Polling**: "Poll on Focus" strategy to detect remote changes in shared lists.

## 4. Sharing & Collaboration
- **Method**: Native Google Drive Permissions API.
- **Owner**: Manages permissions (Add/Remove collaborator email).
- **Collaborator**: Discovers shared files via `sharedWithMe` search query.
- **Inter-file Moves**: Moving a task between lists uses a "Copy to Destination + Delete from Source" logic.

## 5. Responsive Layout Strategy
The app will detect its environment (Extension vs. Mobile PWA vs. Desktop Web) and switch shells:
- **Extension (Sidebar)**: Width-constrained (300-400px). Focuses on a single list with minimal navigation.
- **Mobile (PWA)**: Touch-optimized. Bottom navigation bar for Folders, Settings, and Sync status. Large FAB (Floating Action Button) for adding tasks.
- **Desktop (Web)**: Multi-column "Bento" layout. Left panel for list navigation, Center for active tasks, Right panel for task details/notes.

## 6. Implementation Roadmap
1.  **PWA Setup**: Add `vite-plugin-pwa` and configure Service Worker for offline app loading.
2.  **Auth Integration**: Implement Firebase Auth with Google Provider (requesting `drive.file` scope).
3.  **Drive Service**: Build the wrapper to Create, Read, and Search for `.json` list files.
4.  **Sync Engine**: Modify Zustand store to handle the "Guest-to-Cloud" migration and background syncing.
5.  **Multi-Layout Shell**: Implement the responsive shell that switches between Sidebar, Mobile, and Desktop views.
6.  **Sharing UI**: Add "Share List" button and permission management modal.
