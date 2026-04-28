"use strict";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getTabSpeed") {
    const tabId = sender.tab?.id ?? message.tabId;
    if (!tabId) {
      sendResponse({ speed: 1.0 });
      return false;
    }
    chrome.storage.session.get(`speed_${tabId}`, (data) => {
      if (chrome.runtime.lastError) {
        sendResponse({ speed: 1.0 });
        return;
      }
      sendResponse({ speed: data[`speed_${tabId}`] ?? 1.0 });
    });
    return true;
  }

  if (message.type === "setTabSpeed") {
    const speed = parseFloat(message.speed);
    if (!isFinite(speed) || speed < 0.1 || speed > 16.0) {
      sendResponse({ success: false, error: "Invalid speed value" });
      return false;
    }
    chrome.storage.session.set({ [`speed_${message.tabId}`]: speed }, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true });
      }
    });
    return true;
  }
});

// Clean up stored speed when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove(`speed_${tabId}`);
});
