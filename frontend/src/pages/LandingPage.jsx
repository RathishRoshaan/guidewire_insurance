import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MapPin, Shield, Zap, Cloud, Wind, Thermometer, Droplets, ChevronDown, ArrowRight, Star, Check, X, Activity, IndianRupee } from 'lucide-react';
import './LandingPage.css';

const STATES = [
  'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana',
  'West Bengal', 'Gujarat', 'Rajasthan', 'Kerala', 'Uttar Pradesh',
];

export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { detectLocation, currentLocation, weatherData, weatherLoading, locationLoading, getStatePlanDiscovery } = useApp();
  const [selectedState, setSelectedState] = useState('Maharashtra');
  const [weeklyIncome, setWeeklyIncome] = useState(7000);
  const [packages, setPackages] = useState([]);
  const [riskData, setRiskData] = useState(null);
  const [loadingPacks, setLoadingPacks] = useState(false);
  const [currentWeather, setCurrentWeather] = useState(null);

  // Auto-detect location on mount
  useEffect(() => {
    detectLocation();
  }, []);

  // When location is detected, set the state
  useEffect(() => {
    if (currentLocation?.state) {
      const matchedState = STATES.find(s =>
        currentLocation.state.toLowerCase().includes(s.toLowerCase()) ||
        s.toLowerCase().includes(currentLocation.state.toLowerCase())
      );
      if (matchedState) setSelectedState(matchedState);
    }
  }, [currentLocation]);

  // Extract current weather from data
  useEffect(() => {
    if (weatherData && weatherData.length > 0) {
      const currentHour = new Date().getHours();
      const current = weatherData.find(d => parseInt(d.time) === currentHour) || weatherData[weatherData.length - 1];
      setCurrentWeather(current);
    }
  }, [weatherData]);

  // Fetch packages for selected state
  useEffect(() => {
    fetchStatePricing(selectedState, weeklyIncome);
  }, [selectedState, weeklyIncome]);

  async function fetchStatePricing(state, income) {
    setLoadingPacks(true);
    try {
      const res = await backendApi.getStatePricing(state);
      setRiskData({
        riskScore: res.riskScore,
        riskLevel: res.riskLevel,
        stateLabel: res.stateLabel || state + ' Zone',
        riskFactors: res.riskFactors || [],
      });
      setPackages(res.packages);
    } catch (err) {
      console.error('Failed to fetch state pricing:', err);
      // Minimal fallback
      setRiskData({ riskScore: 50, riskLevel: 'Medium', stateLabel: state + ' Zone', riskFactors: [] });
    }
    setLoadingPacks(false);
  }

  const riskBadgeClass = (level) => {
    if (!level) return 'risk-badge-medium';
    if (level === 'Low') return 'risk-badge-low';
    if (level === 'High') return 'risk-badge-high';
    return 'risk-badge-medium';
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <header className="landing-hero">
        <div className="hero-bg-shapes">
          <div className="shape shape-1" />
          <div className="shape shape-2" />
          <div className="shape shape-3" />
        </div>
        <nav className="landing-nav">
          <div className="nav-brand">
            <Shield size={28} />
            <span>GigCover</span>
          </div>
          <div className="nav-actions">
            <button className="btn-ghost" onClick={() => navigate('/login')}>Login</button>
            <button className="btn-primary-sm" onClick={() => navigate('/onboarding')}>Get Started</button>
          </div>
        </nav>

        <div className="hero-content">
          <div className="hero-badge">
            <Zap size={14} />
            {t('landing.hero_badge', 'AI-Powered Parametric Insurance')}
          </div>
          <h1>{t('landing.hero_title_1', 'Protect Your Income,')}<br /><span className="gradient-text">{t('landing.hero_title_2', 'Rain or Shine')}</span></h1>
          <p className="hero-subtitle">
            {t('landing.hero_subtitle', "India's first AI-powered parametric insurance for gig workers. Automatic claim detection, instant payouts — no paperwork, no delays.")}
          </p>
          <div className="hero-cta">
            <button className="btn-hero" onClick={() => navigate('/onboarding')}>
              <Shield size={18} />
              {t('landing.get_covered', 'Get Covered Now')}
              <ArrowRight size={18} />
            </button>
            <div className="hero-stats">
              <div className="stat"><strong>10K+</strong><span>Workers Protected</span></div>
              <div className="stat"><strong>₹2.5Cr</strong><span>Claims Paid</span></div>
              <div className="stat"><strong>98%</strong><span>Auto-Approved</span></div>
            </div>
          </div>
        </div>
      </header>

      {/* Live Weather Strip */}
      {currentWeather && (
        <section className="weather-strip">
          <div className="weather-strip-inner">
            <div className="ws-location">
              <MapPin size={16} />
              <span>{currentLocation?.name || 'Detecting...'}, {currentLocation?.state || ''}</span>
              {locationLoading && <span className="loading-dot">●</span>}
            </div>
            <div className="ws-metrics">
              <div className="ws-metric">
                <Thermometer size={14} />
                <span>{currentWeather.temperature?.toFixed(1) || '--'}°C</span>
              </div>
              <div className="ws-metric">
                <Droplets size={14} />
                <span>{currentWeather.rainfall?.toFixed(1) || '0'}mm</span>
              </div>
              <div className={`ws-metric ${(currentWeather.aqi || 0) > 200 ? 'aqi-danger' : (currentWeather.aqi || 0) > 100 ? 'aqi-warn' : 'aqi-good'}`}>
                <Wind size={14} />
                <span>AQI {currentWeather.aqi || '--'}</span>
              </div>
              <div className="ws-metric">
                <Cloud size={14} />
                <span>{currentWeather.humidity?.toFixed(0) || '--'}% Humidity</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Insurance Packs Section */}
      <section className="packs-section">
        <div className="packs-header">
          <h2>Choose Your <span className="gradient-text">Protection Plan</span></h2>
          <p>Dynamic pricing powered by AI — adjusted for your state's real-time risk profile</p>

          <div className="state-selector" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div className="selector-group" style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.2rem 1rem' }}>
              <MapPin size={16} />
              <select value={selectedState} onChange={e => setSelectedState(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', padding: '0.5rem', outline: 'none', appearance: 'none', paddingRight: '1rem' }}>
                {STATES.map(s => <option key={s} value={s} style={{background: '#111'}}>{s}</option>)}
              </select>
              <ChevronDown size={16} className="select-arrow" style={{marginLeft: '-1rem', pointerEvents: 'none'}} />
            </div>
            
            <div className="selector-group" style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.2rem 1rem' }}>
              <IndianRupee size={16} />
              <input 
                type="number" 
                value={weeklyIncome} 
                onChange={e => setWeeklyIncome(parseInt(e.target.value) || 0)}
                style={{ background: 'transparent', border: 'none', color: '#fff', padding: '0.5rem', outline: 'none', width: '100px' }}
                placeholder="Income"
              />
              <span style={{ fontSize: '0.8rem', color: '#aaa', marginLeft: '0.5rem' }}>/ week</span>
            </div>
          </div>

          {riskData && (
            <div className="state-risk-summary">
              <div className={`risk-badge ${riskBadgeClass(riskData.riskLevel)}`}>
                <Activity size={14} />
                Risk Score: {riskData.riskScore}/100 — {riskData.riskLevel}
              </div>
              {riskData.stateLabel && <span className="state-label">{riskData.stateLabel}</span>}
            </div>
          )}
        </div>

        <div className="packs-grid">
          {loadingPacks ? (
            <div className="packs-loading">
              <div className="spinner" />
              <p>Calculating AI-powered pricing...</p>
            </div>
          ) : packages.map((pkg, idx) => (
            <div key={pkg.id} className={`pack-card ${pkg.recommended ? 'pack-recommended' : ''}`}>
              {pkg.recommended && (
                <div className="recommended-badge">
                  <Star size={12} /> Recommended
                </div>
              )}
              <div className="pack-header">
                <h3>{pkg.name}</h3>
                <div className={`risk-badge ${riskBadgeClass(pkg.riskLevel)}`}>
                  {pkg.riskLevel} Risk
                </div>
              </div>

              <div className="pack-pricing">
                <div className="price-main">
                  <span className="currency">₹</span>
                  <span className="amount">{pkg.premium}</span>
                  <span className="period">/week</span>
                </div>
                <div className="price-coverage">
                  Coverage: <strong>₹{pkg.coverage?.toLocaleString()}</strong>/week
                </div>
                <div className="price-daily">
                  Daily: <strong>₹{pkg.dailyCoverage?.toLocaleString()}</strong>/day
                </div>
              </div>

              {pkg.triggers && (
                <div className="pack-triggers">
                  <h4>⚡ Auto-Trigger Thresholds</h4>
                  <div className="trigger-list">
                    <span>🌧️ {pkg.triggers.rain}</span>
                    <span>😷 {pkg.triggers.aqi}</span>
                    <span>🔥 {pkg.triggers.temp}</span>
                  </div>
                </div>
              )}

              <div className="pack-features">
                <h4>✅ Inclusions</h4>
                <ul className="inclusions">
                  {(pkg.inclusions || pkg.included)?.map((item, i) => (
                    <li key={i}><Check size={14} className="icon-check" /> {item}</li>
                  ))}
                </ul>
                <h4>❌ Exclusions</h4>
                <ul className="exclusions">
                  {(pkg.exclusions || pkg.excluded)?.map((item, i) => (
                    <li key={i}><X size={14} className="icon-x" /> {item}</li>
                  ))}
                </ul>
              </div>

              <button className="btn-pack" onClick={() => navigate('/onboarding')}>
                {pkg.recommended ? 'Get Started — Best Value' : 'Choose Plan'}
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section">
        <h2>How <span className="gradient-text">GigCover</span> Works</h2>
        <div className="steps-grid">
          {[
            { icon: '📝', title: 'Register', desc: 'Sign up with your gig platform details and location' },
            { icon: '🤖', title: 'AI Risk Assessment', desc: 'Our ML engine calculates your personalized risk score' },
            { icon: '💳', title: 'Choose & Pay', desc: 'Select a plan and pay via UPI — takes 30 seconds' },
            { icon: '⚡', title: 'Auto Protection', desc: 'Claims trigger automatically when weather thresholds are breached' },
          ].map((step, i) => (
            <div key={i} className="step-card">
              <div className="step-number">{i + 1}</div>
              <div className="step-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Shield size={22} />
            <span>GigCover</span>
            <p>AI-Powered Parametric Insurance for India's Gig Workers</p>
          </div>
          <div className="footer-note">
            © 2026 GigCover • Built for Guidewire Hackathon
          </div>
        </div>
      </footer>
    </div>
  );
}
