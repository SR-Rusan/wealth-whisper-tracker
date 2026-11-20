import React, { useState } from 'react';

export default function MonthlyReport({ transactions, investments, onNavigate }) {
  // Get list of available months (YYYY-MM) from transactions or current month
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const availableMonths = Array.from(new Set([
    currentMonthStr,
    ...transactions.map(t => t.date ? t.date.slice(0, 7) : '')
  ])).filter(Boolean).sort().reverse();

  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || currentMonthStr);

  // Filter transactions & investments for selected month YYYY-MM
  const monthTransactions = [...transactions]
    .filter(t => t.date && t.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date));

  const monthInvestments = [...investments]
    .filter(inv => inv.date && inv.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date));

  // Financial Metrics
  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;
  const totalInvested = monthInvestments.reduce((sum, inv) => sum + inv.amount, 0);

  // Category Breakdown
  const categoryTotals = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const cat = t.category || 'Others';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {});

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);

  const topCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;

  // Format month title (e.g. "August 2026")
  const formatMonthName = (yyyyMM) => {
    if (!yyyyMM) return '';
    const [year, month] = yyyyMM.split('-');
    const date = new Date(year, parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Format timestamp helper
  const getFormattedTime = (t) => {
    if (t.time) return t.time;
    if (t.timestamp) {
      try {
        return new Date(t.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return '12:00 PM';
      }
    }
    return '12:00 PM';
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['Date', 'Time / Timestamp', 'Type', 'Category', 'Description', 'Payment Method', 'Amount (TK)', 'Verification Status'];
    const rows = monthTransactions.map(t => [
      `"${t.date || 'N/A'}"`,
      `"${getFormattedTime(t)}"`,
      `"${t.type.toUpperCase()}"`,
      `"${t.category || 'General'}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.method || 'Cash'}"`,
      `"${t.amount.toFixed(2)}"`,
      `"${t.isMFS ? 'bKash Verified' : 'Manual Entry'}"`
    ]);

    const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Monthly_Audit_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Recommendations Logic
  const getRecommendations = () => {
    const recs = [];

    // Savings Rate Recommendation
    if (parseFloat(savingsRate) >= 30) {
      recs.push({
        title: 'Outstanding Savings Efficiency',
        text: `Your savings rate of ${savingsRate}% exceeds the recommended 20% benchmark. Consider deploying your surplus of Tk ${netSavings.toFixed(2)} into long-term investments or emergency assets.`,
        type: 'success'
      });
    } else if (parseFloat(savingsRate) >= 15) {
      recs.push({
        title: 'Moderate Capital Retention',
        text: `Your savings rate of ${savingsRate}% is steady. Aim to trim non-essential expenses slightly to push your capital retention above 25%.`,
        type: 'warning'
      });
    } else {
      recs.push({
        title: 'High Outflow Warning',
        text: `Your current net savings rate is ${savingsRate}%. High operating expenses are consuming your income. Review your major expense categories below to restore liquidity.`,
        type: 'alert'
      });
    }

    // Top Category Recommendation
    if (topCategory) {
      const pctOfExpense = totalExpense > 0 ? ((topCategory[1] / totalExpense) * 100).toFixed(0) : 0;
      recs.push({
        title: `Primary Cost Driver: ${topCategory[0]}`,
        text: `${topCategory[0]} accounted for Tk ${topCategory[1].toFixed(2)} (${pctOfExpense}% of total monthly outflow). Auditing recurring payments in this category will yield immediate cash flow gains.`,
        type: 'info'
      });
    }

    // Investment Guidance
    if (totalInvested > 0) {
      recs.push({
        title: 'Active Wealth Building',
        text: `You allocated Tk ${totalInvested.toFixed(2)} toward investments this month. Maintaining consistent monthly asset allocation compounds your wealth exponentially over time.`,
        type: 'success'
      });
    } else if (netSavings > 0) {
      recs.push({
        title: 'Unallocated Surplus Liquidity',
        text: `You have Tk ${netSavings.toFixed(2)} in unallocated net savings this month. Consider opening a high-yield account or asset position to prevent inflation decay.`,
        type: 'info'
      });
    }

    return recs;
  };

  const recommendations = getRecommendations();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }} className="animate-fade print-container">
      {/* Header & Controls */}
      <section className="luxury-card no-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--warm-gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Financial Audit & Intelligence</span>
          <h2 style={{ fontSize: '2rem', marginTop: '4px' }}>Monthly Report ({formatMonthName(selectedMonth)})</h2>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }} className="no-print">
          <select 
            className="form-control"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ minWidth: '180px', fontWeight: '500' }}
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>{formatMonthName(m)}</option>
            ))}
          </select>

          <button 
            className="btn-secondary" 
            onClick={handleExportCSV}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            Export CSV
          </button>

          <button 
            className="btn-primary" 
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            Export PDF
          </button>
        </div>
      </section>

      {/* Summary KPI Cards */}
      <section className="grid-3">
        <div className="luxury-card">
          <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: '600', color: 'var(--warm-gray)', letterSpacing: '0.1em' }}>Total Inflow</span>
          <h2 style={{ fontSize: '2rem', margin: '12px 0 6px 0', fontFamily: 'var(--font-sans)', fontWeight: '400', color: 'var(--hunter-green)' }}>
            Tk {totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--warm-gray)' }}>For {formatMonthName(selectedMonth)}</span>
        </div>

        <div className="luxury-card">
          <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: '600', color: 'var(--warm-gray)', letterSpacing: '0.1em' }}>Total Outflow</span>
          <h2 style={{ fontSize: '2rem', margin: '12px 0 6px 0', fontFamily: 'var(--font-sans)', fontWeight: '400', color: 'var(--burgundy)' }}>
            Tk {totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--warm-gray)' }}>{monthTransactions.filter(t => t.type === 'expense').length} expense entries</span>
        </div>

        <div className="luxury-card">
          <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: '600', color: 'var(--warm-gray)', letterSpacing: '0.1em' }}>Net Surplus & Rate</span>
          <h2 style={{ fontSize: '2rem', margin: '12px 0 6px 0', fontFamily: 'var(--font-sans)', fontWeight: '400', color: netSavings >= 0 ? 'var(--gold)' : 'var(--burgundy)' }}>
            Tk {netSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--warm-gray)' }}>
            Savings Rate: <strong style={{ color: 'var(--gold)', fontWeight: '600' }}>{savingsRate}%</strong>
          </span>
        </div>
      </section>

      {/* Main Breakdown & Analysis Grid */}
      <section className="grid-2" style={{ alignItems: 'start' }}>
        {/* Category Breakdown Table */}
        <div className="luxury-card no-hover">
          <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Category Distribution</h3>
          {sortedCategories.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sortedCategories.map(([cat, amt]) => {
                const pct = totalExpense > 0 ? (amt / totalExpense) * 100 : 0;
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--walnut)', fontWeight: '500' }}>{cat}</span>
                      <span style={{ color: 'var(--warm-gray)' }}>Tk {amt.toFixed(2)} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--parchment)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${pct}%`, 
                        height: '100%', 
                        backgroundColor: 'var(--gold)',
                        borderRadius: '10px'
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--warm-gray)', fontStyle: 'italic' }}>No expense transactions recorded for this month.</p>
          )}
        </div>

        {/* AI & Financial Recommendations */}
        <div className="luxury-card no-hover">
          <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Financial Recommendations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recommendations.map((rec, idx) => (
              <div 
                key={idx} 
                style={{ 
                  padding: '20px', 
                  borderRadius: '8px', 
                  backgroundColor: 'var(--parchment)',
                  borderLeft: `4px solid ${rec.type === 'success' ? 'var(--hunter-green)' : rec.type === 'alert' ? 'var(--burgundy)' : 'var(--gold)'}`
                }}
              >
                <h4 style={{ fontSize: '0.95rem', color: 'var(--walnut)', marginBottom: '6px' }}>{rec.title}</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--body-text)', lineHeight: '1.6', opacity: 0.9 }}>{rec.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comprehensive Timestamped Transaction Ledger Table */}
      <section className="luxury-card no-hover">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.4rem' }}>Comprehensive Monthly Ledger</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--warm-gray)' }}>Timestamped record of all transactions for {formatMonthName(selectedMonth)}</span>
          </div>
          <span className="luxury-pill" style={{ backgroundColor: 'var(--parchment)', border: 'none', cursor: 'default', fontSize: '0.8rem' }}>
            {monthTransactions.length} Total Entries
          </span>
        </div>

        {monthTransactions.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--walnut)', color: 'var(--warm-gray)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  <th style={{ padding: '16px 12px' }}>Date & Timestamp</th>
                  <th style={{ padding: '16px 12px' }}>Description</th>
                  <th style={{ padding: '16px 12px' }}>Category</th>
                  <th style={{ padding: '16px 12px' }}>Method</th>
                  <th style={{ padding: '16px 12px', textAlign: 'right' }}>Amount (Tk)</th>
                  <th style={{ padding: '16px 12px', textAlign: 'center' }}>Verification</th>
                </tr>
              </thead>
              <tbody>
                {monthTransactions.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '0.92rem' }} className="table-row-hover">
                    <td style={{ padding: '18px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: '600', color: 'var(--walnut)' }}>{t.date}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--warm-gray)', marginTop: '2px' }}>{getFormattedTime(t)}</div>
                    </td>
                    <td style={{ padding: '18px 12px' }}>
                      <div style={{ fontWeight: '500', color: 'var(--walnut)' }}>{t.description || t.category}</div>
                    </td>
                    <td style={{ padding: '18px 12px', color: 'var(--warm-gray)' }}>{t.category || 'General'}</td>
                    <td style={{ padding: '18px 12px' }}>
                      <span className="luxury-pill" style={{ padding: '4px 12px', fontSize: '0.75rem', cursor: 'default', backgroundColor: 'var(--parchment)', border: 'none' }}>{t.method}</span>
                    </td>
                    <td style={{ 
                      padding: '18px 12px', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: t.type === 'income' ? 'var(--hunter-green)' : 'var(--burgundy)'
                    }}>
                      {t.type === 'income' ? '+' : '-'} Tk {t.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '18px 12px', textAlign: 'center' }}>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        backgroundColor: t.isMFS ? 'rgba(197, 160, 89, 0.15)' : 'var(--parchment)', 
                        color: t.isMFS ? 'var(--gold)' : 'var(--warm-gray)', 
                        padding: '4px 10px', 
                        borderRadius: '100px',
                        border: t.isMFS ? '1px solid rgba(197, 160, 89, 0.3)' : '1px solid var(--border-light)',
                        fontWeight: '500',
                        display: 'inline-block'
                      }}>
                        {t.isMFS ? '✓ bKash Verified' : 'Manual Entry'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--warm-gray)', fontStyle: 'italic' }}>
            No transactions found for this month.
          </div>
        )}
      </section>

      {/* Executive Conclusion Card */}
      <section className="luxury-card no-hover" style={{ background: 'var(--parchment)', borderLeft: '4px solid var(--gold)', padding: '36px' }}>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '12px' }}>Executive Financial Conclusion</h3>
        <p style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--body-text)', opacity: 0.95 }}>
          {totalIncome > 0 ? (
            <>
              During <strong>{formatMonthName(selectedMonth)}</strong>, your total generated income of <strong>Tk {totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> yielded a net liquidity surplus of <strong>Tk {netSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> after accounting for <strong>Tk {totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> in total outflows.
              {netSavings >= 0 ? (
                ` You maintained a positive capital retention rate of ${savingsRate}%. Continuing this disciplined approach ensures financial independence and compound growth.`
              ) : (
                ` Your spending exceeded income by Tk ${Math.abs(netSavings).toFixed(2)}. Adjusting your primary expense drivers will help restore net positive cash flow next month.`
              )}
            </>
          ) : (
            `No financial transactions have been logged yet for ${formatMonthName(selectedMonth)}. Use the Ledger tab to record your monthly income and expenses to generate a complete financial audit.`
          )}
        </p>
      </section>
    </div>
  );
}
