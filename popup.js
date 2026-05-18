document.getElementById("activate").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    // Capture first, then send to content
    chrome.tabs.captureVisibleTab(tabs[0].windowId, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.warn("SnapOCR:", chrome.runtime.lastError.message);
        // Try without image anyway
        chrome.tabs.sendMessage(tabs[0].id, { action: "activate-snip" });
      } else {
        chrome.tabs.sendMessage(tabs[0].id, { action: "activate-snip", image: dataUrl });
      }
    });
    window.close();
  });
});
