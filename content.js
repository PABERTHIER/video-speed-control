(() => {
  "use strict";

  const SPEED_EVENTS = ["loadedmetadata", "play", "seeked", "ratechange"];
  const managedVideos = new WeakSet();
  let currentSpeed = 1.0;

  // Ask background for this tab's saved speed, then start
  chrome.runtime.sendMessage({ type: "getTabSpeed" }, (response) => {
    if (!chrome.runtime.lastError && response) {
      currentSpeed = response.speed ?? 1.0;
    }
    applySpeedToAll();
    observeDOM();
  });

  // Listen for speed changes from popup
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "setSpeed") {
      const speed = parseFloat(message.speed);
      if (isFinite(speed) && speed >= 0.1 && speed <= 16.0) {
        currentSpeed = speed;
        applySpeedToAll();
        sendResponse({ success: true, speed: currentSpeed });
      } else {
        sendResponse({ success: false });
      }
    } else if (message.type === "getSpeed") {
      sendResponse({ speed: currentSpeed, videoCount: findAllVideos(document).length });
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
    findAllVideos(document).forEach(applySpeedToVideo);
  }

  // Fires only when a VIDEO element (or a node containing one) is added inside a shadow root
  const shadowObserver = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        attachShadowObservers(node);
        if (!shouldScan && (node.tagName === "VIDEO" || node.querySelector?.("video"))) {
          shouldScan = true;
        }
      }
    }
    if (shouldScan) applySpeedToAll();
  });

  // Attaches shadowObserver to every open shadow root in the subtree of root,
  // including nested shadow roots, so late-created shadow roots are always tracked
  function attachShadowObservers(root) {
    const walk = (el) => {
      if (!el.shadowRoot) return;
      shadowObserver.observe(el.shadowRoot, { childList: true, subtree: true });
      el.shadowRoot.querySelectorAll("*").forEach(walk);
    };
    walk(root);
    root.querySelectorAll?.("*").forEach(walk);
  }

  function observeDOM() {
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          attachShadowObservers(node);
          if (!shouldScan && (node.tagName === "VIDEO" || node.querySelector?.("video"))) {
            shouldScan = true;
          }
        }
      }
      if (shouldScan) applySpeedToAll();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    attachShadowObservers(document);
  }

})();
