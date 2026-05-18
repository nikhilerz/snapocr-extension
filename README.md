# SnapOCR — Chrome Extension

> **Extract text from any area on your screen with one click.**  
> No more screenshots → ChatGPT → copy → paste. Just drag and it's in your clipboard.

![SnapOCR Demo](https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome) ![Manifest V3](https://img.shields.io/badge/Manifest-V3-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🚀 The Problem It Solves

When watching YouTube tutorials or coding videos, creators often show code, prompts, or data on screen **without sharing it in the description**. The old workflow was painfully slow:

1. Take a screenshot
2. Save it
3. Open ChatGPT or Claude
4. Upload the image
5. Type a prompt
6. Copy the result

**SnapOCR reduces this to 2 steps:**
1. Click the extension icon (or press `Ctrl+Shift+S`)
2. Drag over the text → **instantly copied to clipboard** ✅

---

## ✨ Features

- 🖱️ **Click-to-snip** — click the extension icon, drag to select any area
- ⌨️ **Keyboard shortcut** — `Ctrl+Shift+S` (configurable)
- 📋 **Auto-copy** — extracted text goes straight to your clipboard
- 🎯 **Any webpage** — works on YouTube, docs, articles, code editors
- 💡 **Minimal UI** — clean toast notifications, no clutter

---

## 🛠️ Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Extension Framework | Chrome Manifest V3 | Modern, secure extension standard |
| Screen Capture | `chrome.tabs.captureVisibleTab` | Native API, no permissions popup |
| Image Cropping | HTML5 Canvas API | Client-side, instant, no upload needed |
| OCR Engine | [OCR.space API](https://ocr.space) | Fast, accurate, free tier available |
| UI | Vanilla JS + CSS | Zero dependencies, lightweight |

---

## 📁 Project Structure

```
ocr-extension/
├── manifest.json       # Extension config, permissions, shortcuts
├── background.js       # Service worker — captures screen, calls OCR API
├── content.js          # Injected into pages — overlay UI + image crop
├── content.css         # Overlay and toast notification styles
├── popup.html          # (Legacy — no longer used as popup)
└── libs/               # (Optional) Local library files
```

---

## 🔧 Installation (Developer Mode)

1. Clone this repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/snapocr-extension.git
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable **Developer mode** (top right toggle)

4. Click **Load unpacked** → select the `ocr-extension/` folder

5. Pin the SnapOCR icon to your toolbar

6. Go to any webpage, click the icon, and drag!

---

## ⌨️ Keyboard Shortcut

Default: `Ctrl+Shift+S`

To customize: `chrome://extensions/shortcuts`

---

## 🔑 API Usage

This extension uses the [OCR.space](https://ocr.space/OCRAPI) free API.

- The demo key (`helloworld`) is used by default — **500 requests/day**
- For unlimited use, [get a free API key](https://ocr.space/OCRAPI#free) (25,000 requests/month)
- Replace the key in `background.js` line with your own key

---

## 📝 How It Works

```
1. User clicks icon
       ↓
2. background.js captures full-page screenshot (captureVisibleTab)
       ↓  
3. content.js shows crosshair overlay
       ↓
4. User drags to select area
       ↓
5. content.js crops the screenshot using Canvas API
       ↓
6. background.js sends base64 image to OCR.space API
       ↓
7. API returns extracted text (~1-2 seconds)
       ↓
8. Text copied to clipboard + "✅ Text Copied!" toast shown
```

---

## 🚧 Development Journey

This extension went through several OCR approaches before finding what works:

- ❌ **Tesseract.js v5** — WASM workers blocked in extension context
- ❌ **Tesseract.js v4 (offscreen document)** — service worker suspension issues  
- ✅ **OCR.space API** — simple fetch call, fast, reliable

---

## 📄 License

MIT — free to use, modify, and distribute.

---

**Built to solve a real problem. Stop wasting time, just drag and copy.** 🎯
