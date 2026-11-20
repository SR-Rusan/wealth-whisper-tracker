/**
 * Parses MFS (specifically bKash) SMS texts to extract transaction details.
 * @param {string} text - The raw SMS text.
 * @returns {object|null} The parsed transaction object or null if no match.
 */
export function parseSMS(text) {
  if (!text) return null;
  
  // Clean up text (trim, normalize spaces)
  const cleaned = text.replace(/\s+/g, ' ').trim();
  
  // Regex patterns
  const sendMoneyRegex = /Send Money to\s+(.*?)\s+successful\.\s+Amount\s+Tk\s+([\d,]+\.\d{2})\.\s+Fee\s+Tk\s+([\d,]+\.\d{2})/i;
  const paymentRegex = /Payment\s+Tk\s+([\d,]+\.\d{2})\s+to\s+(.*?)\s+successful/i;
  const cashOutRegex = /Cash Out\s+Tk\s+([\d,]+\.\d{2})\s+from\s+(.*?)\s+successful/i;
  const receivedRegex = /You\s+have\s+received\s+Tk\s+([\d,]+\.\d{2})\s+from\s+(.*?)\./i;
  const rechargeRegex = /Mobile\s+Recharge\s+Tk\s+([\d,]+\.\d{2})\s+to\s+(.*?)\s+successful/i;

  let match;
  
  // 1. Send Money
  if ((match = cleaned.match(sendMoneyRegex))) {
    return {
      type: 'expense',
      amount: parseFloat(match[2].replace(/,/g, '')),
      fee: parseFloat(match[3].replace(/,/g, '')),
      category: 'Bills & Transfers',
      description: `Send Money to ${match[1]}`,
      method: 'Online Banking (bKash)',
      recipient: match[1],
      isMFS: true,
      timestamp: new Date().toISOString().split('T')[0]
    };
  }
  
  // 2. Payment
  if ((match = cleaned.match(paymentRegex))) {
    const feeMatch = cleaned.match(/Fee\s+Tk\s+([\d,]+\.\d{2})/i);
    return {
      type: 'expense',
      amount: parseFloat(match[1].replace(/,/g, '')),
      fee: feeMatch ? parseFloat(feeMatch[1].replace(/,/g, '')) : 0,
      category: 'Shopping',
      description: `Payment to ${match[2]}`,
      method: 'Online Banking (bKash)',
      recipient: match[2],
      isMFS: true,
      timestamp: new Date().toISOString().split('T')[0]
    };
  }
  
  // 3. Cash Out
  if ((match = cleaned.match(cashOutRegex))) {
    const feeMatch = cleaned.match(/Fee\s+Tk\s+([\d,]+\.\d{2})/i);
    return {
      type: 'expense',
      amount: parseFloat(match[1].replace(/,/g, '')),
      fee: feeMatch ? parseFloat(feeMatch[1].replace(/,/g, '')) : 0,
      category: 'Leisure',
      description: `Cash Out via ${match[2]}`,
      method: 'Online Banking (bKash)',
      recipient: match[2],
      isMFS: true,
      timestamp: new Date().toISOString().split('T')[0]
    };
  }
  
  // 4. Received Money
  if ((match = cleaned.match(receivedRegex))) {
    return {
      type: 'income',
      amount: parseFloat(match[1].replace(/,/g, '')),
      fee: 0,
      category: 'Salary & Transfers',
      description: `Received from ${match[2]}`,
      method: 'Online Banking (bKash)',
      recipient: match[2],
      isMFS: true,
      timestamp: new Date().toISOString().split('T')[0]
    };
  }
  
  // 5. Mobile Recharge
  if ((match = cleaned.match(rechargeRegex))) {
    return {
      type: 'expense',
      amount: parseFloat(match[1].replace(/,/g, '')),
      fee: 0,
      category: 'Utilities',
      description: `Mobile Recharge to ${match[2]}`,
      method: 'Online Banking (bKash)',
      recipient: match[2],
      isMFS: true,
      timestamp: new Date().toISOString().split('T')[0]
    };
  }
  
  return null;
}
