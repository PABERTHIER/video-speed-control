# ⚡ Video Speed Controller — Brave Browser Extension

A minimal, clean browser extension that lets you control the playback speed of **any HTML5 video** on any website — YouTube, Netflix, Amazon Prime Video, Facebook, and more.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![Brave Compatible](https://img.shields.io/badge/Brave-Compatible-orange)

## Features

- **Universal compatibility** — works on any website with HTML5 `<video>` elements
- **Handles multiple videos** — controls all videos on a page (great for Prime Video, Facebook, etc.)
- **Preset speed buttons** — quickly pick from 0.5×, 0.75×, 1×, 1.25×, 1.5×, 1.75×, 2×, 3×
- **Fine-tuning slider** — adjust speed from 0.25× to 4× with a smooth slider
- **± buttons** — increment/decrement speed by 0.25× steps
- **Persistent speed** — your chosen speed is saved and applied automatically on page load
- **Dynamic video detection** — detects videos loaded dynamically (SPA navigation, lazy loading)
- **Resilient** — re-applies your speed when the player tries to reset it (seek, quality change, etc.)
- **Iframe support** — works inside iframes (embedded players)
- **Dark, minimal UI** — clean popup that fits right in with Brave's aesthetic

## How to Install in Brave

Since this is an unpacked extension (not published on the Chrome Web Store), you install it in developer mode:

1. **Open Brave** and navigate to:
   ```
   brave://extensions
   ```

2. **Enable Developer mode** — toggle the switch in the top-right corner of the page

3. **Click "Load unpacked"** — the button appears in the top-left after enabling developer mode

4. **Select the extension folder** — navigate to and select the `brave-video` folder (the one containing `manifest.json`)

5. **Done!** — the ⚡ icon appears in your browser toolbar. You may need to click the puzzle piece icon (🧩) and pin the extension for easy access.

> **Tip:** The extension stays installed across browser restarts. If you update the files, click the 🔄 reload button on `brave://extensions` to apply changes.

## How to Use

1. **Navigate to any page with a video** (YouTube, Netflix, Prime Video, etc.)

2. **Click the ⚡ extension icon** in the toolbar to open the speed controller

3. **Choose your speed:**
   - Click a **preset button** (0.5× to 3×) for common speeds
   - Use the **slider** for fine control (0.25× to 4×)
   - Use the **−** / **+** buttons to adjust by 0.25× increments
   - Click **Reset to 1×** to go back to normal speed

4. The status bar at the bottom shows how many videos were detected on the page

5. **Your speed persists** — it's saved and automatically applied when you visit new pages

## Supported Sites

Works on any website that uses standard HTML5 `<video>` elements, including:

| Site | Status |
|------|--------|
| YouTube | ✅ Works |
| Netflix | ✅ Works |
| Amazon Prime Video | ✅ Works |
| Disney+ | ✅ Works |
| Facebook / Instagram videos | ✅ Works |
| Vimeo | ✅ Works |
| Twitch | ✅ Works |
| Twitter/X videos | ✅ Works |
| Any HTML5 video player | ✅ Works |

> **Note:** The extension cannot operate on browser internal pages (`brave://`, `chrome://`) or the Chrome Web Store. Sites using closed Shadow DOM or non-standard video implementations may have limited support.

## Project Structure

```
brave-video/
├── manifest.json    # Extension manifest (Manifest V3)
├── content.js       # Injected into every page — controls video speed
├── popup.html       # Extension popup UI
├── popup.css        # Popup styling
├── popup.js         # Popup logic
├── icons/
│   ├── icon16.png   # Toolbar icon
│   ├── icon48.png   # Extension page icon
│   └── icon128.png  # Store/install icon
└── README.md
```

## Technical Details

- **Manifest V3** — uses the modern extension API
- **MutationObserver** — watches for dynamically added videos (SPA sites)
- **Event-driven speed correction** — listens to `loadedmetadata`, `play`, `seeked`, and `ratechange` events to re-apply speed when players try to reset it
- **`all_frames: true`** — content script runs in all frames, including embedded iframes
- **Shadow DOM scanning** — recursively scans open shadow roots for video elements
- **`chrome.storage.local`** — persists speed preference across sessions
