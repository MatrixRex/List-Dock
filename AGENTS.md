# List Dock — Agent Guide

## Build targets (dual)

`VITE_BUILD_TARGET` env var switches between Chrome Extension and PWA:

| Command | Target | Output | Notes |
|---------|--------|--------|-------|
| `pnpm dev` | Web (PWA) | dev server :3102 | `--host` enabled, CORS open |
| `pnpm dev:extension` | Chrome Extension | CRXJS dev reload | HMR for side panel |
| `pnpm dev:web` | Web (PWA) | same as `pnpm dev` | explicit alias |
| `pnpm build` | Both | `dist-web/` + `dist-extension/` | runs `tsc -b` first |
| `pnpm build:extension` | Extension only | `dist-extension/` | |
| `pnpm build:web` | Web only | `dist-web/` | |

## Dev workflow

```bash
pnpm install        # uses pnpm (not npm/yarn)
pnpm dev:extension  # for Chrome side panel
pnpm lint           # ESLint flat config (ts, tsx only)
```

- No test framework — no vitest, jest, or playwright configured.
- `tailwind.config.js` is **stale** — Tailwind CSS v4 config is in `src/index.css` via `@theme` directives.

## TypeScript quirks

Config `tsconfig.app.json` enables non-obvious strict flags:

- `verbatimModuleSyntax` — must use `import type` for type-only imports (already standard in codebase).
- `erasableSyntaxOnly` — no enums; use `const` objects + `as const` or union types instead.
- `noUnusedLocals`, `noUnusedParameters` — both `true`.

## Architecture

| Layer | Location | Detail |
|-------|----------|--------|
| Entry (React) | `src/main.tsx` → `App.tsx` | Mounts `#root` |
| Entry (SW) | `src/background.ts` | Chrome service worker, side panel toggle |
| State | `src/store/useStore.ts` | Zustand with `persist` middleware |
| Storage | Zustand persist | `chrome.storage.local` in extension, `localStorage` fallback in web |
| DnD | `src/store/DnDProvider.tsx` + `src/hooks/useDnD.ts` | Custom implementation (no dnd-kit) |
| Auth | `src/lib/firebase.ts` + `src/hooks/useAuth.ts` | Firebase auth, env vars required |
| CSS | `src/index.css` | Tailwind v4 `@import "tailwindcss"` + custom `@theme` tokens + glass utilities |
| Styling helper | `src/utils/utils.ts` | `cn()` via clsx + tailwind-merge |

Storage key: `list-dock-storage` (with versioned migration in Zustand persist).

## Release

1. `pnpm release` — interactive wizard (bumps version in `package.json` + `manifest.json`, commits, tags, pushes).
2. GitHub Action on `v*` tag: runs `pnpm build`, zips `dist-extension/`, creates release.

PWA auto-deploys to GitHub Pages on pushes to `main`.

## Firebase

Auth requires `.env` with these vars (copy `.env.example`):
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

`.env` is gitignored but the dev file exists with live values.

## Design

- Font: Space Mono (loaded from Google Fonts via `index.html`)
- Glassmorphism UI: `glass`, `glass-bottom-only`, `glass-top-only` utility classes in `index.css`
- Lightweight icon: Lucide React
- Annotations: Framer Motion
