// content.js — UI overlay + image crop + sends to background for OCR
(function () {
  if (window.__snapOCRActive) return;
  window.__snapOCRActive = true;

  let startX, startY, isDrawing = false;
  let overlay, selBox, hint, capturedImg;

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "activate-snip" && msg.image) {
      capturedImg = msg.image;
      showOverlay();
    }
  });

  // ── Overlay ─────────────────────────────────────────────────────────────
  function showOverlay() {
    removeOverlay();
    overlay = el("div", "snapocr-overlay");
    hint    = el("div", "snapocr-hint", "Drag to select an area  •  Press Esc to cancel");
    selBox  = el("div", "snapocr-selbox");
    document.body.append(overlay, hint, selBox);
    overlay.addEventListener("mousedown", startDrag);
    document.addEventListener("keydown", escHandler);
  }

  function startDrag(e) {
    e.preventDefault();
    isDrawing = true;
    startX = e.clientX; startY = e.clientY;
    Object.assign(selBox.style, { display:"block", left:startX+"px", top:startY+"px", width:"0px", height:"0px" });
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", endDrag);
  }

  function onDrag(e) {
    if (!isDrawing) return;
    const x = Math.min(e.clientX, startX), y = Math.min(e.clientY, startY);
    const w = Math.abs(e.clientX - startX), h = Math.abs(e.clientY - startY);
    Object.assign(selBox.style, { left:x+"px", top:y+"px", width:w+"px", height:h+"px" });
  }

  function endDrag() {
    if (!isDrawing) return;
    isDrawing = false;
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", endDrag);

    const x = parseInt(selBox.style.left), y = parseInt(selBox.style.top);
    const w = parseInt(selBox.style.width), h = parseInt(selBox.style.height);
    removeOverlay();

    if (w < 10 || h < 10) return;
    doOCR({ x, y, w, h });
  }

  function escHandler(e) { if (e.key === "Escape") removeOverlay(); }

  function removeOverlay() {
    overlay?.remove(); hint?.remove(); selBox?.remove();
    document.removeEventListener("keydown", escHandler);
    overlay = hint = selBox = null;
  }

  // ── Crop + OCR ───────────────────────────────────────────────────────────
  function doOCR({ x, y, w, h }) {
    showToast("loading");

    const img = new Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      const canvas = document.createElement("canvas");
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.getContext("2d").drawImage(img, x*dpr, y*dpr, w*dpr, h*dpr, 0, 0, canvas.width, canvas.height);

      chrome.runtime.sendMessage({ action: "run-ocr", imageDataUrl: canvas.toDataURL("image/png") }, (resp) => {
        if (chrome.runtime.lastError) return showToast("error", "Extension error — reload the page.");
        if (!resp?.ok) return showToast("error", resp?.error || "OCR failed.");
        const text = resp.text;
        if (!text) return showToast("error", "No text found in selection.");
        copyText(text);
        showToast("copied");
      });
    };
    img.src = capturedImg;
  }

  // ── Copy to clipboard (reliable) ─────────────────────────────────────────
  function copyText(text) {
    // Method 1: modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand("copy"); } catch(e) {}
    ta.remove();
  }

  // ── Toast UI ─────────────────────────────────────────────────────────────
  let toastEl = null;
  let toastTimer = null;

  function showToast(state, errMsg = "") {
    // Remove existing
    toastEl?.remove();
    clearTimeout(toastTimer);

    toastEl = el("div", "snapocr-toast");

    if (state === "loading") {
      toastEl.innerHTML = `<div class="snapocr-spinner"></div><span>Extracting text…</span>`;
    } else if (state === "copied") {
      toastEl.classList.add("snapocr-toast-success");
      toastEl.innerHTML = `<span class="snapocr-check">✅</span><span>Text Copied!</span>`;
      // Auto-dismiss after 2.5s
      toastTimer = setTimeout(() => {
        toastEl?.classList.add("snapocr-toast-hide");
        setTimeout(() => toastEl?.remove(), 400);
      }, 2500);
    } else if (state === "error") {
      toastEl.classList.add("snapocr-toast-error");
      toastEl.innerHTML = `<span>⚠️</span><span>${escapeHtml(errMsg)}</span>`;
      toastTimer = setTimeout(() => {
        toastEl?.classList.add("snapocr-toast-hide");
        setTimeout(() => toastEl?.remove(), 400);
      }, 3500);
    }

    document.body.appendChild(toastEl);
  }

  function el(tag, cls, text = "") {
    const e = document.createElement(tag);
    e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function escapeHtml(s) {
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }
})();
