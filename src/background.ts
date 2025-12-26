// Map to track open side panels per window
const openPanels = new Map<number, chrome.runtime.Port>();

// Listen for connections from the side panel
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'sidepanel') {
        let currentWindowId: number | null = null;

        port.onMessage.addListener((msg) => {
            if (msg.type === 'INIT_SIDE_PANEL' && msg.windowId) {
                currentWindowId = msg.windowId;
                openPanels.set(currentWindowId!, port);
            }
        });

        port.onDisconnect.addListener(() => {
            if (currentWindowId !== null) {
                openPanels.delete(currentWindowId);
            }
        });
    }
});

// Handle the extension icon click to toggle the side panel
chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.windowId) return;

    const existingPort = openPanels.get(tab.windowId);

    if (existingPort) {
        // If open, tell the side panel to close itself
        try {
            existingPort.postMessage({ type: 'CLOSE_SIDE_PANEL' });
        } catch (err) {
            console.error('Error sending close message:', err);
            // If port is disconnected but still in map, clean up
            openPanels.delete(tab.windowId);
        }
    } else {
        // If closed, open it synchronously to preserve user gesture
        (chrome.sidePanel as any).open({ windowId: tab.windowId }).catch((err: any) => {
            console.error('Failed to open side panel:', err);
        });
    }
});
