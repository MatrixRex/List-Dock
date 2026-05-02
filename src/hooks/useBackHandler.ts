import { useEffect, useRef } from 'react';

type BackAction = {
  id: string;
  onBack: () => void;
};

// Global stack to track back actions across components
const backStack: BackAction[] = [];
let isPopStateProcessing = false;

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (event) => {
    if (isPopStateProcessing) return;

    // The item at the top of the stack is what we just 'left' by pressing back
    const topAction = backStack[backStack.length - 1];
    if (!topAction) return;

    // Check if we moved to the state that was active BEFORE the top action
    // If we have [A, B] and B is top, pressing back should land us on A's state.
    const newStateId = event.state?.backId || null;
    const previousStateId = backStack[backStack.length - 2]?.id || null;

    if (newStateId === previousStateId) {
      // User pressed back button - trigger the action
      backStack.pop();
      isPopStateProcessing = true;
      try {
        topAction.onBack();
      } finally {
        isPopStateProcessing = false;
      }
    }
  });
}

/**
 * Hook to handle back button navigation (hardware back on mobile/browser back).
 * When 'active' is true, it pushes a state to history.
 * When back is pressed, 'onBack' is called.
 * If 'active' becomes false manually, it automatically pops the history state.
 * 
 * @param active Whether the back handler should be active (e.g. is modal open?)
 * @param onBack Callback when back is pressed
 * @param id Unique ID for this handler (to ensure correct popping)
 */
export const useBackHandler = (active: boolean, onBack: () => void, id: string) => {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!active) return;
    
    // Only enable back handler logic on mobile devices or narrow windows
    const isMobile = window.innerWidth < 768 || window.matchMedia('(display-mode: standalone)').matches;
    if (!isMobile) return;

    // Check if this action is already in the stack to avoid duplicates
    if (backStack.some(a => a.id === id)) return;

    const action: BackAction = { 
      id, 
      onBack: () => onBackRef.current() 
    };
    
    backStack.push(action);
    window.history.pushState({ backId: id }, '');

    return () => {
      // If the component unmounts or active becomes false manually
      if (!isPopStateProcessing) {
        const index = backStack.findIndex(a => a.id === id);
        if (index !== -1) {
          // Remove from stack but DON'T trigger onBack
          backStack.splice(index, 1);
          // Go back in history to remove the state we pushed
          window.history.back();
        }
      }
    };
  }, [active, id]); // onBack is handled via ref to avoid unnecessary re-registrations
};
