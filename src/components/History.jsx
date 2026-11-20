import React, { useState } from 'react';

export default function History({ transactions, onImportData, onClearData }) {
  const [expandedMonth, setExpandedMonth] = useState(null);

  // Group transactions by month (YYYY-MM)
  const monthlyData = transactions.reduce((acc, t) => {
    const month = t.date.substring(0, 7);
    if (!acc[month]) {
      acc[month] = {
        income: 0,
        expense: 0,
        transactions: []
      };
    }
    if (t.type === 'income') acc[month].income += t.amount;
    else acc[month].expense += t.amount;
    acc[month].transactions.push(t);
    return acc;
  }, {});

  const months = Object.keys(monthlyData).sort((a, b) => b.localeCompare(a));

  // Calculate biggest transactions
  const biggestIncome = [...transactions]
    .filter(t => t.type === 'income')
    .sort((a, b) => b.amount - a.amount)[0] || null;

  const biggestExpense = [...transactions]
    .filter(t => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)[0] || null;

  // Export Data to JSON file
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `wealth-whisper-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Data from JSON file
  const handleImport = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (Array.isArray(parsed)) {
            onImportData(parsed);
            alert("Data imported successfully!");
          } else {
            alert("Invalid file format. Please upload a valid Wealth Whisper backup.");
          }
        } catch (err) {
          alert("Failed to parse the file. Please ensure it is a valid JSON backup.");
        }
      };
    }
  };

  // Group transactions within a month by day
  const getGroupedByDay = (txs) => {
    const grouped = txs.reduce((acc, t) => {
      if (!acc[t.date]) acc[t.date] = [];
      acc[t.date].push(t);
      return acc;
    }, {});
    return Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map(date => ({
      date,
      txs: grouped[date]
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }} className="animate-fade">
      {/* Page Header */}
      <section className="luxury-card no-hover" style={{ background: 'var(--parchment)', borderLeft: '3px solid var(--gold)' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Ledger Archives</h1>
        <p style={{ color: 'var(--warm-gray)', maxWidth: '600px', fontSize: '1rem', lineHeight: '1.6' }}>
          Review monthly performances and manage your financial database. Import and export backups to keep your laptop and mobile device in perfect sync.
        </p>
      </section>

      <section className="grid-2" style={{ alignItems: 'start' }}>
        {/* Monthly Performance List */}
        <div>
          <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Monthly Summaries</h3>
          
          {months.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {months.map((month) => {
                const data = monthlyData[month];
                const net = data.income - data.expense;
                const isExpanded = expandedMonth === month;
                
                const [year, monthNum] = month.split('-');
                const dateObj = new Date(year, parseInt(monthNum) - 1);
                const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

                return (
                  <div key={month} className="luxury-card no-hover" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                      <div>
                        <h4 style={{ fontSize: '1.25rem', color: 'var(--hunter-green)', fontWeight: '500' }}>{monthName}</h4>
                        <span style={{ fontSize: '0.85rem', color: 'var(--warm-gray)' }}>
                          {data.transactions.length} Transactions
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '24px', textAlign: 'right' }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--warm-gray)', textTransform: 'uppercase', display: 'block', letterSpacing: '0.05em' }}>Inflow</span>
                          <span style={{ fontWeight: '500', color: 'var(--hunter-green)' }}>Tk {data.income.toFixed(2)}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--warm-gray)', textTransform: 'uppercase', display: 'block', letterSpacing: '0.05em' }}>Outflow</span>
                          <span style={{ fontWeight: '500', color: 'var(--burgundy)' }}>Tk {data.expense.toFixed(2)}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--warm-gray)', textTransform: 'uppercase', display: 'block', letterSpacing: '0.05em' }}>Net</span>
                          <span style={{ fontWeight: '600', color: net >= 0 ? 'var(--hunter-green)' : 'var(--burgundy)' }}>
                            Tk {net.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ 
                        marginTop: '24px', 
                        paddingTop: '20px', 
                        borderTop: '1px solid var(--border-light)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '20px', 
                        maxHeight: '400px', 
                        overflowY: 'auto', 
                        paddingRight: '8px',
                        animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}>
                        {getGroupedByDay(data.transactions).map(({ date, txs }) => (
                          <div key={date} style={{ marginBottom: '16px' }}>
                            <h5 style={{ fontSize: '0.8rem', fontWeight: '600', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px', marginBottom: '12px', color: 'var(--warm-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {date}
                            </h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {txs.map(t => (
                                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--walnut)' }}>
                                    {t.description} <span style={{ fontSize: '0.8rem', color: 'var(--warm-gray)' }}>({t.category})</span>
                                  </span>
                                  <span style={{ fontWeight: '600', color: t.type === 'income' ? 'var(--hunter-green)' : 'var(--burgundy)' }}>
                                    {t.type === 'income' ? '+' : '-'} Tk {t.amount.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-start' }}>
                      <button 
                        className="luxury-pill" 
                        onClick={() => setExpandedMonth(isExpanded ? null : month)}
                        style={{ fontSize: '0.8rem', padding: '6px 16px' }}
                      >
                        {isExpanded ? 'Hide Transactions' : 'View Transactions'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="luxury-card no-hover" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--warm-gray)', fontStyle: 'italic' }}>
              No archived records found.
            </div>
          )}
        </div>

        {/* Sidebar Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%' }}>
          {/* Record Highlights */}
          {(biggestIncome || biggestExpense) && (
            <div className="luxury-card no-hover" style={{ borderLeft: '3px solid var(--gold)', padding: '28px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '1.4rem' }}>Record Highlights</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {biggestIncome && (
                  <div>
                    <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: '600', color: 'var(--warm-gray)', letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>Biggest Inflow</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: '500', color: 'var(--hunter-green)', fontFamily: 'var(--font-sans)' }}>
                      Tk {biggestIncome.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--walnut)', fontWeight: '500' }}>{biggestIncome.description}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', display: 'block', marginTop: '2px' }}>{biggestIncome.date}</span>
                  </div>
                )}
                {biggestIncome && biggestExpense && <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '4px 0' }} />}
                {biggestExpense && (
                  <div>
                    <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: '600', color: 'var(--warm-gray)', letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>Biggest Outflow</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: '500', color: 'var(--burgundy)', fontFamily: 'var(--font-sans)' }}>
                      Tk {biggestExpense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--walnut)', fontWeight: '500' }}>{biggestExpense.description}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', display: 'block', marginTop: '2px' }}>{biggestExpense.date}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data Management Controls */}
          <div className="luxury-card no-hover" style={{ border: '1px dashed var(--warm-gray)', padding: '28px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.4rem' }}>Database Controls</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--warm-gray)', marginBottom: '24px', lineHeight: '1.6' }}>
            Wealth Whisper runs entirely on your local browser. To sync data with your mobile phone or another device, export the ledger as a file and import it on the target device.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--warm-gray)', marginBottom: '8px' }}>Export Ledger</h4>
              <button className="btn-primary" style={{ width: '100%' }} onClick={handleExport}>
                Download Backup (.json)
              </button>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--warm-gray)', marginBottom: '8px' }}>Import Ledger</h4>
              <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block', width: '100%' }}>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImport}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer'
                  }} 
                />
                <button className="btn-secondary" style={{ width: '100%' }}>
                  Upload Backup File
                </button>
              </div>
            </div>

            <hr style={{ margin: '12px 0' }} />

            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--burgundy)', marginBottom: '8px' }}>Reset Ledger</h4>
              <button 
                className="btn-secondary" 
                style={{ width: '100%', borderColor: 'rgba(74, 18, 26, 0.3)', color: 'var(--burgundy)' }}
                onClick={() => {
                  if (confirm("Are you absolutely sure you want to clear all data? This cannot be undone.")) {
                    onClearData();
                  }
                }}
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
        </div>
      </section>
    </div>
  );
}
