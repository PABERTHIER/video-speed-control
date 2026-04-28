(() => {
  "use strict";

  const speedValue = document.getElementById("speed-value");
  const slider = document.getElementById("speed-slider");
  const btnMinus = document.getElementById("btn-minus");
  const btnPlus = document.getElementById("btn-plus");
  const btnReset = document.getElementById("btn-reset");
  const presets = document.querySelectorAll(".preset");
  const status = document.getElementById("status");

  let currentSpeed = 1.0;
  let currentTabId = null;
  let sliderTimeout = null;

  // Initialize: cache tab ID once, then read current speed + video count from content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    currentTabId = tabs[0]?.id ?? null;
    if (!currentTabId) {
      updateUI();
      return;
    }
    chrome.tabs.sendMessage(currentTabId, { type: "getSpeed" }, (response) => {
      if (chrome.runtime.lastError || !response) {
        showStatus("No video found on this page", "error");
        updateUI();
        return;
      }
      currentSpeed = response.speed ?? 1.0;
      updateUI();
      const count = response.videoCount || 0;
      if (count > 0) {
        showStatus(`${count} video${count > 1 ? "s" : ""} detected`, "success");
      } else {
        showStatus("No video found on this page", "");
      }
    });
  });

  function updateUI() {
    speedValue.textContent = formatSpeed(currentSpeed);
    slider.value = currentSpeed;

    presets.forEach((btn) => {
      const s = parseFloat(btn.dataset.speed);
      btn.classList.toggle("active", Math.abs(s - currentSpeed) < 0.01);
    });
  }

  function formatSpeed(speed) {
    // Show one decimal for clean values, two otherwise
    const rounded = Math.round(speed * 100) / 100;
    if (rounded % 1 === 0) return rounded.toFixed(1);
    if ((rounded * 10) % 1 === 0) return rounded.toFixed(1);
    return rounded.toFixed(2);
  }

  function normalizeSpeed(speed) {
    return clamp(Math.round(speed * 100) / 100, 0.1, 16.0);
  }

  function flushSpeedToTab() {
    if (!currentTabId) {
      showStatus("No active tab", "error");
      return;
    }
    // Send setTabSpeed synchronously (no async dependency) so it always fires
    // even if the popup closes immediately after the user interaction
    chrome.runtime.sendMessage({ type: "setTabSpeed", tabId: currentTabId, speed: currentSpeed });
    chrome.tabs.sendMessage(
      currentTabId,
      { type: "setSpeed", speed: currentSpeed },
      (response) => {
        if (chrome.runtime.lastError) {
          showStatus("No video found on this page", "error");
          return;
        }
        if (response?.success) {
          showStatus(`Speed set to ${formatSpeed(currentSpeed)}x`, "success");
        }
      }
    );
  }

  function setSpeed(speed) {
    currentSpeed = normalizeSpeed(speed);
    updateUI();
    flushSpeedToTab();
  }

  function showStatus(text, type) {
    status.textContent = text;
    status.className = "status" + (type ? ` ${type}` : "");
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // Event listeners
  // Slider: UI updates immediately; IPC is throttled to avoid flooding the message bus
  slider.addEventListener("input", () => {
    currentSpeed = normalizeSpeed(parseFloat(slider.value));
    updateUI();
    clearTimeout(sliderTimeout);
    sliderTimeout = setTimeout(flushSpeedToTab, 50);
  });

  slider.addEventListener("change", () => {
    clearTimeout(sliderTimeout);
    flushSpeedToTab();
  });

  btnMinus.addEventListener("click", () => {
    setSpeed(currentSpeed - 0.25);
  });

  btnPlus.addEventListener("click", () => {
    setSpeed(currentSpeed + 0.25);
  });

  btnReset.addEventListener("click", () => {
    setSpeed(1.0);
  });

  presets.forEach((btn) => {
    btn.addEventListener("click", () => {
      setSpeed(parseFloat(btn.dataset.speed));
    });
  });
})();
