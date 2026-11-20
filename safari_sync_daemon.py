import subprocess
import json
import time
import urllib.request
import re

API_URL = "http://localhost:5001"
processed_txns = set()

# AppleScript to query Safari, auto-click bKash, and scroll up to load historical messages
APPLESCRIPT = """
tell application "Safari"
    set messagesTab to missing value
    repeat with w in windows
        repeat with t in tabs of w
            if URL of t starts with "https://messages.google.com" then
                set messagesTab to t
                exit repeat
            end if
        end repeat
        if messagesTab is not missing value then exit repeat
    end repeat
    
    if messagesTab is not missing value then
        try
            tell messagesTab
                do JavaScript "
                    (function() {
                        // 1. Find and click the bKash conversation in the sidebar
                        var listItems = document.querySelectorAll('[role=\\"listitem\\"], mws-conversation-list-item, a.conversation, .conversation-list-item');
                        for (var i = 0; i < listItems.length; i++) {
                            var el = listItems[i];
                            var text = (el.textContent || '').toLowerCase();
                            var nameEl = el.querySelector('.name, .conversation-name, h3, .sender, .title, [colortype]');
                            var nameText = nameEl ? nameEl.textContent.trim().toLowerCase() : '';
                            
                            var isMatch = false;
                            if (nameText) {
                                isMatch = (nameText === 'bkash' || nameText === 'pikash' || nameText === 'bcache' || nameText === '247');
                            } else {
                                isMatch = ((text.includes('bkash') && !text.includes('bkashoffer')) || text.includes('pikash') || text.includes('bcache') || text.includes('247'));
                            }
                            
                            if (isMatch) {
                                var clickable = el.querySelector('a') || el;
                                clickable.click();
                                break;
                            }
                        }

                        // 2. Scroll the message list to the top to trigger lazy-loading of older history
                        var scrollContainers = document.querySelectorAll('mws-message-list, .messages-list, [data-scroll-target], .message-list, .bubbles');
                        scrollContainers.forEach(function(el) {
                            el.scrollTop = 0;
                            if (el.parentElement) {
                                el.parentElement.scrollTop = 0;
                            }
                        });

                        // 3. Extract all MFS message texts
                        var texts = [];
                        var allElements = document.querySelectorAll('*');
                        allElements.forEach(function(el) {
                            // Find the leaf element containing TxnID / TrxID case-insensitively with optional spaces
                            if (el.children.length === 0 && /txnid|txn\\\\s+id|trxid|trx\\\\s+id/i.test(el.textContent || '')) {
                                // Group using all possible Google Messages bubble classes
                                var bubble = el.closest('mws-message-part, mws-text-message-part, [role=\\"row\\"], .message-wrapper, .message-bubble, .text-msg, .msg-content, .text-msg-content, .msg-part-with-menu, .msg-parts-container, .msg-row') || el.parentElement || el;
                                var txt = bubble.textContent || '';
                                if (txt.includes('Tk') || txt.includes('tk') || txt.includes('TK')) {
                                    texts.push(txt);
                                }
                            }
                        });
                        return JSON.stringify(texts);
                    })()
                "
            end tell
        on error errMsg
            return "ERROR: " & errMsg
        end try
    else
        return "NOT_FOUND"
    end if
end tell
"""

