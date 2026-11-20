import React, { useState } from 'react';
import { parseSMS } from '../utils/smsParser';

export default function Ledger({ transactions, onAddTransaction, onDeleteTransaction }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Manual Form State
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [method, setMethod] = useState('Cash');
  const [description, setDescription] = useState('');
  
  // SMS Parser State
  const [smsInput, setSmsInput] = useState('');
  const [parsedPreview, setParsedPreview] = useState(null);
  const [parserError, setParserError] = useState('');

  // Categories based on transaction type
  const expenseCategories = ['Food', 'Transport', 'Utilities', 'Shopping', 'Leisure', 'Bills & Transfers', 'Others'];
  const incomeCategories = ['Salary & Transfers', 'Investments Return', 'Gifts', 'Others'];
  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  // Filter transactions for the selected date
  const dailyTransactions = transactions.filter(t => t.date === selectedDate);

  // Calculate daily totals
  const dailyIncome = dailyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const dailyExpense = dailyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const dailyNet = dailyIncome - dailyExpense;

  // Handlers
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    const newTx = {
      id: Date.now().toString(),
      date: selectedDate,
      type,
      amount: parseFloat(amount),
      category,
      method,
      description: description || category,
      isMFS: method.includes('bKash')
    };

    onAddTransaction(newTx);
    setAmount('');
    setDescription('');
  };

  const handleParseSMS = () => {
    setParserError('');
    setParsedPreview(null);
    
    if (!smsInput.trim()) {
      setParserError('Please paste an SMS message.');
      return;
    }

    const parsed = parseSMS(smsInput);
    if (parsed) {
      setParsedPreview(parsed);
    } else {
      setParserError('Unable to parse this message. Please ensure it is a standard bKash notification.');
    }
  };

  const handleSaveParsed = () => {
    if (!parsedPreview) return;

    const newTx = {
      id: Date.now().toString(),
      date: selectedDate,
      type: parsedPreview.type,
      amount: parsedPreview.amount,
      category: parsedPreview.category,
      method: parsedPreview.method,
      description: parsedPreview.description,
      isMFS: true
    };

    onAddTransaction(newTx);
    
    // Also log the fee if there is one
    if (parsedPreview.fee > 0) {
      onAddTransaction({
        id: (Date.now() + 1).toString(),
        date: selectedDate,
        type: 'expense',
        amount: parsedPreview.fee,
        category: 'Bills & Transfers',
        method: parsedPreview.method,
        description: `${parsedPreview.description} (MFS Fee)`,
        isMFS: true
      });
    }

    // Reset parser
    setSmsInput('');
    setParsedPreview(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }} className="animate-fade">
      {/* Date Selector & Daily Summary */}
      <section className="luxury-card no-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--warm-gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Select Date</span>
          <input 
            type="date" 
            className="form-control" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ marginTop: '8px', maxWidth: '220px' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--warm-gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Daily Income</span>
            <h3 style={{ color: 'var(--hunter-green)', fontSize: '1.6rem', marginTop: '4px', fontWeight: '400' }}>Tk {dailyIncome.toFixed(2)}</h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--warm-gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Daily Expenses</span>
            <h3 style={{ color: 'var(--burgundy)', fontSize: '1.6rem', marginTop: '4px', fontWeight: '400' }}>Tk {dailyExpense.toFixed(2)}</h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--warm-gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Daily Net</span>
            <h3 style={{ color: dailyNet >= 0 ? 'var(--hunter-green)' : 'var(--burgundy)', fontSize: '1.6rem', marginTop: '4px', fontWeight: '500' }}>
              Tk {dailyNet.toFixed(2)}
            </h3>
          </div>
        </div>
      </section>

      {/* Main Form Grid */}
      <section className="grid-2" style={{ alignItems: 'start' }}>
        {/* Manual Input Form */}
        <div className="luxury-card no-hover">
          <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Log Transaction</h3>
          <form onSubmit={handleManualSubmit}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <button 
                type="button" 
                className={`luxury-pill ${type === 'expense' ? 'active' : ''}`}
                onClick={() => { setType('expense'); setCategory('Food'); }}
                style={{ flex: 1 }}
              >
                Expense
              </button>
              <button 
                type="button" 
                className={`luxury-pill ${type === 'income' ? 'active' : ''}`}
                onClick={() => { setType('income'); setCategory('Salary & Transfers'); }}
                style={{ flex: 1 }}
              >
                Income
              </button>
            </div>

            <div className="grid-2" style={{ gap: '20px' }}>
              <div className="form-group">
                <label>Amount (Tk)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <select 
                  className="form-control" 
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Online Banking (bKash)">bKash (Online)</option>
                </select>
              </div>
            </div>

            <div className="grid-2" style={{ gap: '20px' }}>
              <div className="form-group">
                <label>Category</label>
                <select 
                  className="form-control" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g., Groceries, Dinner" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px' }}>
              Record Transaction
            </button>
          </form>
        </div>

        {/* bKash SMS Import Box */}
        <div className="luxury-card no-hover" style={{ borderTop: '4px solid var(--gold)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.4rem' }}>bKash SMS Parser</h3>
            <span className="luxury-pill" style={{ backgroundColor: 'var(--parchment)', color: 'var(--gold)', fontSize: '0.75rem', padding: '4px 12px', border: 'none', cursor: 'default', fontWeight: '600' }}>bKash Sync</span>
          </div>
          
          <p style={{ fontSize: '0.9rem', color: 'var(--warm-gray)', marginBottom: '16px', lineHeight: '1.6' }}>
            Paste any bKash SMS notification (Send Money, Payment, Cash Out, Received, or Recharge) below to automatically extract data.
          </p>

          <div className="form-group">
            <textarea 
              className="form-control" 
              rows="4" 
              placeholder="e.g., Payment Tk 1,250.00 to SENDER OUTLET successful..." 
              value={smsInput}
              onChange={(e) => setSmsInput(e.target.value)}
              style={{ resize: 'none', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.5', background: 'var(--cream-bg)' }}
            ></textarea>
          </div>

          <button 
            type="button" 
            className="btn-secondary" 
            style={{ width: '100%', marginBottom: '20px' }}
            onClick={handleParseSMS}
          >
            Parse Message
          </button>

          {parserError && (
            <div style={{ color: 'var(--burgundy)', fontSize: '0.85rem', padding: '12px', border: '1px solid #FADBD8', borderRadius: '8px', background: '#FDEDEC', marginBottom: '12px' }}>
              {parserError}
            </div>
          )}

          {parsedPreview && (
            <div className="luxury-card no-hover" style={{ background: 'var(--parchment)', padding: '20px', marginTop: '16px', border: '1px solid var(--border-light)' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Parsed Transaction Preview</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--warm-gray)' }}>Type:</span>
                  <strong style={{ color: parsedPreview.type === 'income' ? 'var(--hunter-green)' : 'var(--burgundy)', fontWeight: '600' }}>
                    {parsedPreview.type.toUpperCase()}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--warm-gray)' }}>Amount:</span>
                  <strong style={{ color: 'var(--walnut)' }}>Tk {parsedPreview.amount.toFixed(2)}</strong>
                </div>
                {parsedPreview.fee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--warm-gray)' }}>MFS Fee:</span>
                    <strong style={{ color: 'var(--burgundy)' }}>Tk {parsedPreview.fee.toFixed(2)}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--warm-gray)' }}>Description:</span>
                  <span style={{ color: 'var(--walnut)' }}>{parsedPreview.description}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--warm-gray)' }}>Method:</span>
                  <span style={{ color: 'var(--walnut)' }}>{parsedPreview.method}</span>
                </div>
              </div>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ width: '100%', marginTop: '20px' }}
                onClick={handleSaveParsed}
              >
                Approve & Save to Ledger
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Daily Transactions List */}
      <section className="luxury-card no-hover">
        <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Ledger for {selectedDate}</h3>
        
        {dailyTransactions.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--walnut)', color: 'var(--warm-gray)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  <th style={{ padding: '16px 12px' }}>Description</th>
                  <th style={{ padding: '16px 12px' }}>Category</th>
                  <th style={{ padding: '16px 12px' }}>Method</th>
                  <th style={{ padding: '16px 12px', textAlign: 'right' }}>Amount (Tk)</th>
                  <th style={{ padding: '16px 12px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {dailyTransactions.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '0.95rem', transition: 'background-color 0.2s' }} className="table-row-hover">
                    <td style={{ padding: '20px 12px' }}>
                      <div style={{ fontWeight: '500', color: 'var(--walnut)' }}>{t.description}</div>
                      {t.isMFS && (
                        <span style={{ 
                          fontSize: '0.7rem', 
                          backgroundColor: 'rgba(197, 160, 89, 0.1)', 
                          color: 'var(--gold)', 
                          padding: '2px 8px', 
                          borderRadius: '100px',
                          border: '1px solid rgba(197, 160, 89, 0.2)',
                          marginTop: '6px',
                          display: 'inline-block',
                          fontWeight: '500'
                        }}>
                          bKash Verified
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '20px 12px', color: 'var(--warm-gray)' }}>{t.category}</td>
                    <td style={{ padding: '20px 12px' }}>
                      <span className="luxury-pill" style={{ padding: '4px 12px', fontSize: '0.75rem', cursor: 'default', backgroundColor: 'var(--parchment)', border: 'none' }}>{t.method}</span>
                    </td>
                    <td style={{ 
                      padding: '20px 12px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: t.type === 'income' ? 'var(--hunter-green)' : 'var(--burgundy)'
                    }}>
                      {t.type === 'income' ? '+' : '-'} Tk {t.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '20px 12px', textAlign: 'center' }}>
                      <button 
                        onClick={() => onDeleteTransaction(t.id)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: 'var(--burgundy)', 
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '0.85rem',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.color = 'black'}
                        onMouseLeave={(e) => e.target.style.color = 'var(--burgundy)'}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--warm-gray)', fontStyle: 'italic' }}>
            No transactions logged for this date.
          </div>
        )}
      </section>
    </div>
  );
}
