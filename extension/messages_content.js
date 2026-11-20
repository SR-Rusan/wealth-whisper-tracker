// Cache of already processed transaction IDs to prevent duplicates
const processedTxns = new Set();

// Parser logic
function parseSMS(text) {
  if (!text) return null;
  
  const cleaned = text.replace(/\s+/g, ' ').trim();
  
  const sendMoneyRegex = /Send Money to\s+(.*?)\s+successful\.\s+Amount\s+Tk\s+([\d,]+\.\d{2})\.\s+Fee\s+Tk\s+([\d,]+\.\d{2})/i;
  const paymentRegex = /Payment\s+Tk\s+([\d,]+\.\d{2})\s+to\s+(.*?)\s+successful/i;
  const cashOutRegex = /Cash Out\s+Tk\s+([\d,]+\.\d{2})\s+from\s+(.*?)\s+successful/i;
  const receivedRegex = /You\s+have\s+received\s+Tk\s+([\d,]+\.\d{2})\s+from\s+(.*?)\./i;
  const rechargeRegex = /Mobile\s+Recharge\s+Tk\s+([\d,]+\.\d{2})\s+to\s+(.*?)\s+successful/i;

  let match;
  let tx = null;
  
  // Extract TxnID
  const txnIdMatch = cleaned.match(/TxnID\s+([A-Z0-9]+)/i);
  const txnId = txnIdMatch ? txnIdMatch[1] : null;
  
  if (!txnId) return null; // Only sync MFS messages with valid Transaction IDs

  if ((match = cleaned.match(sendMoneyRegex))) {
    tx = {
      type: 'expense',
      amount: parseFloat(match[2].replace(/,/g, '')),
      fee: parseFloat(match[3].replace(/,/g, '')),
      category: 'Bills & Transfers',
      description: `Send Money to ${match[1]}`,
      method: 'Online Banking (bKash)',
      recipient: match[1],
      isMFS: true,
      txnId
    };
  } else if ((match = cleaned.match(paymentRegex))) {
    const feeMatch = cleaned.match(/Fee\s+Tk\s+([\d,]+\.\d{2})/i);
    tx = {
      type: 'expense',
      amount: parseFloat(match[1].replace(/,/g, '')),
      fee: feeMatch ? parseFloat(feeMatch[1].replace(/,/g, '')) : 0,
      category: 'Shopping',
      description: `Payment to ${match[2]}`,
      method: 'Online Banking (bKash)',
      recipient: match[2],
      isMFS: true,
      txnId
    };
  } else if ((match = cleaned.match(cashOutRegex))) {
    const feeMatch = cleaned.match(/Fee\s+Tk\s+([\d,]+\.\d{2})/i);
    tx = {
      type: 'expense',
      amount: parseFloat(match[1].replace(/,/g, '')),
      fee: feeMatch ? parseFloat(feeMatch[1].replace(/,/g, '')) : 0,
      category: 'Leisure',
      description: `Cash Out via ${match[2]}`,
      method: 'Online Banking (bKash)',
      recipient: match[2],
      isMFS: true,
      txnId
    };
  } else if ((match = cleaned.match(receivedRegex))) {
    tx = {
      type: 'income',
      amount: parseFloat(match[1].replace(/,/g, '')),
      fee: 0,
      category: 'Salary & Transfers',
      description: `Received from ${match[2]}`,
      method: 'Online Banking (bKash)',
      recipient: match[2],
      isMFS: true,
      txnId
    };
  } else if ((match = cleaned.match(rechargeRegex))) {
    tx = {
      type: 'expense',
      amount: parseFloat(match[1].replace(/,/g, '')),
      fee: 0,
      category: 'Utilities',
      description: `Mobile Recharge to ${match[2]}`,
      method: 'Online Banking (bKash)',
      recipient: match[2],
      isMFS: true,
      txnId
    };
  }
  
  return tx;
}

// Function to process a text message string
function processTextMessage(text) {
  const parsed = parseSMS(text);
  if (parsed && !processedTxns.has(parsed.txnId)) {
    processedTxns.add(parsed.txnId);
    console.log("[Wealth Whisper Sync] Parsed new transaction:", parsed);
    chrome.runtime.sendMessage({
      type: 'NEW_TX',
      tx: parsed
    });
  }
}

// Observe the DOM for incoming messages
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      // Look for text content in newly added elements
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Google Messages chat bubbles contain text inside span or p tags
        const textNodes = node.querySelectorAll('span, p, .message-content');
        if (textNodes.length > 0) {
          textNodes.forEach(el => {
            const text = el.textContent || '';
            if (text.includes('Tk') && text.includes('TxnID')) {
              processTextMessage(text);
            }
          });
        } else {
          const text = node.textContent || '';
          if (text.includes('Tk') && text.includes('TxnID')) {
            processTextMessage(text);
          }
        }
      }
    }
  }
});

// Start observing
console.log("[Wealth Whisper Sync] Extension content script active on Google Messages Web.");
observer.observe(document.body, { childList: true, subtree: true });
