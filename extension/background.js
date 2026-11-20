chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'NEW_TX') {
    // Query all tabs running the tracker app
    chrome.tabs.query({ url: '*://localhost/*' }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'ADD_TX',
          tx: message.tx
        });
      });
    });
  }
});
