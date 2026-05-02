# Findings & Decisions

## Requirements
- PWA transformation for mobile/desktop web usage.
- Cross-platform data sync via Google Drive.
- Responsive UI that adapts to Extension sidepanel, Mobile PWA, and Desktop Web.
- Firebase Auth for secure identity management.

## Research Findings
- `vite-plugin-pwa` can handle dual-build configurations for Extensions and PWAs if configured correctly.
- Google Drive `drive.file` scope allows app to only access files it creates, improving security.
- CRDT-based merging is necessary for offline-first sync stability.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Zustand for State Management | Lightweight, easy to integrate with local storage and sync logic. |
| Firebase Auth | Robust, easy Google OAuth integration, handles cross-device sessions well. |
| GitHub Pages for Web Deployment | Simple, free, integrates with existing GitHub workflow. |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Development Port Conflicts | Identified and terminated processes on port 3102. |
| Extension vs PWA Build configuration | Used environment variables and conditional logic in `vite.config.ts`. |

## Resources
- Project Root: `h:\web\00-Extensions\01-ListDock-Sidebar ToDo\List-Dock`
- Active Development Plan: [task_plan.md](file:///h:/web/00-Extensions/01-ListDock-Sidebar%20ToDo/List-Dock/task_plan.md)
- Development Phases (Legacy): [DEVELOPMENT_PHASES.md](file:///h:/web/00-Extensions/01-ListDock-Sidebar%20ToDo/List-Dock/DEVELOPMENT_PHASES.md)

## Visual/Browser Findings
- LayoutSwitcher correctly handles viewport changes in local testing (Vite dev server).
- SidebarLayout provides the narrow-vertical view for the extension.
