# Task Plan: PWA and Cloud Sync Upgrade

## Goal
Transform ListDock into a PWA with cross-instance data synchronization using Google Drive as the storage backend.

## Current Phase
Phase 6: Sharing & Collaboration

## Phases

### Phase 1: Foundation & Platform Awareness
- [x] Install `vite-plugin-pwa` dependencies
- [x] Configure `vite.config.ts` for Extension and PWA builds
- [x] Create `usePlatform.ts` hook for platform detection
- [x] Set up CI/CD for web deployment
- [x] Verify PWA installation on mobile/desktop
- **Status:** done

### Phase 2: Responsive Shell & UI Adaptivity
- [x] Create `LayoutSwitcher` component
- [x] Implement Sidebar, Mobile, and Desktop layouts
- [x] Responsive navigation system (Bottom Bar for mobile)
- [x] Verify layout switching via DevTools
- **Status:** done

### Phase 3: Identity & Authentication
- [x] Initialize Firebase Auth
- [x] Configure Google OAuth (drive.file scope)
- [x] Implement Account section and Login/Logout UI
- [x] Secure token management service
- [x] Verify auth cross-device
- **Status:** done

### Phase 4: Google Drive Service Layer
- [x] Create `driveApi.ts` wrapper (REST endpoints for search/read/create/update)
- [x] Map Lists to Drive files (`list-dock-sync.json` schema)
- [x] Implement Sync Search for shared files
- [x] Verify file creation/updates in Drive
- **Status:** done

### Phase 5: Sync Engine & CRDTs
- [x] Update Zustand store (deletedItems tombstone log, timestamps, autoSync trigger)
- [x] Implement CRDT Merge logic (LWW-Element-Set with parent-child safety loops)
- [x] PWA-to-Extension Secure Auth Bridge (externally_connectable messaging)
- [x] Background Sync Worker & Silent Re-auth (native extension identity + GIS environment guards)
- [x] Verify sync under network/offline conditions
- **Status:** done

### Phase 6: Sharing & Collaboration
- [ ] Permissions API for shared lists
- [ ] Share UI and Collaborator management
- [ ] Cross-List task movement logic
- [ ] UI Polish and Sync indicators
- [ ] Final cross-device verification
- **Status:** pending

## Key Questions
1. How will the Google Drive App Data folder be managed across different sessions? (Use `drive.file` scope and app-specific folder)
2. What is the conflict resolution strategy for concurrent edits? (Last Write Wins using timestamps in CRDT-like merge)

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Google Drive (app-specific folder) | Free, user-owned storage; minimizes privacy concerns; fits PWA/Extension hybrid model |
| vite-plugin-pwa | Simplest way to add PWA capabilities to Vite-based project |
| layout-based responsive UI | Ensures optimal UX across Extension sidepanel, Mobile PWA, and Desktop Web |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| Port 3102 conflict | 1 | (Resolved in previous session) |
| Babel "Unexpected token" in SettingsPopup.tsx | 1 | (Resolved in previous session) |

## Notes
- Incorporating existing progress from DEVELOPMENT_PHASES.md.
- Phase 1 & 2 are mostly done; focus is moving towards Authentication (Phase 3).
