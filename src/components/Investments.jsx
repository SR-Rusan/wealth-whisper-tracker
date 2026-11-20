import React, { useState } from 'react';

export default function Investments({ investments, onAddInvestment, onDeleteInvestment }) {
  // Form State
  const [amount, setAmount] = useState('');
  const [assetName, setAssetName] = useState('');
  const [assetClass, setAssetClass] = useState('Stocks');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Thesis / Why Prompts
  const [thesis, setThesis] = useState('');
  const [horizon, setHorizon] = useState('');
  const [risks, setRisks] = useState('');

  // Expanded cards state
  const [expandedId, setExpandedId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !assetName) return;

    const newInvestment = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      assetName,
      assetClass,
      date,
      thesis,
      horizon,
      risks
    };

    onAddInvestment(newInvestment);

    // Reset Form
    setAmount('');
    setAssetName('');
    setThesis('');
    setHorizon('');
    setRisks('');
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }} className="animate-fade">
      {/* Page Header */}
      <section className="luxury-card no-hover" style={{ background: 'var(--parchment)', borderLeft: '3px solid var(--gold)' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Investment Journal</h1>
        <p style={{ color: 'var(--warm-gray)', maxWidth: '600px', fontSize: '1rem', lineHeight: '1.6' }}>
          Document your capital deployments along with the underlying philosophy. Write down your thesis today so you can evaluate your decisions objectively in the future.
        </p>
      </section>

      {/* Grid: Journal Form & List */}
      <section className="grid-2" style={{ alignItems: 'start' }}>
        {/* Investment Logger Form */}
        <div className="luxury-card no-hover">
          <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Journal New Asset</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid-2" style={{ gap: '20px' }}>
              <div className="form-group">
                <label>Amount (Tk)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid-2" style={{ gap: '20px' }}>
              <div className="form-group">
                <label>Asset Name / Platform</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g., BRAC Bank, Gold Bar, US Equity" 
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Asset Class</label>
                <select 
                  className="form-control" 
                  value={assetClass}
                  onChange={(e) => setAssetClass(e.target.value)}
                >
                  <option value="Stocks">Stocks / Equities</option>
                  <option value="Bonds">Bonds / Fixed Income</option>
                  <option value="Mutual Funds">Mutual Funds</option>
                  <option value="Commodities">Commodities (Gold/Silver)</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Crypto">Cryptocurrency</option>
                  <option value="Other">Other / Cash Equivalents</option>
                </select>
              </div>
            </div>

            <hr />
            
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: '20px', color: 'var(--hunter-green)' }}>
              The Investment Philosophy (The "Why")
            </h4>

            <div className="form-group">
              <label>1. Core Investment Thesis</label>
              <textarea 
                className="form-control" 
                rows="3" 
                placeholder="Why do you believe this asset will appreciate or yield returns?" 
                value={thesis}
                onChange={(e) => setThesis(e.target.value)}
                style={{ resize: 'none', lineHeight: '1.5' }}
              ></textarea>
            </div>

            <div className="form-group">
              <label>2. Holding Horizon & Exit Strategy</label>
              <textarea 
                className="form-control" 
                rows="2" 
                placeholder="How long do you plan to hold this? Under what conditions will you exit?" 
                value={horizon}
                onChange={(e) => setHorizon(e.target.value)}
                style={{ resize: 'none', lineHeight: '1.5' }}
              ></textarea>
            </div>

            <div className="form-group">
              <label>3. Accepted Risks</label>
              <textarea 
                className="form-control" 
                rows="2" 
                placeholder="What are the primary risks? How will you react if they occur?" 
                value={risks}
                onChange={(e) => setRisks(e.target.value)}
                style={{ resize: 'none', lineHeight: '1.5' }}
              ></textarea>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px' }}>
              Commit to Journal
            </button>
          </form>
        </div>

        {/* Investment List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '1.4rem' }}>Journaled Deployments ({investments.length})</h3>
          
          {investments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[...investments].reverse().map((inv) => {
                const isExpanded = expandedId === inv.id;
                return (
                  <div key={inv.id} className="luxury-card" style={{ borderLeft: '4px solid var(--gold)', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--warm-gray)', fontWeight: '500' }}>{inv.date} • {inv.assetClass}</span>
                        <h4 style={{ fontSize: '1.25rem', marginTop: '4px', color: 'var(--walnut)', fontWeight: '500' }}>{inv.assetName}</h4>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-sans)', fontWeight: '500', color: 'var(--hunter-green)', margin: 0 }}>
                          Tk {inv.amount.toLocaleString()}
                        </h3>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ 
                        marginTop: '20px', 
                        paddingTop: '20px', 
                        borderTop: '1px solid var(--border-light)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '20px', 
                        animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' 
                      }}>
                        <div>
                          <h5 style={{ fontWeight: '600', fontSize: '0.75rem', color: 'var(--warm-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Core Thesis</h5>
                          <p style={{ fontSize: '0.95rem', marginTop: '6px', color: 'var(--walnut)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{inv.thesis || 'Not documented.'}</p>
                        </div>
                        <div>
                          <h5 style={{ fontWeight: '600', fontSize: '0.75rem', color: 'var(--warm-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Horizon & Exit Strategy</h5>
                          <p style={{ fontSize: '0.95rem', marginTop: '6px', color: 'var(--walnut)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{inv.horizon || 'Not documented.'}</p>
                        </div>
                        <div>
                          <h5 style={{ fontWeight: '600', fontSize: '0.75rem', color: 'var(--warm-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accepted Risks</h5>
                          <p style={{ fontSize: '0.95rem', marginTop: '6px', color: 'var(--walnut)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{inv.risks || 'Not documented.'}</p>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', alignItems: 'center' }}>
                      <button 
                        className="luxury-pill" 
                        onClick={() => toggleExpand(inv.id)}
                        style={{ fontSize: '0.8rem', padding: '6px 16px' }}
                      >
                        {isExpanded ? 'Hide Philosophy' : 'Review Philosophy'}
                      </button>
                      <button 
                        onClick={() => onDeleteInvestment(inv.id)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: 'var(--burgundy)', 
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '0.85rem'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="luxury-card no-hover" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--warm-gray)', fontStyle: 'italic' }}>
              No investments recorded yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
