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

  // Initialize: load stored speed
  chrome.storage.local.get("playbackSpeed", (data) => {
    if (data.playbackSpeed) {
      currentSpeed = data.playbackSpeed;
    }
    updateUI();
    queryCurrentTab();
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

  function setSpeed(speed) {
    currentSpeed = clamp(Math.round(speed * 100) / 100, 0.25, 4.0);
    updateUI();

    chrome.storage.local.set({ playbackSpeed: currentSpeed });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) {
        showStatus("No active tab", "error");
        return;
      }
      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "setSpeed", speed: currentSpeed },
        (response) => {
          if (chrome.runtime.lastError) {
            showStatus("No video found on this page", "error");
            return;
          }
          if (response?.success) {
            showStatus(`Speed set to ${formatSpeed(currentSpeed)}×`, "success");
          }
        }
      );
    });
  }

  function queryCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) return;
      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "getSpeed" },
        (response) => {
          if (chrome.runtime.lastError) {
            showStatus("No video found on this page", "error");
            return;
          }
          if (response) {
            const count = response.videoCount || 0;
            if (count > 0) {
              showStatus(`${count} video${count > 1 ? "s" : ""} detected`, "success");
            } else {
              showStatus("No video found on this page", "");
            }
          }
        }
      );
    });
  }

  function showStatus(text, type) {
    status.textContent = text;
    status.className = "status" + (type ? ` ${type}` : "");
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // Event listeners
  slider.addEventListener("input", () => {
    setSpeed(parseFloat(slider.value));
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
