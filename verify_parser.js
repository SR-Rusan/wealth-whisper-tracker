import { parseSMS } from './src/utils/smsParser.js';

const testCases = [
  {
    name: "Send Money",
    sms: "Send Money to 01712345678 successful. Amount Tk 500.00. Fee Tk 5.00. Balance Tk 4495.00. TxnID 8K29L3M9.",
    expected: {
      type: "expense",
      amount: 500,
      fee: 5,
      category: "Bills & Transfers",
      description: "Send Money to 01712345678",
      method: "Online Banking (bKash)",
      recipient: "01712345678",
      isMFS: true
    }
  },
  {
    name: "Payment",
    sms: "Payment Tk 1,250.00 to SENDER OUTLET successful. Fee Tk 0.00. Balance Tk 3,245.00. TxnID 7H38D2L1.",
    expected: {
      type: "expense",
      amount: 1250,
      fee: 0,
      category: "Shopping",
      description: "Payment to SENDER OUTLET",
      method: "Online Banking (bKash)",
      recipient: "SENDER OUTLET",
      isMFS: true
    }
  },
  {
    name: "Cash Out",
    sms: "Cash Out Tk 2,000.00 from Agent 01887654321 successful. Fee Tk 37.00. Balance Tk 1,208.00. TxnID 6G72H1J3.",
    expected: {
      type: "expense",
      amount: 2000,
      fee: 37,
      category: "Leisure",
      description: "Cash Out via Agent 01887654321",
      method: "Online Banking (bKash)",
      recipient: "Agent 01887654321",
      isMFS: true
    }
  },
  {
    name: "Received Money",
    sms: "You have received Tk 2,500.00 from 01711223344. Ref Cash. Fee Tk 0.00. Balance Tk 5,000.00. TxnID 8K29L3M9.",
    expected: {
      type: "income",
      amount: 2500,
      fee: 0,
      category: "Salary & Transfers",
      description: "Received from 01711223344",
      method: "Online Banking (bKash)",
      recipient: "01711223344",
      isMFS: true
    }
  },
  {
    name: "Mobile Recharge",
    sms: "Mobile Recharge Tk 100.00 to 01511223344 successful. Fee Tk 0.00. Balance Tk 4,900.00. TxnID 5F67G8H9.",
    expected: {
      type: "expense",
      amount: 100,
      fee: 0,
      category: "Utilities",
      description: "Mobile Recharge to 01511223344",
      method: "Online Banking (bKash)",
      recipient: "01511223344",
      isMFS: true
    }
  }
];

let failed = false;

console.log("=== Running bKash SMS Parser Unit Tests ===");
testCases.forEach((tc) => {
  const result = parseSMS(tc.sms);
  if (!result) {
    console.error(`❌ [FAIL] ${tc.name}: Parser returned null.`);
    failed = true;
    return;
  }

  // Compare key fields
  const assertions = [
    result.type === tc.expected.type,
    result.amount === tc.expected.amount,
    result.fee === tc.expected.fee,
    result.category === tc.expected.category,
    result.description === tc.expected.description,
    result.method === tc.expected.method,
    result.recipient === tc.expected.recipient,
    result.isMFS === tc.expected.isMFS
  ];

  if (assertions.every(Boolean)) {
    console.log(`✅ [PASS] ${tc.name}`);
  } else {
    console.error(`❌ [FAIL] ${tc.name}`);
    console.error("Expected:", tc.expected);
    console.error("Got:", result);
    failed = true;
  }
});

if (failed) {
  process.exit(1);
} else {
  console.log("🎉 All tests passed successfully!");
}
