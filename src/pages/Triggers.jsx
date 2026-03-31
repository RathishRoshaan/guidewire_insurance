import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Zap, MapPin, AlertTriangle, Clock, Users, DollarSign, Play, Activity } from 'lucide-react';
import './Triggers.css';

export default function Triggers() {
  const { data, triggerDisruption, CITIES, DISRUPTION_TYPES } = useApp();
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDisruption, setSelectedDisruption] = useState('');
  const [simulating, setSimulating] = useState(false);

  if (!data) return <div className="page-container"><div className="skeleton" style={{ height: 400 }} /></div>;

  const alerts = data.alerts || [];

  const handleTrigger = () => {
    if (!selectedCity || !selectedDisruption) return;
    setSimulating(true);
    setTimeout(() => {
      triggerDisruption(selectedCity, selectedDisruption);
      setSimulating(false);
    }, 2000);
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical': return { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#f87171' };
      case 'warning': return { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', text: '#fbbf24' };
      default: return { bg: 'rgba(20,184,166,0.08)', border: 'rgba(20,184,166,0.25)', text: 'var(--primary-400)' };
    }
  };

  const timeAgo = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime(); // eslint-disable-line react-hooks/purity
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  };

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Disruption Triggers</h1>
        <p className="page-subtitle">Monitor live parametric triggers and simulate disruption events</p>
      </div>

      <div className="triggers-layout animate-fade-in-up delay-1">
        {/* Simulation Panel */}
        <div className="glass-card simulation-panel">
          <div className="panel-header">
            <Zap size={20} style={{ color: 'var(--warning-400)' }} />
            <h3>Simulate Disruption</h3>
          </div>
          <p className="panel-desc">Trigger a parametric event to auto-generate claims for affected workers in the selected city.</p>

          <div className="sim-form">
            <div className="form-group">
              <label className="form-label">Select City</label>
              <select className="form-select" value={selectedCity} onChange={e => setSelectedCity(e.target.value)} id="trigger-city">
                <option value="">Choose a city...</option>
                {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}, {c.state}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Disruption Type</label>
              <div className="disruption-grid">
                {DISRUPTION_TYPES.map(d => (
                  <button
                    key={d.id}
                    className={`disruption-option ${selectedDisruption === d.id ? 'selected' : ''}`}
                    onClick={() => setSelectedDisruption(d.id)}
                    id={`disruption-${d.id}`}
                  >
                    <span className="disruption-option-icon">{d.icon}</span>
                    <span className="disruption-option-name">{d.name}</span>
                    <span className="disruption-option-category">{d.category}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedDisruption && (
              <div className="trigger-info glass-card animate-fade-in">
                {(() => {
                  const d = DISRUPTION_TYPES.find(dt => dt.id === selectedDisruption);
                  return d ? (
                    <>
                      <div className="trigger-info-row"><span>Trigger Threshold</span><strong>{d.triggerThreshold}</strong></div>
                      <div className="trigger-info-row"><span>Avg Duration</span><strong>{d.avgDuration}</strong></div>
                      <div className="trigger-info-row"><span>Payout Multiplier</span><strong>{d.payoutMultiplier}x</strong></div>
                      <div className="trigger-info-row"><span>Category</span><span className="badge badge-primary">{d.category}</span></div>
                    </>
                  ) : null;
                })()}
              </div>
            )}

            <button
              className={`btn-primary trigger-btn ${simulating ? 'simulating' : ''}`}
              onClick={handleTrigger}
              disabled={!selectedCity || !selectedDisruption || simulating}
              id="btn-trigger"
            >
              {simulating ? (
                <>
                  <div className="spinner" /> Processing Trigger...
                </>
              ) : (
                <>
                  <Play size={16} /> Trigger Disruption
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Alerts Feed */}
        <div className="glass-card alerts-panel">
          <div className="panel-header">
            <Activity size={20} style={{ color: '#ef4444' }} />
            <h3>Live Alert Feed</h3>
            <span className="badge badge-danger">{alerts.filter(a => a.status === 'active').length} active</span>
          </div>

          <div className="alerts-feed">
            {alerts.map((alert) => {
              const colors = getAlertColor(alert.type);
              return (
                <div
                  key={alert.id}
                  className="alert-feed-item"
                  style={{ background: colors.bg, borderColor: colors.border }}
                >
                  <div className="alert-feed-left">
                    <span className="alert-feed-icon">{alert.disruption.icon}</span>
                    <div className="alert-feed-content">
                      <div className="alert-feed-header">
                        <span className="alert-feed-city">
                          <MapPin size={12} /> {alert.city}
                        </span>
                        <span className="alert-feed-time">
                          <Clock size={10} /> {timeAgo(alert.timestamp)}
                        </span>
                      </div>
                      <p className="alert-feed-message">{alert.message}</p>
                      <div className="alert-feed-stats">
                        <span><Users size={12} /> {alert.affectedWorkers} workers</span>
                        <span><DollarSign size={12} /> ₹{(alert.estimatedPayout / 1000).toFixed(1)}K est.</span>
                      </div>
                    </div>
                  </div>
                  <span className={`badge badge-${alert.status === 'active' ? 'danger' : alert.status === 'monitoring' ? 'warning' : 'success'}`}>
                    {alert.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Disruption Coverage Cards */}
      <div className="section-header animate-fade-in-up delay-2">
        <h2>Covered Disruption Types</h2>
        <p>Parametric triggers automatically detect these events and initiate claims</p>
      </div>

      <div className="disruption-cards-grid animate-fade-in-up delay-3">
        {DISRUPTION_TYPES.map((d) => (
          <div key={d.id} className="glass-card disruption-card">
            <div className="disruption-card-icon">{d.icon}</div>
            <h4>{d.name}</h4>
            <p>{d.description}</p>
            <div className="disruption-card-meta">
              <div className="meta-item">
                <span>Threshold</span>
                <strong>{d.triggerThreshold}</strong>
              </div>
              <div className="meta-item">
                <span>Duration</span>
                <strong>{d.avgDuration}</strong>
              </div>
              <div className="meta-item">
                <span>Payout</span>
                <strong>{d.payoutMultiplier}x</strong>
              </div>
            </div>
            <span className={`badge badge-${d.category === 'weather' ? 'info' : d.category === 'environment' ? 'warning' : d.category === 'technical' ? 'primary' : 'danger'}`}>
              {d.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
