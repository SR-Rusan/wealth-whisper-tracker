import React, { useState, useEffect } from 'react';
import { getDistanceKm } from '../utils/geoTracker';

export default function LocationTracker({ onAddTransaction }) {
  // GPS State
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const [lastCheckMessage, setLastCheckMessage] = useState('Location tracking inactive.');

  // Saved Home Location
  const [homeLocation, setHomeLocation] = useState(() => {
    const saved = localStorage.getItem('ww_home_loc');
    return saved ? JSON.parse(saved) : null;
  });

  // Saved Route Presets
  const [routes, setRoutes] = useState(() => {
    const saved = localStorage.getItem('ww_route_presets');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: '1',
        name: 'Home → Dhanmondi',
        destName: 'Dhanmondi',
        destLat: 23.7461,
        destLng: 90.3742,
        cost: 100,
        category: 'Transport',
        method: 'Cash',
        mode: 'prompt', // 'auto' or 'prompt'
        radiusKm: 1.5
      }
    ];
  });

  // New Route Form State
  const [newRouteName, setNewRouteName] = useState('');
  const [newDestName, setNewDestName] = useState('');
  const [newCost, setNewCost] = useState('100');
  const [newCategory, setNewCategory] = useState('Transport');
  const [newMethod, setNewMethod] = useState('Cash');
  const [newMode, setNewMode] = useState('prompt');
  const [useCurrentForDest, setUseCurrentForDest] = useState(false);

  // Active Arrival Notification Prompt
  const [activePrompt, setActivePrompt] = useState(null);

  // Save presets to localStorage
  useEffect(() => {
    localStorage.setItem('ww_route_presets', JSON.stringify(routes));
  }, [routes]);

  // Save home location to localStorage
  useEffect(() => {
    if (homeLocation) {
      localStorage.setItem('ww_home_loc', JSON.stringify(homeLocation));
    }
  }, [homeLocation]);

  // Set current position as Home
  const handleSetHome = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newHome = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: 'Home'
        };
        setHomeLocation(newHome);
        setLastCheckMessage('Home location updated to your current position!');
      },
      (err) => {
        setGpsError(`GPS Access Error: ${err.message}`);
      }
    );
  };

  // Toggle Live Tracking
  useEffect(() => {
    let watchId = null;

    if (trackingEnabled) {
      if (!navigator.geolocation) {
        setGpsError('Geolocation is not supported.');
        setTrackingEnabled(false);
        return;
      }

      setLastCheckMessage('Monitoring location in real-time...');

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentCoords({ lat, lng });
          setGpsError('');

          // Check route presets against current position
          routes.forEach((route) => {
            const distToDest = getDistanceKm(lat, lng, route.destLat, route.destLng);
            
            // Check if user is within the destination radius
            if (distToDest <= (route.radiusKm || 1.5)) {
              // Check if we've already triggered recently
              const lastTrigger = localStorage.getItem(`ww_triggered_${route.id}`);
              const now = Date.now();
              // Prevent repeat triggers within 4 hours
              if (!lastTrigger || now - parseInt(lastTrigger) > 4 * 60 * 60 * 1000) {
                if (route.mode === 'auto') {
                  // Auto-log expense
                  const newTx = {
                    id: Date.now().toString(),
                    date: new Date().toISOString().split('T')[0],
                    type: 'expense',
                    amount: parseFloat(route.cost),
                    category: route.category,
                    method: route.method,
                    description: `Travel Expense: ${route.name}`,
                    isMFS: route.method.includes('bKash')
                  };
                  onAddTransaction(newTx);
                  localStorage.setItem(`ww_triggered_${route.id}`, now.toString());
                  setLastCheckMessage(`Auto-logged Tk ${route.cost} for ${route.name}!`);
                } else {
                  // Prompt user
                  setActivePrompt(route);
                }
              }
            }
          });
        },
        (err) => {
          setGpsError(`GPS Warning: ${err.message}`);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
    } else {
      setLastCheckMessage('Location tracking paused.');
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [trackingEnabled, routes, homeLocation]);

  // Handle Prompt Confirmation
  const handleConfirmPrompt = () => {
    if (!activePrompt) return;

    const newTx = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      amount: parseFloat(activePrompt.cost),
      category: activePrompt.category,
      method: activePrompt.method,
      description: `Travel Expense: ${activePrompt.name}`,
      isMFS: activePrompt.method.includes('bKash')
    };

    onAddTransaction(newTx);
    localStorage.setItem(`ww_triggered_${activePrompt.id}`, Date.now().toString());
    setActivePrompt(null);
    setLastCheckMessage(`Logged Tk ${activePrompt.cost} travel expense!`);
  };

  // Add Custom Route
  const handleAddRoute = (e) => {
    e.preventDefault();
    if (!newDestName || !newCost) return;

    let destLat = 23.7461;
    let destLng = 90.3742;

    if (useCurrentForDest && currentCoords) {
      destLat = currentCoords.lat;
      destLng = currentCoords.lng;
    }

    const newRoute = {
      id: Date.now().toString(),
      name: newRouteName || `Home → ${newDestName}`,
      destName: newDestName,
      destLat,
      destLng,
      cost: parseFloat(newCost),
      category: newCategory,
      method: newMethod,
      mode: newMode,
      radiusKm: 1.5
    };

    setRoutes(prev => [...prev, newRoute]);
    setNewRouteName('');
    setNewDestName('');
    setNewCost('100');
  };

  // Delete Route
  const handleDeleteRoute = (id) => {
    setRoutes(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }} className="animate-fade">
      {/* Route Arrival Notification Modal */}
      {activePrompt && (
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
          <div className="luxury-card" style={{ maxWidth: '480px', width: '100%', background: 'var(--card-bg)', border: '1px solid var(--gold)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', padding: '36px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Location Arrival Detected</span>
            <h3 style={{ fontSize: '1.6rem', color: 'var(--walnut)', margin: '8px 0 12px 0' }}>Arrived at {activePrompt.destName}!</h3>
            <p style={{ color: 'var(--body-text)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
              Wealth Whisper detected you traveled to <strong>{activePrompt.destName}</strong>. Log your configured travel expense of <strong>Tk {parseFloat(activePrompt.cost).toFixed(2)}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setActivePrompt(null)}>Ignore</button>
              <button className="btn-primary" onClick={handleConfirmPrompt}>
                Log Tk {parseFloat(activePrompt.cost).toFixed(2)} Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Control Card */}
      <section className="luxury-card no-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>GPS Geofencing & Travel Automation</span>
          <h2 style={{ fontSize: '2rem', marginTop: '4px' }}>Location Expense Tracker</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--warm-gray)', marginTop: '4px' }}>
            {lastCheckMessage}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn-secondary" 
            onClick={handleSetHome}
            style={{ fontSize: '0.85rem' }}
          >
            Set Current Position as Home
          </button>

          <button 
            className={`btn-primary ${trackingEnabled ? 'active' : ''}`}
            onClick={() => setTrackingEnabled(!trackingEnabled)}
            style={{ 
              backgroundColor: trackingEnabled ? 'var(--hunter-green)' : 'var(--parchment)', 
              color: trackingEnabled ? '#FFFFFF' : 'var(--walnut)',
              borderColor: 'var(--gold)'
            }}
          >
            {trackingEnabled ? 'GPS Tracking Active' : 'Enable GPS Tracking'}
          </button>
        </div>
      </section>

      {/* Coordinates & Home Location Info */}
      <section className="grid-2">
        <div className="luxury-card">
          <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: '600', color: 'var(--warm-gray)', letterSpacing: '0.1em' }}>Home Position</span>
          <h3 style={{ fontSize: '1.4rem', marginTop: '8px', color: 'var(--walnut)' }}>
            {homeLocation ? homeLocation.name : 'Not Configured Yet'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--warm-gray)', marginTop: '4px' }}>
            {homeLocation ? `Lat: ${homeLocation.lat.toFixed(4)}, Lng: ${homeLocation.lng.toFixed(4)}` : 'Click "Set Current Position as Home" above.'}
          </p>
        </div>

        <div className="luxury-card">
          <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: '600', color: 'var(--warm-gray)', letterSpacing: '0.1em' }}>Live Coordinates</span>
          <h3 style={{ fontSize: '1.4rem', marginTop: '8px', color: trackingEnabled ? 'var(--hunter-green)' : 'var(--warm-gray)' }}>
            {currentCoords ? `${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}` : 'Awaiting GPS stream...'}
          </h3>
          {gpsError && <p style={{ fontSize: '0.8rem', color: 'var(--burgundy)', marginTop: '4px' }}>{gpsError}</p>}
        </div>
      </section>

      {/* Main Form & Presets Grid */}
      <section className="grid-2" style={{ alignItems: 'start' }}>
        {/* Add New Route Automation Form */}
        <div className="luxury-card no-hover">
          <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Configure Route Rule</h3>
          <form onSubmit={handleAddRoute}>
            <div className="form-group">
              <label>Route Label</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g., Home → Dhanmondi" 
                value={newRouteName}
                onChange={(e) => setNewRouteName(e.target.value)}
              />
            </div>

            <div className="grid-2" style={{ gap: '20px' }}>
              <div className="form-group">
                <label>Destination Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g., Dhanmondi" 
                  value={newDestName}
                  onChange={(e) => setNewDestName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Fixed Travel Cost (Tk)</label>
                <input 
                  type="number" 
                  step="1"
                  className="form-control" 
                  placeholder="100" 
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid-2" style={{ gap: '20px' }}>
              <div className="form-group">
                <label>Payment Method</label>
                <select 
                  className="form-control" 
                  value={newMethod}
                  onChange={(e) => setNewMethod(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Online Banking (bKash)">bKash</option>
                </select>
              </div>

              <div className="form-group">
                <label>Trigger Action</label>
                <select 
                  className="form-control" 
                  value={newMode}
                  onChange={(e) => setNewMode(e.target.value)}
                >
                  <option value="prompt">Prompt Confirmation Banner</option>
                  <option value="auto">Auto-Log Automatically (100 Tk)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px' }}>
              Save Route Automation
            </button>
          </form>
        </div>

        {/* Configured Route Rules List */}
        <div className="luxury-card no-hover">
          <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Active Route Automations</h3>

          {routes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {routes.map((r) => (
                <div 
                  key={r.id}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '18px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--parchment)',
                    borderLeft: '4px solid var(--gold)'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '1.05rem', color: 'var(--walnut)' }}>{r.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--warm-gray)', marginTop: '4px' }}>
                      Fixed Cost: <strong>Tk {r.cost.toFixed(2)}</strong> • Mode: <span style={{ textTransform: 'capitalize' }}>{r.mode}</span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className="luxury-pill" style={{ fontSize: '0.75rem', padding: '4px 12px', border: 'none', cursor: 'default' }}>
                      {r.method}
                    </span>
                    <button 
                      onClick={() => handleDeleteRoute(r.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--burgundy)', cursor: 'pointer', fontWeight: '600' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--warm-gray)', fontStyle: 'italic' }}>No route automations configured yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
