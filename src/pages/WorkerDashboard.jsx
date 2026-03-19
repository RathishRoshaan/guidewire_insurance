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
  const { data, currentUser, currentLocation, detectLocation, weatherData, generateRiskAssessment } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!currentLocation) {
      setTimeout(detectLocation, 1000);
    }
  }, [detectLocation, currentLocation]);

  if (!currentUser || !data) {
    return <div className="page-container"><div className="skeleton" style={{ height: 400 }} /></div>;
  }

  const userPolicy = data.policies.find(p => p.workerId === currentUser.id && p.status === 'active');
  const userClaims = data.claims.filter(c => c.workerId === currentUser.id).sort((a,b) => new Date(b.claimDate) - new Date(a.claimDate));
  
  const localRisk = useMemo(() => {
    if (!currentLocation) return null;
    return generateRiskAssessment(currentLocation);
  }, [currentLocation, generateRiskAssessment]);

  const currentWeather = weatherData[weatherData.length - 1] || {};

  return (
    <div className="page-container worker-dashboard">
      <header className="dashboard-hero animate-fade-in-up">
        <div className="hero-content">
          <div className="user-profile">
            <div className="avatar">{currentUser.firstName[0]}{currentUser.lastName[0]}</div>
            <div className="user-info">
              <h1>Namaste, {currentUser.firstName}!</h1>
              <div className="location-tag">
                <MapPin size={14} />
                <span>{currentLocation?.name || 'Detecting Area...'}</span>
              </div>
            </div>
          </div>
          <div className="hero-risk-badge">
            <ShieldCheck size={20} />
            <div>
              <span>Protection</span>
              <strong>Active</strong>
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
                <span>Earned Guard</span>
                <strong>₹{userPolicy?.maxCoverage?.toLocaleString() || '0'}</strong>
              </div>
            </div>
            <div className="glass-card mini-stat">
              <TrendingUp size={20} style={{ color: '#10b981' }} />
              <div className="mini-stat-info">
                <span>Avg. Earning</span>
                <strong>₹{currentUser?.avgWeeklyEarning?.toLocaleString() || '0'}</strong>
              </div>
            </div>
            <div className="glass-card mini-stat">
              <History size={20} style={{ color: '#f59e0b' }} />
              <div className="mini-stat-info">
                <span>Total Payouts</span>
                <strong>₹{currentUser?.totalPayouts?.toLocaleString() || '0'}</strong>
              </div>
            </div>
          </div>

          <div className="glass-card active-policy">
            <div className="card-header">
              <h3><ShieldCheck size={18} /> Active Protection Plan</h3>
              <span className="badge badge-success">Live</span>
            </div>
            <div className="policy-details">
              <div className="policy-meta">
                <div className="meta-item">
                  <span>Coverage Period</span>
                  <strong>{userPolicy?.startDate} — {userPolicy?.endDate}</strong>
                </div>
                <div className="meta-item">
                  <span>Policy ID</span>
                  <strong>{userPolicy?.id}</strong>
                </div>
                <div className="meta-item">
                  <span>Premium</span>
                  <strong>₹{userPolicy?.weeklyPremium}/week</strong>
                </div>
              </div>
              <div className="covered-list">
                <span>Auto-Claim on:</span>
                <div className="tag-group">
                  {userPolicy?.coveredDisruptions.slice(0, 4).map(id => (
                    <span key={id} className="badge badge-info">{id.replace('_', ' ')}</span>
                  ))}
                  <span className="more">+2 more</span>
                </div>
              </div>
            </div>
          </div>

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
                <p>High risk of heavy rain between 4 PM - 8 PM in {currentLocation?.name}</p>
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
              <span>Platform Status ({currentUser.platform.name})</span>
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
