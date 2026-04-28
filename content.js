(() => {
  "use strict";

  const SPEED_EVENTS = ["loadedmetadata", "play", "seeked", "ratechange"];
  const managedVideos = new WeakSet();
  let currentSpeed = 1.0;

  // Load saved speed on startup
  chrome.storage.local.get("playbackSpeed", (data) => {
    if (data.playbackSpeed) {
      currentSpeed = data.playbackSpeed;
    }
    scanAndApply();
    observeDOM();
  });

  // Listen for speed changes from popup
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "setSpeed") {
      currentSpeed = message.speed;
      applySpeedToAll();
      sendResponse({ success: true, speed: currentSpeed });
    } else if (message.type === "getSpeed") {
      const videos = findAllVideos(document);
      sendResponse({ speed: currentSpeed, videoCount: videos.length });
    }
    return true;
  });

  function applySpeedToVideo(video) {
    if (video.playbackRate !== currentSpeed) {
      video.playbackRate = currentSpeed;
    }

    if (managedVideos.has(video)) return;
    managedVideos.add(video);

    const handler = () => {
      if (video.playbackRate !== currentSpeed) {
        video.playbackRate = currentSpeed;
      }
    };

    for (const evt of SPEED_EVENTS) {
      video.addEventListener(evt, handler);
    }
  }

  function findAllVideos(root) {
    const videos = [...root.querySelectorAll("video")];

    // Scan open shadow roots
    const scanShadow = (node) => {
      if (node.shadowRoot) {
        videos.push(...node.shadowRoot.querySelectorAll("video"));
        node.shadowRoot.querySelectorAll("*").forEach(scanShadow);
      }
    };
    root.querySelectorAll("*").forEach(scanShadow);

    return videos;
  }

  function applySpeedToAll() {
    const videos = findAllVideos(document);
    videos.forEach(applySpeedToVideo);
  }

  function scanAndApply() {
    applySpeedToAll();
  }

  function observeDOM() {
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          if (node.tagName === "VIDEO" || node.querySelector?.("video")) {
            shouldScan = true;
            break;
          }
        }
        if (shouldScan) break;
      }
      if (shouldScan) {
        applySpeedToAll();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    // Also observe shadow roots when they appear
    const shadowObserver = new MutationObserver(() => {
      applySpeedToAll();
    });

    const observeShadowRoots = (root) => {
      root.querySelectorAll("*").forEach((el) => {
        if (el.shadowRoot) {
          shadowObserver.observe(el.shadowRoot, {
            childList: true,
            subtree: true,
          });
        }
      });
    };

    observeShadowRoots(document);
  }

  // Listen for storage changes (speed changed from another tab/frame)
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.playbackSpeed) {
      currentSpeed = changes.playbackSpeed.newValue;
      applySpeedToAll();
    }
  });
})();
