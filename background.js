// background.js — clean, simple, uses OCR.space API (no local WASM)

// ── Icon click ───────────────────────────────────────────────────────────────
chrome.action.onClicked.addListener((tab) => startSnip(tab));

// ── Keyboard shortcut ────────────────────────────────────────────────────────
chrome.commands.onCommand.addListener((command) => {
  if (command === "activate-ocr") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab) startSnip(tab);
    });
  }
});

// ── Step 1: Capture the screen and send to content script ───────────────────
function startSnip(tab) {
  chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, (dataUrl) => {
    if (chrome.runtime.lastError || !dataUrl) return;
    chrome.tabs.sendMessage(tab.id, { action: "activate-snip", image: dataUrl }, () => {
      void chrome.runtime.lastError;
    });
  });
}

// ── Step 2: Receive cropped image from content script, call OCR API ──────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== "run-ocr") return;

  callOCR(msg.imageDataUrl)
    .then(text => sendResponse({ ok: true, text }))
    .catch(err => sendResponse({ ok: false, error: err.message }));

  return true; // async
});

// ── OCR.space API ────────────────────────────────────────────────────────────
async function callOCR(imageDataUrl) {
  const formData = new FormData();
  formData.append("base64Image", imageDataUrl);   // already has data:image/png;base64, prefix
  formData.append("language", "eng");
  formData.append("isOverlayRequired", "false");
  formData.append("detectOrientation", "true");
  formData.append("scale", "true");
  formData.append("OCREngine", "2");              // Engine 2: better for screenshots

  const resp = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: { "apikey": "helloworld" },          // free public demo key
    body: formData,
  });

  if (!resp.ok) throw new Error(`Network error: ${resp.status}`);

  const data = await resp.json();

  if (data.IsErroredOnProcessing) {
    throw new Error(data.ErrorMessage?.[0] || "OCR API error");
  }

  const text = data.ParsedResults?.[0]?.ParsedText?.trim() || "";
  return text;
}
