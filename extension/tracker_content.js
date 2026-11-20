chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ADD_TX') {
    console.log("[Wealth Whisper Sync] Forwarding transaction to page:", request.tx);
    // Send it to the page context
    window.postMessage({
      type: 'FROM_EXTENSION',
      tx: request.tx
    }, '*');
  }
});
