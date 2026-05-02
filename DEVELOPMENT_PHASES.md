# ListDock Development Phases (Waterfall Execution)

This document outlines the step-by-step execution plan for the PWA and Cloud Sync upgrade. Each phase must be completed, tested, and verified before moving to the next.

---

## Phase 1: PWA Foundation & Platform Awareness
**Goal**: Transform the existing code into a PWA and enable platform detection.

1.  **[x] Dependencies**: Install `vite-plugin-pwa`.
2.  **[x] Configuration**: 
    - Configure `vite.config.ts` to support both CRXJS (Extension) and PWA builds.
    - Generate PWA icons and `manifest.webmanifest`.
3.  **[x] Platform Hook**: Create `usePlatform.ts` to detect `isExtension`, `isMobilePWA`, or `isDesktopWeb`.
4.  **[x] Deployment**: Set up a CI/CD pipeline (GitHub Actions) to deploy the web version to GitHub Pages.
5.  **[ ] Testing**: Verify the app can be "installed" on mobile and desktop from the web URL.

---

## Phase 2: Responsive Shell & UI Adaptivity
**Goal**: Implement the three distinct layouts without touching data logic yet.

1.  **[x] App Shell**: Create a top-level `LayoutSwitcher` component.
2.  **[x] Layouts**: 
    - **SidebarLayout**: Current narrow-width vertical view.
    - **MobileLayout**: Bottom navigation (Lists, Settings, Account).
    - **DesktopLayout**: Three-column dashboard (Nav | Active List | Task Details).
3.  **[x] Navigation**: Implement a responsive navigation system that switches from a Sidebar (Desktop) to a Bottom Bar (Mobile).
4.  **[ ] Testing**: Use Browser DevTools to verify layout switching at different breakpoints and in the extension side panel.

---

## Phase 3: Identity & Authentication
**Goal**: Secure user login and retrieval of Google Drive tokens.

1.  **[ ] Firebase Setup**: Initialize Firebase Auth in the project.
2.  **[ ] Google OAuth**: Configure the Google Provider with the `drive.file` scope.
3.  **[ ] Auth UI**: 
    - Add an "Account" section in Settings.
    - Implement Login/Logout buttons.
    - Display user profile info (name/email).
4.  **[ ] Token Management**: Create an internal service to securely store and refresh the Google `accessToken`.
5.  **[ ] Testing**: Verify login works across both the Extension and the PWA.

---

## Phase 4: Google Drive Service Layer
**Goal**: Enable the app to talk to the user's cloud storage.

1.  **[ ] Drive Wrapper**: Create a `driveApi.ts` service with functions for:
    - `findOrCreateAppFolder()`
    - `getFiles()` / `createFile()`
    - `updateFile()` (JSON content)
2.  **[ ] File-per-List Logic**: Map each List in the current store to a unique File ID in Drive.
3.  **[ ] Discovery**: Implement a "Sync Search" that finds files shared with the user.
4.  **[ ] Testing**: Verify files are correctly created and updated in the user's Google Drive (hidden App Data folder).

---

## Phase 5: Sync Engine & CRDTs
**Goal**: Implement the "Local-First" background synchronization.

1.  **[ ] Zustand Update**:
    - Add `syncQueue` to store pending changes.
    - Add `lastSynced` timestamps to all items.
2.  **[ ] CRDT Logic**: Implement a "Merge" function that compares local vs. remote JSON using timestamps.
3.  **[ ] Migration Wizard**: Create a UI prompt for Guest users to "Upload existing data to Cloud" after their first login.
4.  **[ ] Sync Worker**: Implement the background logic that triggers sync on window focus and network reconnect.
5.  **[ ] Testing**: Simulate offline mode on mobile, make edits, go online, and verify sync on the desktop extension.

---

## Phase 6: Sharing & Collaboration
**Goal**: Finalize the "Native Sharing" features.

1.  **[ ] Permissions API**: Implement functions to add/remove users by email.
2.  **[ ] Share UI**: Add a "Share" button to list headers and a modal to manage collaborators.
3.  **[ ] Cross-List Moves**: Implement the "Move Task to List" logic for shared vs. private lists.
4.  **[ ] Polish**: Final UI tweaks for sync status indicators (Spinning icons, "Last synced" text).
5.  **[ ] Verification**: Final cross-device test (User A on PC Extension shares with User B on Mobile PWA).
