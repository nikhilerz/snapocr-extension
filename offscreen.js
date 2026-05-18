// offscreen.js — Tesseract.js v4 API
// Runs in extension context (offscreen document), can freely create workers

let ocrWorker = null;

async function getWorker() {
  if (ocrWorker) return ocrWorker;

  // Tesseract.js v4 API: createWorker takes options object only
  const worker = await Tesseract.createWorker({
    workerBlobURL: false,
    workerPath:    chrome.runtime.getURL("libs/worker.min.js"),
    corePath:      chrome.runtime.getURL("libs/tesseract-core.wasm.js"),
    langPath:      chrome.runtime.getURL("libs"),
    logger:        (m) => { if (m.status) console.log("[SnapOCR]", m.status, Math.round((m.progress||0)*100)+"%"); },
  });

  // v4 requires explicit loadLanguage + initialize
  await worker.loadLanguage("eng");
  await worker.initialize("eng");

  ocrWorker = worker;
  return ocrWorker;
}

// ── Handle port connections from background ─────────────────────────────────
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "snapocr-offscreen") return;

  port.onMessage.addListener(async (msg) => {
    if (msg.action !== "do-ocr") return;
    try {
      const worker = await getWorker();
      const { data: { text } } = await worker.recognize(msg.imageDataUrl);
      port.postMessage({ ok: true, text: text.trim() });
    } catch (e) {
      console.error("[SnapOCR] OCR error:", e);
      // Reset worker so next attempt gets a fresh one
      ocrWorker = null;
      port.postMessage({ ok: false, error: e.message });
    }
  });
});
