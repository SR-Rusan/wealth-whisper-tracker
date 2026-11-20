// ==UserScript==
// @name         Wealth Whisper Safari Sync
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Automatically syncs bKash transactions from Google Messages Web to the Wealth Whisper local server.
// @author       Antigravity
// @match        https://messages.google.com/*
// @grant        none
// @run-at       document-end
// ==UserScript==

(function() {
    'use strict';

    const API_URL = 'http://localhost:5001';
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

        const txnIdMatch = cleaned.match(/TxnID\s+([A-Z0-9]+)/i);
        const txnId = txnIdMatch ? txnIdMatch[1] : null;

        if (!txnId) return null;

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

    // Process and send to local server
    function processTextMessage(text) {
        const parsed = parseSMS(text);
        if (parsed && !processedTxns.has(parsed.txnId)) {
            processedTxns.add(parsed.txnId);
            console.log("[Wealth Whisper Sync] Sending transaction to local server:", parsed);

            // Post main transaction
            const mainTx = {
                id: parsed.txnId,
                date: new Date().toISOString().split('T')[0],
                type: parsed.type,
                amount: parsed.amount,
                category: parsed.category,
                method: parsed.method,
                description: parsed.description,
                isMFS: true
            };

            fetch(`${API_URL}/api/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mainTx)
            }).catch(err => console.error("[Wealth Whisper Sync] Failed to send main transaction:", err));

            // Post fee if present
            if (parsed.fee > 0) {
                const feeTx = {
                    id: `${parsed.txnId}_fee`,
                    date: new Date().toISOString().split('T')[0],
                    type: 'expense',
                    amount: parsed.fee,
                    category: 'Bills & Transfers',
                    method: parsed.method,
                    description: `${parsed.description} (MFS Fee)`,
                    isMFS: true
                };

                fetch(`${API_URL}/api/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(feeTx)
                }).catch(err => console.error("[Wealth Whisper Sync] Failed to send fee transaction:", err));
            }
        }
    }

    // Observe Google Messages Web DOM
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
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

    console.log("[Wealth Whisper Sync] Safari Userscript active.");
    observer.observe(document.body, { childList: true, subtree: true });
})();
