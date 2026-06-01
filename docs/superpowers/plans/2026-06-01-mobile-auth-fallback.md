# Mobile Auth Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow mobile browser and PWA users to sign in by trying popup authentication first and falling back to redirect only if popups are blocked or unsupported.

**Architecture:** Modify the mobile authentication path in the React hook to attempt `signInWithPopup`. Catch errors and conditionally run `signInWithRedirect` when popups fail.

**Tech Stack:** Firebase Auth, React, TypeScript

---

### Task 1: Update Auth Hook Login Method

**Files:**
- Modify: `src/hooks/useAuth.ts`

- [ ] **Step 1: Replace redirect-only logic for mobile with popup-then-redirect fallback**

Modify the `login` function in [useAuth.ts](file:///h:/web/00-Extensions/01-ListDock-Sidebar%20ToDo/List-Dock/src/hooks/useAuth.ts) to attempt `signInWithPopup` first and only call `signInWithRedirect` if popup auth is blocked or not supported.

Replace the following code block in [useAuth.ts](file:///h:/web/00-Extensions/01-ListDock-Sidebar%20ToDo/List-Dock/src/hooks/useAuth.ts):

```typescript
            if (isMobile) {
                // Use redirect sign-in for mobile devices/PWAs
                toast.loading('Redirecting to Google for sign-in...', { id: 'mobile-auth-loading', duration: 3000 });
                await signInWithRedirect(auth, googleProvider);
                return;
            }
```

with:

```typescript
            if (isMobile) {
                try {
                    console.log('[ListDock Auth] Attempting popup login on mobile...');
                    const result = await signInWithPopup(auth, googleProvider);
                    
                    const credential = GoogleAuthProvider.credentialFromResult(result);
                    const token = credential?.accessToken;
                    
                    if (token) {
                        setGoogleAccessToken(token);
                        setIsSyncEnabled(true);
                        console.log('[ListDock Auth] Google Access Token obtained & stored via popup on mobile');
                    }

                    toast.success('Successfully logged in!');
                    return token || undefined;
                } catch (popupError: any) {
                    console.warn('[ListDock Auth] Popup login failed on mobile, checking fallback:', popupError);
                    
                    // User cancelled the popup, do not redirect
                    if (popupError.code === 'auth/cancelled-popup-request') {
                        setIsAuthLoading(false);
                        return;
                    }

                    // Fall back to redirect if popup is blocked or unsupported in current environment
                    const isPopupBlocked = popupError.code === 'auth/popup-blocked';
                    const isUnsupported = popupError.code === 'auth/operation-not-supported-in-this-environment';
                    
                    if (isPopupBlocked || isUnsupported || isMobile) {
                        console.log('[ListDock Auth] Popup blocked or unsupported on mobile. Falling back to redirect...');
                        toast.loading('Redirecting to Google for sign-in...', { id: 'mobile-auth-loading', duration: 3000 });
                        await signInWithRedirect(auth, googleProvider);
                        return;
                    }
                    
                    throw popupError;
                }
            }
```

- [ ] **Step 2: Verify the build completes successfully**

Run: `pnpm build`
Expected: Successful compile of both Web and Extension targets with no TypeScript/ESLint errors.

- [ ] **Step 3: Commit the changes**

```bash
git add src/hooks/useAuth.ts
git commit -m "feat: attempt popup login on mobile before falling back to redirect"
```
