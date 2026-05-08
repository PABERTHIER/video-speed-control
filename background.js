"use strict";

// Primary store: in-memory Map, shared across all contexts (regular + incognito)
// because the service worker runs as a single shared instance (spanning mode).
// A plain Map has no incognito/regular isolation, so it works everywhere.
//
// Fallback store: chrome.storage.session, used only when the service worker has
// been restarted and the Map is empty. This covers the trade-off of an in-memory
// Map: data survives as long as the SW is alive, and session storage fills the gap
// on restarts. Session storage failures (e.g. older browsers in private mode) are
// silently tolerated because the Map remains the source of truth.
const tabSpeeds = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getTabSpeed") {
    const tabId = sender.tab?.id ?? message.tabId;
    if (!tabId) {
      sendResponse({ speed: 1.0 });
      return false;
    }

    // Fast path: Map hit — synchronous, incognito-safe
    const cached = tabSpeeds.get(tabId);
    if (cached !== undefined) {
      sendResponse({ speed: cached });
      return false;
    }

    // Slow path: Map miss after a service worker restart → recover from session storage
    chrome.storage.session.get(`speed_${tabId}`, (data) => {
      const speed = (chrome.runtime.lastError ? undefined : data[`speed_${tabId}`]) ?? 1.0;
      tabSpeeds.set(tabId, speed); // warm the Map back up for subsequent calls
      sendResponse({ speed });
    });
    return true; // async response
  }

  if (message.type === "setTabSpeed") {
    const speed = parseFloat(message.speed);
    if (!isFinite(speed) || speed < 0.1 || speed > 16.0) {
      sendResponse({ success: false, error: "Invalid speed value" });
      return false;
    }

    // Write to Map immediately — synchronous, incognito-safe, always succeeds
    tabSpeeds.set(message.tabId, speed);
    sendResponse({ success: true });

    // Also persist to session storage as a backup for service worker restarts.
    // Fire-and-forget: failures are tolerated since the Map is the primary source.
    chrome.storage.session.set({ [`speed_${message.tabId}`]: speed });
    return false;
  }
});

// Clean up both stores when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabSpeeds.delete(tabId);
  chrome.storage.session.remove(`speed_${tabId}`);
});
