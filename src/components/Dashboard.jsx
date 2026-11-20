import React, { useState } from 'react';
import Ferrofluid from './Ferrofluid/Ferrofluid';
import Strands from './Strands/Strands';

export default function Dashboard({ transactions, investments, onNavigate, onClearData }) {
  const [showResetModal, setShowResetModal] = useState(false);

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(0) : 0;

  // Investment stats
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

  // Recent transactions (limit to 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const handleConfirmReset = () => {
    if (onClearData) {
      onClearData();
    }
    setShowResetModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }} className="animate-fade">
      {/* Reset Confirmation Modal Overlay */}
      {showResetModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div className="luxury-card" style={{ maxWidth: '460px', width: '100%', background: 'var(--card-bg)', border: '1px solid var(--gold)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', padding: '36px' }}>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--walnut)', marginBottom: '12px' }}>Start New Month / Reset</h3>
            <p style={{ color: 'var(--body-text)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '28px' }}>
              Are you sure you want to clear your active transactions to start fresh for the month? All current transactions will be reset.
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowResetModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleConfirmReset} style={{ backgroundColor: 'var(--burgundy)', borderColor: 'var(--burgundy)' }}>
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="luxury-card no-hover" style={{ position: 'relative', overflow: 'hidden', padding: '40px', background: 'linear-gradient(135deg, var(--parchment) 0%, var(--gold-light) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '40px', borderLeft: '3px solid var(--gold)' }}>
        {/* Animated Ferrofluid Background */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 0, opacity: 0.5 }}>
          <Ferrofluid
            colors={["#F97316", "#EAB308", "#F97316"]}
            speed={0.2}
            scale={1.5}
            turbulence={0.45}
            fluidity={0.02}
            rimWidth={0.22}
            sharpness={4.9}
            shimmer={1.3}
            glow={2.2}
            flowDirection="down"
            opacity={0.5}
            mouseInteraction={true}
            mouseStrength={1.3}
            mouseRadius={0.3}
          />
        </div>

        <div style={{ flex: '1 1 500px', position: 'relative', zIndex: 1 }}>
          <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)', fontStyle: 'italic', fontSize: '1.05rem', letterSpacing: '0.05em' }}>Welcome to your personal ledger</span>
          <h1 style={{ fontSize: '2.8rem', marginTop: '8px', marginBottom: '16px', lineHeight: '1.15', color: 'var(--walnut)' }}>Wealth Whisper</h1>
          <p style={{ color: 'var(--body-text)', opacity: 0.9, maxWidth: '560px', marginBottom: '28px', fontSize: '1.05rem', lineHeight: '1.7' }}>
            A quiet sanctuary to cultivate your capital. Track daily transactions, parse mobile banking messages automatically, and record the philosophy behind your investments.
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => onNavigate('ledger')}>Log Transaction</button>
            <button className="btn-secondary" onClick={() => onNavigate('investments')}>Journal Investments</button>
            <button className="btn-secondary" onClick={() => setShowResetModal(true)} style={{ borderColor: 'var(--burgundy)', color: 'var(--burgundy)' }}>
              Reset Month
            </button>
          </div>
        </div>

        {/* Interactive Animated Orbital Widget */}
        <div style={{ width: '220px', height: '220px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          <svg width="220" height="220" viewBox="0 0 200 200" fill="none" style={{ overflow: 'visible' }}>
            {/* Axis Crosshairs */}
            <line x1="100" y1="20" x2="100" y2="180" stroke="var(--border-light)" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.6" />
            <line x1="20" y1="100" x2="180" y2="100" stroke="var(--border-light)" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.6" />
            
            {/* Inner Dashed Precision Ring */}
            <circle cx="100" cy="100" r="46" stroke="var(--warm-gray)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />

            {/* Rotating Primary Orbital Ring */}
            <g style={{ transformOrigin: '100px 100px', animation: 'orbitRotate 16s linear infinite' }}>
              <ellipse cx="100" cy="100" rx="82" ry="30" stroke="var(--gold)" strokeWidth="1.25" opacity="0.85" transform="rotate(-25 100 100)" />
              <circle cx="174" cy="65" r="4" fill="var(--card-bg)" stroke="var(--gold)" strokeWidth="1.5" style={{ animation: 'satelliteGlow 2.5s ease-in-out infinite' }} />
            </g>

            {/* Counter-Rotating Secondary Orbital Ring */}
            <g style={{ transformOrigin: '100px 100px', animation: 'orbitRotateRev 24s linear infinite' }}>
              <ellipse cx="100" cy="100" rx="82" ry="28" stroke="var(--warm-gray)" strokeWidth="1" opacity="0.5" transform="rotate(35 100 100)" />
              <circle cx="28" cy="130" r="3" fill="var(--gold)" opacity="0.9" />
            </g>

            {/* Pulsing Central Financial Core */}
            <circle cx="100" cy="100" r="5" fill="var(--gold)" style={{ transformOrigin: '100px 100px', animation: 'corePulse 3s ease-in-out infinite' }} />
          </svg>
        </div>
      </section>

      {/* Financial Overview Cards */}
      <section className="grid-3">
        <div className="luxury-card">
          <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: '600', color: 'var(--warm-gray)', letterSpacing: '0.1em' }}>Total Net Savings</span>
          <h2 style={{ fontSize: '2.2rem', margin: '12px 0 6px 0', fontFamily: 'var(--font-sans)', fontWeight: '400', color: 'var(--hunter-green)' }}>
            Tk {netSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--warm-gray)' }}>
            Savings Rate: <strong style={{ color: 'var(--hunter-green)', fontWeight: '600' }}>{savingsRate}%</strong>
          </span>
        </div>

        <div className="luxury-card">
          <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: '600', color: 'var(--warm-gray)', letterSpacing: '0.1em' }}>Monthly Outflow</span>
          <h2 style={{ fontSize: '2.2rem', margin: '12px 0 6px 0', fontFamily: 'var(--font-sans)', fontWeight: '400', color: 'var(--burgundy)' }}>
            Tk {totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--warm-gray)' }}>
            Across {transactions.filter(t => t.type === 'expense').length} items
          </span>
        </div>

        <div className="luxury-card">
          <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: '600', color: 'var(--warm-gray)', letterSpacing: '0.1em' }}>Total Invested</span>
          <h2 style={{ fontSize: '2.2rem', margin: '12px 0 6px 0', fontFamily: 'var(--font-sans)', fontWeight: '400', color: 'var(--gold)' }}>
            Tk {totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--warm-gray)' }}>
            In {investments.length} opportunities
          </span>
        </div>
      </section>

      {/* Main Grid: Details & Recent Ledger */}
      <section className="grid-2" style={{ alignItems: 'start' }}>
        {/* Visual Budget Meter */}
        <div className="luxury-card no-hover">
          <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Outflow Allocation</h3>
          {totalIncome > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--warm-gray)' }}>Expenses vs Income</span>
                  <span style={{ fontWeight: '600' }}>{((totalExpense / totalIncome) * 100).toFixed(0)}% Used</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--parchment)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min((totalExpense / totalIncome) * 100, 100)}%`, 
                    height: '100%', 
                    backgroundColor: 'var(--burgundy)',
                    borderRadius: '10px',
                    transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--warm-gray)' }}>Savings Target</span>
                  <span style={{ fontWeight: '600' }}>{savingsRate}% Secured</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--parchment)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min(Math.max(savingsRate, 0), 100)}%`, 
                    height: '100%', 
                    backgroundColor: 'var(--hunter-green)',
                    borderRadius: '10px',
                    transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}></div>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--warm-gray)', fontStyle: 'italic' }}>Please log some income to view budget metrics.</p>
          )}

          <div style={{ marginTop: '40px', padding: '24px', background: 'var(--parchment)', borderLeft: '2px solid var(--gold)', borderRadius: '0 8px 8px 0' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--walnut)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Motto of the House</h4>
            <p style={{ fontStyle: 'italic', fontSize: '0.95rem', color: 'var(--body-text)', opacity: 0.95, lineHeight: '1.6' }}>
              "Real wealth is quiet. It is the freedom to choose your own path, the absence of financial anxiety, and the patience to let compound interest work its silent magic."
            </p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="luxury-card no-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.4rem' }}>Recent Ledger</h3>
            <button className="luxury-pill" onClick={() => onNavigate('ledger')} style={{ fontSize: '0.8rem', padding: '6px 16px' }}>View All</button>
          </div>

          {recentTransactions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recentTransactions.map((t, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingBottom: '16px',
                  borderBottom: idx !== recentTransactions.length - 1 ? '1px solid var(--border-light)' : 'none'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '0.95rem', color: 'var(--walnut)' }}>{t.description || t.category}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)', display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                      <span>{t.date}</span>
                      <span>•</span>
                      <span className="luxury-pill" style={{ padding: '2px 10px', fontSize: '0.7rem', cursor: 'default', backgroundColor: 'var(--parchment)', border: 'none' }}>{t.method}</span>
                    </div>
                  </div>
                  <div style={{ 
                    fontWeight: '600', 
                    color: t.type === 'income' ? 'var(--hunter-green)' : 'var(--burgundy)',
                    fontSize: '1.05rem'
                  }}>
                    {t.type === 'income' ? '+' : '-'} Tk {t.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--warm-gray)' }}>
              <p style={{ fontStyle: 'italic', marginBottom: '16px' }}>The ledger is currently blank.</p>
              <button className="btn-secondary" onClick={() => onNavigate('ledger')}>Add your first entry</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
