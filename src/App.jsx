import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Ledger from './components/Ledger';
import Investments from './components/Investments';
import History from './components/History';
import MonthlyReport from './components/MonthlyReport';
import LocationTracker from './components/LocationTracker';

// Dynamically target the laptop's IP address when accessed from a phone
const API_URL = `http://${window.location.hostname}:5001`;

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [investments, setInvestments] = useState([]);
  
  // Theme State (kept in localStorage since it is device-specific)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ww_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply and Sync Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ww_theme', theme);
  }, [theme]);

  // Fetch Data from Server
  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/data`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setInvestments(data.investments || []);
      }
    } catch (e) {
      console.error("[Wealth Whisper] Failed to fetch data from server:", e);
    }
  };

  // Initial load and polling every 3 seconds for instant MFS syncing
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleAddTransaction = async (newTx) => {
    // Optimistic UI update
    setTransactions(prev => [newTx, ...prev]);
    try {
      await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx)
      });
    } catch (e) {
      console.error("[Wealth Whisper] Failed to save transaction:", e);
    }
  };

  const handleDeleteTransaction = async (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    try {
      await fetch(`${API_URL}/api/transactions/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error("[Wealth Whisper] Failed to delete transaction:", e);
    }
  };

  const handleAddInvestment = async (newInv) => {
    setInvestments(prev => [newInv, ...prev]);
    try {
      await fetch(`${API_URL}/api/investments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInv)
      });
    } catch (e) {
      console.error("[Wealth Whisper] Failed to save investment:", e);
    }
  };

  const handleDeleteInvestment = async (id) => {
    setInvestments(prev => prev.filter(inv => inv.id !== id));
    try {
      await fetch(`${API_URL}/api/investments/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error("[Wealth Whisper] Failed to delete investment:", e);
    }
  };

  const handleImportData = async (importedTxs) => {
    setTransactions(importedTxs);
    try {
      await fetch(`${API_URL}/api/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importedTxs)
      });
    } catch (e) {
      console.error("[Wealth Whisper] Failed to import data:", e);
    }
  };

  const handleClearData = async () => {
    setTransactions([]);
    setInvestments([]);
    try {
      await fetch(`${API_URL}/api/clear`, { method: 'POST' });
    } catch (e) {
      console.error("[Wealth Whisper] Failed to clear data:", e);
    }
  };

  // Backwards compatibility for Chrome Extension cross-origin message event
  useEffect(() => {
    const handleExtensionMessage = (event) => {
      if (event.source !== window) return;
      if (event.data && event.data.type === 'FROM_EXTENSION') {
        const parsedTx = event.data.tx;
        const exists = transactions.some(t => t.id === parsedTx.txnId);
        if (exists) return;

        const newTx = {
          id: parsedTx.txnId,
          date: parsedTx.timestamp || new Date().toISOString().split('T')[0],
          type: parsedTx.type,
          amount: parsedTx.amount,
          category: parsedTx.category,
          method: parsedTx.method,
          description: parsedTx.description,
          isMFS: true
        };

        handleAddTransaction(newTx);

        if (parsedTx.fee > 0) {
          const feeTx = {
            id: `${parsedTx.txnId}_fee`,
            date: parsedTx.timestamp || new Date().toISOString().split('T')[0],
            type: 'expense',
            amount: parsedTx.fee,
            category: 'Bills & Transfers',
            method: parsedTx.method,
            description: `${parsedTx.description} (MFS Fee)`,
            isMFS: true
          };
          handleAddTransaction(feeTx);
        }
      }
    };

    window.addEventListener('message', handleExtensionMessage);
    return () => window.removeEventListener('message', handleExtensionMessage);
  }, [transactions]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <header style={{ 
        borderBottom: '1px solid var(--border-light)', 
        backgroundColor: 'var(--card-bg)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(44, 37, 35, 0.02)'
      }}>
        <div className="container" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          height: '80px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
            <svg width="34" height="34" viewBox="0 0 36 36" fill="none" style={{ filter: 'drop-shadow(0 2px 8px rgba(197, 160, 89, 0.4))' }}>
              <defs>
                <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F3CD4F" />
                  <stop offset="50%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#A8823B" />
                </linearGradient>
              </defs>
              <circle cx="18" cy="18" r="15" stroke="url(#logoGold)" strokeWidth="1.5" />
              <circle cx="18" cy="18" r="11.5" stroke="url(#logoGold)" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.65" />
              <path d="M10 14.5L14 22L18 15L22 22L26 14.5" stroke="url(#logoGold)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="18" cy="10" r="1.5" fill="url(#logoGold)" />
            </svg>
            <span className="serif-text" style={{ fontSize: '1.5rem', fontWeight: '500', letterSpacing: '-0.03em', color: 'var(--walnut)' }}>
              Wealth Whisper
            </span>
          </div>

          {/* Nav Tabs & Theme Toggle */}
          <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              className={`luxury-pill ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`luxury-pill ${activeTab === 'ledger' ? 'active' : ''}`}
              onClick={() => setActiveTab('ledger')}
            >
              Ledger
            </button>
            <button 
              className={`luxury-pill ${activeTab === 'investments' ? 'active' : ''}`}
              onClick={() => setActiveTab('investments')}
            >
              Investments
            </button>
            <button 
              className={`luxury-pill ${activeTab === 'report' ? 'active' : ''}`}
              onClick={() => setActiveTab('report')}
            >
              Monthly Report
            </button>
            <button 
              className={`luxury-pill ${activeTab === 'location' ? 'active' : ''}`}
              onClick={() => setActiveTab('location')}
            >
              Location GPS
            </button>
            <button 
              className={`luxury-pill ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
            
            {/* Elegant Theme Toggle */}
            <button 
              className="luxury-pill"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title="Toggle Theme"
              style={{ 
                padding: '8px', 
                width: '38px', 
                height: '38px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--parchment)',
                border: 'none'
              }}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Body */}
      <main style={{ flex: 1, padding: '40px 0' }} className="animate-fade">
        <div className="container">
          {activeTab === 'dashboard' && (
            <Dashboard 
              transactions={transactions} 
              investments={investments} 
              onNavigate={setActiveTab}
              onClearData={handleClearData}
            />
          )}
          
          {activeTab === 'ledger' && (
            <Ledger 
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'investments' && (
            <Investments 
              investments={investments}
              onAddInvestment={handleAddInvestment}
              onDeleteInvestment={handleDeleteInvestment}
            />
          )}

          {activeTab === 'report' && (
            <MonthlyReport 
              transactions={transactions}
              investments={investments}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'location' && (
            <LocationTracker 
              onAddTransaction={handleAddTransaction}
            />
          )}

          {activeTab === 'history' && (
            <History 
              transactions={transactions}
              onImportData={handleImportData}
              onClearData={handleClearData}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ 
        borderTop: '1px solid var(--border-light)', 
        padding: '40px 0', 
        backgroundColor: 'var(--parchment)',
        marginTop: '80px'
      }}>
        <div className="container" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
          fontSize: '0.85rem',
          color: 'var(--warm-gray)'
        }}>
          <p>© 2026 Wealth Whisper. Built for Quiet Luxury & Financial Freedom.</p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span style={{ cursor: 'pointer', transition: 'color 0.3s' }} onClick={() => setActiveTab('dashboard')}>Home</span>
            <span>•</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.3s' }} onClick={() => setActiveTab('ledger')}>Ledger</span>
            <span>•</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.3s' }} onClick={() => setActiveTab('investments')}>Investments</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
