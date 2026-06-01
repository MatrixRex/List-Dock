# Mobile Auth Fallback Design Spec

## Goal

Ensure users can log in to the PWA on mobile browsers (Safari, Chrome) where third-party cookies/cross-site tracking prevention block the standard Firebase `signInWithRedirect` iframe.

## Proposed Design

Attempt `signInWithPopup` first on mobile devices. If it fails due to the popup being blocked or because popups are unsupported (such as in standalone PWA mode on iOS), catch the error and fall back to `signInWithRedirect`.

## Implementation Details

### Component: Auth Hook
*   **File**: `src/hooks/useAuth.ts`
*   **Modification**:
    *   In the `login` function, if `isMobile` is true:
        1. Call `signInWithPopup(auth, googleProvider)`.
        2. If successful, store the access token and set sync to enabled.
        3. If an error is caught:
            - If code is `auth/cancelled-popup-request`, stop (user cancelled).
            - If code is `auth/popup-blocked` or `auth/operation-not-supported-in-this-environment`, call `signInWithRedirect(auth, googleProvider)`.
            - Otherwise, rethrow to be caught by the general catch block.

## Verification Plan

### Manual Verification
*   Verify login works on desktop browsers.
*   Verify login works on mobile browsers (Safari/Chrome) without staying signed out after redirect.
