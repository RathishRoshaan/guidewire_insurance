import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck, AlertTriangle, TrendingUp, History,
  MapPin, CloudRain, Thermometer, Wind, Zap,
  ChevronRight, ArrowRight, User, Package
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './WorkerDashboard.css';

export default function WorkerDashboard() {
  const {
    data, currentUser, currentLocation, locationLoading,
    weatherData, generateRiskAssessment, weatherLoading,
    updatePolicy, getPackages, PLAN_FEATURES, CITIES, PLATFORMS,
    getBackendRisk
  } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [backendRisk, setBackendRisk] = useState(null);

  useEffect(() => {
    if (CITIES) window.CITIES = CITIES;
    if (PLATFORMS) window.PLATFORMS = PLATFORMS;
  }, [CITIES, PLATFORMS]);

  const userPolicy = useMemo(() => {
    if (!data?.policies || !currentUser?.id) return null;
    const policies = data.policies.filter(p => p.workerId === currentUser.id);
    if (!policies.length) return null;
    return policies.find(p => p.status === 'active') || policies.sort((a, b) => new Date(b.endDate) - new Date(a.endDate))[0];
  }, [data, currentUser]);

  const userClaims = useMemo(() => {
    if (!data?.claims || !currentUser) return [];
    return data.claims.filter(c => c.workerId === currentUser.id).sort((a, b) => new Date(b.claimDate) - new Date(a.claimDate));
  }, [data, currentUser]);

  const [aiMessage, setAiMessage] = useState('Initializing AI analysis...');
  const { getAiRiskAnalysis } = useApp();

  const currentWeather = weatherData[weatherData.length - 1] || {};

  useEffect(() => {
    if (currentLocation && currentWeather?.temperature) {
      getAiRiskAnalysis(currentLocation, currentWeather).then(res => {
        if (res?.summary) {
          setAiMessage(res.summary);
        } else {
          setAiMessage(`Local risk patterns stabilized for ${currentLocation.name}.`);
        }
      }).catch(() => {
        setAiMessage(`Local risk patterns stabilized for ${currentLocation.name}.`);
      });
    }
  }, [currentLocation, currentWeather, getAiRiskAnalysis]);

  useEffect(() => {
    if (currentWeather && currentWeather.rainfall !== undefined) {
      getBackendRisk(currentWeather.rainfall, currentWeather.aqi || 50, currentWeather.temperature)
        .then(res => {
          if (res && res.risk_score !== undefined) {
            setBackendRisk(res.risk_score);
          }
        });
    }
  }, [currentWeather, getBackendRisk]);

  // Handle plan change
  const handleUpgrade = (pkg) => {
    if (!userPolicy) return;
    updatePolicy(userPolicy.id, pkg);
    setShowUpgradeModal(false);
  };

  const daysRemaining = useMemo(() => {
    if (!userPolicy?.endDate) return 0;
    const end = new Date(userPolicy.endDate);
    const now = new Date();
    const diffTime = end - now;
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, [userPolicy]);

  const packages = useMemo(() => {
    if (!userPolicy) return [];
    return getPackages(userPolicy.weeklyPremium / (userPolicy.multiplier || 1.0), userPolicy.maxCoverage / (userPolicy.multiplier || 1.0));
  }, [userPolicy, getPackages]);

  const localRisk = useMemo(() => {
    if (!currentLocation) return null;
    return generateRiskAssessment(currentLocation);
  }, [currentLocation, generateRiskAssessment]);

  if (!currentUser || !data) {
    return <div className="page-container"><div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      <div className="skeleton" style={{ height: 100, borderRadius: 16 }} />
      <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
    </div></div>;
  }

  return (
    <div className="page-container worker-dashboard">
      <header className="dashboard-hero animate-fade-in-up">
        <div className="hero-content">
          <div className="user-profile">
            <div className="avatar">{currentUser.firstName?.[0]}{currentUser.lastName?.[0] || ''}</div>
            <div className="user-info">
              <h1>Namaste, {currentUser.firstName} {currentUser.lastName}!</h1>
              <div className="location-tag">
                <MapPin size={14} />
                {locationLoading
                  ? <span style={{ color: 'var(--text-muted)' }}>Detecting location…</span>
                  : <span>{currentLocation?.name ? `${currentLocation.name}${currentLocation.state ? `, ${currentLocation.state}` : ''}` : 'Location unavailable'}</span>
                }
              </div>
              {currentUser?.username && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>@{currentUser.username}</div>}
            </div>
          </div>
          <div className="hero-risk-badge">
            <ShieldCheck size={20} />
            <div>
              <span>Protection</span>
              <strong className={daysRemaining < 2 ? 'text-danger' : 'text-success'}>
                {daysRemaining <= 0 ? 'Expired' : 'Active'}
              </strong>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Left Column: Stats & Policy */}
        <div className="main-column animate-fade-in-up delay-1">
          <div className="stats-row">
            <div className="glass-card mini-stat">
              <Package size={20} style={{ color: '#6366f1' }} />
              <div className="mini-stat-info">
                <span>Total Coverage</span>
                <strong>₹{userPolicy?.maxCoverage?.toLocaleString() || '0'}</strong>
              </div>
            </div>
            <div className="glass-card mini-stat">
              <Package size={20} style={{ color: '#f59e0b' }} />
              <div className="mini-stat-info">
                <span>Renewal In</span>
                <strong className={daysRemaining < 2 ? 'text-danger' : 'text-accent'}>{daysRemaining} Days</strong>
              </div>
            </div>
            <div className="glass-card mini-stat">
              <History size={20} style={{ color: '#10b981' }} />
              <div className="mini-stat-info">
                <span>Total Payouts</span>
                <strong>₹{currentUser?.totalPayouts?.toLocaleString() || '0'}</strong>
              </div>
            </div>
          </div>

          <div className="glass-card active-policy">
            <div className="card-header">
              <h3><ShieldCheck size={18} /> {userPolicy?.packageName || 'Standard'} Plan</h3>
              <div className="header-actions">
                {daysRemaining > 0 && (
                  <button className="btn-secondary btn-xs" onClick={() => setShowUpgradeModal(true)}>Change Plan</button>
                )}
                <span className={`badge ${daysRemaining < 2 ? 'badge-danger' : 'badge-success'}`}>
                  {daysRemaining <= 0 ? 'Expired' : `${daysRemaining} Days Left`}
                </span>
              </div>
            </div>
            {userPolicy ? (
              <div className="policy-details">
                {daysRemaining <= 0 && (
                  <div className="expired-notice" style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--error-400)', color: 'var(--text-primary)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--error-400)' }}>Protection Expired</strong>
                      <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>Your coverage has ended. Renew now to stay protected.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-primary btn-sm" onClick={() => setShowUpgradeModal(true)}>Renew Plan</button>
                      <button className="btn-secondary btn-sm" onClick={() => setShowUpgradeModal(true)}>Change Plan</button>
                    </div>
                  </div>
                )}
                <div className="policy-meta">
                  <div className="meta-item">
                    <span>Valid Until</span>
                    <strong className={daysRemaining <= 0 ? 'text-danger' : ''}>{userPolicy?.endDate}</strong>
                  </div>
                  <div className="meta-item">
                    <span>Policy ID</span>
                    <strong>{userPolicy?.id}</strong>
                  </div>
                  <div className="meta-item">
                    <span>Weekly Premium</span>
                    <strong>₹{userPolicy?.weeklyPremium}/wk</strong>
                  </div>
                </div>

                <div className="plan-comparison-mini">
                  <div className="comp-row">
                    <span className="label">Included:</span>
                    <div className="tag-group">
                      {userPolicy?.coveredDisruptions?.map((f, i) => (
                        <span key={i} className="badge badge-info">{f}</span>
                      ))}
                    </div>
                  </div>
                  <div className="comp-row">
                    <span className="label">Excluded:</span>
                    <div className="tag-group opacity-50">
                      {PLAN_FEATURES[userPolicy.packageId || 'standard']?.excluded?.map((f, i) => (
                        <span key={i} className="badge badge-danger">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No active policy found.</div>
            )}
          </div>

          {/* Upgrade Modal Overlay (Simulated) */}
          {showUpgradeModal && (
            <div className="modal-overlay">
              <div className="glass-card upgrade-modal animate-scale-in">
                <h3>Upgrade / Change Plan</h3>
                <p>Select a new protection level for next week</p>
                <div className="upgrade-options">
                  {packages.map(pkg => (
                    <div key={pkg.id} className={`upgrade-card ${pkg.id === userPolicy.packageId ? 'active' : ''}`} onClick={() => handleUpgrade(pkg)}>
                      <div className="u-header">
                        <strong>{pkg.name}</strong>
                        <span className="u-price">₹{pkg.premium}/wk</span>
                      </div>
                      <div className="u-coverage">₹{pkg.coverage.toLocaleString()} coverage</div>
                    </div>
                  ))}
                </div>
                <button className="btn-secondary full-width" onClick={() => setShowUpgradeModal(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Localized AI Prediction */}
          <div className="glass-card ai-prediction-card">
            <div className="card-header">
              <h3><Zap size={18} style={{ color: '#f59e0b' }} /> AI Local Risk Forecast</h3>
              <div className="ai-status">
                <div className="pulse-dot" /> Live Monitoring
              </div>
            </div>
            <div className="prediction-grid">
              <div className="prediction-main">
                <div className="prediction-value">
                  <span className="value">{localRisk?.overallRisk || '--'}</span>
                  <span className="label">Area Risk Score</span>
                </div>
                <p>{aiMessage}</p>
              </div>
              <div className="prediction-chart">
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={weatherData.slice(-12)}>
                    <defs>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="rainfall" stroke="#f59e0b" fill="url(#riskGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="alert-banner-local">
              <AlertTriangle size={16} />
              <span>Heavy Rain Alert: Payouts will trigger if intensity &gt; 50mm/hr</span>
            </div>
            
            {/* Backend ML Sync */}
            <div className="backend-sync-indicator" style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px border var(--border-light)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CloudRain size={14} className="text-accent" />
                <span>Backend ML Sync</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {backendRisk !== null ? (
                  <>
                    <span style={{ color: 'var(--text-muted)' }}>Server Risk:</span>
                    <strong className="text-accent">{backendRisk.toFixed(1)}</strong>
                  </>
                ) : (
                  <span className="animate-pulse">Calculating server-side risk...</span>
                )}
                <div className={`status-dot ${backendRisk !== null ? 'online' : ''}`} style={{ width: 8, height: 8 }} />
              </div>
            </div>
          </div>

          <div className="glass-card recent-claims">
            <div className="card-header">
              <h3><History size={18} /> Recent Claim History</h3>
              <button className="text-btn">View All <ChevronRight size={14} /></button>
            </div>
            <div className="claims-list-worker">
              {userClaims?.slice(0, 3).map(claim => (
                <div key={claim.id} className="claim-item-compact">
                  <div className="claim-icon">{claim.disruptionType.icon}</div>
                  <div className="claim-text">
                    <strong>{claim.disruptionType.name}</strong>
                    <span>{claim.claimDate}</span>
                  </div>
                  <div className="claim-right">
                    <strong>₹{claim.claimAmount}</strong>
                    <span className={`badge badge-${claim.status === 'paid' ? 'success' : 'primary'}`}>
                      {claim.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
              {(!userClaims || userClaims.length === 0) && (
                <div className="empty-msg">No recent claims. Stay safe!</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Local Context & Weather */}
        <div className="side-column animate-fade-in-up delay-2">
          <div className="glass-card local-weather">
            <h3>Local Conditions</h3>
            <div className="weather-grid">
              <div className="weather-item">
                <Thermometer size={16} />
                <span>{currentWeather.temperature?.toFixed(0)}°C</span>
              </div>
              <div className="weather-item">
                <CloudRain size={16} />
                <span>{currentWeather.rainfall}mm</span>
              </div>
              <div className="weather-item">
                <Wind size={16} />
                <span>{currentWeather.windSpeed}km/h</span>
              </div>
            </div>
            <div className="aqi-meter">
              <div className="aqi-row">
                <span>Air Quality</span>
                <strong>{currentWeather.aqi} AQI</strong>
              </div>
              <div className="aqi-bar">
                <div className="aqi-fill" style={{ width: `${Math.min(currentWeather.aqi / 4, 100)}%`, background: currentWeather.aqi > 200 ? '#ef4444' : '#10b981' }} />
              </div>
            </div>
          </div>

          <div className="glass-card safety-tips">
            <h3><ShieldCheck size={18} style={{ color: '#10b981' }} /> AI Safety Guard</h3>
            <ul className="tips-list">
              <li>Avoid {currentLocation?.name} coastal roads between 5-7 PM.</li>
              <li>Monsoon visibility reduction detected. Drive below 30km/h.</li>
              <li>High pollution in Central nodes. Recommended mask usage.</li>
            </ul>
          </div>

          <div className="platform-status-mini">
            <div className="status-header">
              <Package size={16} />
              <span>Platform Status ({typeof currentUser.platform === 'object' ? currentUser.platform?.name : currentUser.platform || 'N/A'})</span>
            </div>
            <div className="status-indicator">
              <div className="status-dot online" />
              <span>Orders: High Volume</span>
            </div>
          </div>

          <div className="support-card glass-card">
            <h4>Need Help?</h4>
            <p>24/7 AI Claims assistant for faster resolution</p>
            <button className="btn-secondary full-width">Chat with Assistant</button>
          </div>
        </div>
      </div>
    </div>
  );
}