def run_applescript(script):
    try:
        process = subprocess.Popen(
            ['osascript', '-e', script],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = process.communicate()
        return stdout.strip()
    except Exception as e:
        return f"ERROR: {str(e)}"

def parse_sms(text):
    cleaned = re.sub(r'\s+', ' ', text).strip()
    
    send_money_pattern = r"Send Money to\s+(.*?)\s+successful\.\s+Amount\s+Tk\s+([\d,]+\.\d{2})\.\s+Fee\s+Tk\s+([\d,]+\.\d{2})"
    payment_pattern = r"Payment\s+Tk\s+([\d,]+\.\d{2})\s+to\s+(.*?)\s+successful"
    cash_out_pattern = r"Cash Out\s+Tk\s+([\d,]+\.\d{2})\s+from\s+(.*?)\s+successful"
    received_pattern = r"You\s+have\s+received\s+Tk\s+([\d,]+\.\d{2})\s+from\s+(.*?)\."
    recharge_pattern = r"Mobile\s+Recharge\s+Tk\s+([\d,]+\.\d{2})\s+to\s+(.*?)\s+successful"
    
    txn_id_match = re.search(r"Txn\s*ID\s+([A-Z0-9]+)", cleaned, re.IGNORECASE)
    if not txn_id_match:
        txn_id_match = re.search(r"Trx\s*ID\s+([A-Z0-9]+)", cleaned, re.IGNORECASE)
    if not txn_id_match:
        return None
    txn_id = txn_id_match.group(1)
    
    # Send Money
    match = re.search(send_money_pattern, cleaned, re.IGNORECASE)
    if match:
        return {
            "id": txn_id,
            "type": "expense",
            "amount": float(match.group(2).replace(',', '')),
            "fee": float(match.group(3).replace(',', '')),
            "category": "Bills & Transfers",
            "description": f"Send Money to {match.group(1)}",
            "method": "Online Banking (bKash)",
            "isMFS": True
        }
        
    # Payment
    match = re.search(payment_pattern, cleaned, re.IGNORECASE)
    if match:
        fee_match = re.search(r"Fee\s+Tk\s+([\d,]+\.\d{2})", cleaned, re.IGNORECASE)
        fee = float(fee_match.group(1).replace(',', '')) if fee_match else 0.0
        return {
            "id": txn_id,
            "type": "expense",
            "amount": float(match.group(1).replace(',', '')),
            "fee": fee,
            "category": "Shopping",
            "description": f"Payment to {match.group(2)}",
            "method": "Online Banking (bKash)",
            "isMFS": True
        }
        
    # Cash Out
    match = re.search(cash_out_pattern, cleaned, re.IGNORECASE)
    if match:
        fee_match = re.search(r"Fee\s+Tk\s+([\d,]+\.\d{2})", cleaned, re.IGNORECASE)
        fee = float(fee_match.group(1).replace(',', '')) if fee_match else 0.0
        return {
            "id": txn_id,
            "type": "expense",
            "amount": float(match.group(1).replace(',', '')),
            "fee": fee,
            "category": "Leisure",
            "description": f"Cash Out via {match.group(2)}",
            "method": "Online Banking (bKash)",
            "isMFS": True
        }
        
    # Received
    match = re.search(received_pattern, cleaned, re.IGNORECASE)
    if match:
        return {
            "id": txn_id,
            "type": "income",
            "amount": float(match.group(1).replace(',', '')),
            "fee": 0.0,
            "category": "Salary & Transfers",
            "description": f"Received from {match.group(2)}",
            "method": "Online Banking (bKash)",
            "isMFS": True
        }
        
    # Recharge
    match = re.search(recharge_pattern, cleaned, re.IGNORECASE)
    if match:
        return {
            "id": txn_id,
            "type": "expense",
            "amount": float(match.group(1).replace(',', '')),
            "fee": 0.0,
            "category": "Utilities",
            "description": f"Mobile Recharge to {match.group(2)}",
            "method": "Online Banking (bKash)",
            "isMFS": True
        }
        
    # --- FALLBACK PARSER ---
    amount_match = re.search(r"Tk\s*([\d,]+\.\d{2})", cleaned, re.IGNORECASE)
    if amount_match:
        amount = float(amount_match.group(1).replace(',', ''))
        is_income = any(word in cleaned.lower() for word in ["received", "incoming", "credited", "deposit", "cash in"])
        tx_type = "income" if is_income else "expense"
        
        desc = "bKash Transaction"
        if "payment" in cleaned.lower(): desc = "bKash Payment"
        elif "cash out" in cleaned.lower(): desc = "bKash Cash Out"
        elif "send money" in cleaned.lower(): desc = "bKash Send Money"
        elif "received" in cleaned.lower(): desc = "bKash Received"
        
        return {
            "id": txn_id,
            "type": tx_type,
            "amount": amount,
            "fee": 0.0,
            "category": "Bills & Transfers" if tx_type == "expense" else "Salary & Transfers",
            "description": desc,
            "method": "Online Banking (bKash)",
            "isMFS": True
        }
        
    return None

def send_to_server(tx):
    try:
        data = json.dumps(tx).encode('utf-8')
        req = urllib.request.Request(
            f"{API_URL}/api/transactions",
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as response:
            pass
            
        if tx.get("fee", 0) > 0:
            fee_tx = {
                "id": f"{tx['id']}_fee",
                "date": tx.get("date", time.strftime("%Y-%m-%d")),
                "type": "expense",
                "amount": tx["fee"],
                "category": "Bills & Transfers",
                "method": tx["method"],
                "description": f"{tx['description']} (MFS Fee)",
                "isMFS": True
            }
            fee_data = json.dumps(fee_tx).encode('utf-8')
            fee_req = urllib.request.Request(
                f"{API_URL}/api/transactions",
                data=fee_data,
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(fee_req) as response:
                pass
    except Exception as e:
        print(f"[Daemon] Error sending to server: {e}")

print("[Daemon] Wealth Whisper Safari Sync Daemon active. Monitoring Safari...")

while True:
    result = run_applescript(APPLESCRIPT)
    print(f"[Daemon] Safari Raw Output: {result[:200]}...")
    
    if result == "NOT_FOUND":
        pass
    elif result.startswith("ERROR:"):
        if "Allow JavaScript from Apple Events" in result:
            print("\n⚠️  [ACTION REQUIRED] Please enable JavaScript execution in Safari:")
            print("1. Go to Safari > Settings > Advanced.")
            print("2. Check 'Show features for web developers'.")
            print("3. In the menu bar, click Develop > Allow JavaScript from Apple Events.")
            time.sleep(10)
        else:
            print(f"[Daemon] AppleScript Error: {result}")
    else:
        try:
            texts = json.loads(result)
            if texts:
                print(f"[Daemon] Read {len(texts)} potential transaction messages from Safari.")
            for text in texts:
                parsed = parse_sms(text)
                if parsed:
                    if parsed["id"] not in processed_txns:
                        processed_txns.add(parsed["id"])
                        parsed["date"] = time.strftime("%Y-%m-%d")
                        print(f"[Daemon] Syncing: {parsed['description']} - Tk {parsed['amount']}")
                        send_to_server(parsed)
                else:
                    print(f"[Daemon] Unmatched message text: {text[:80]}...")
        except Exception as e:
            print(f"[Daemon] Error parsing Safari result: {e}")
            
    time.sleep(5)
