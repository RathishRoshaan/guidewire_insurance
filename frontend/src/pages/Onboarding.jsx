import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import {
  UserPlus, MapPin, Truck, IndianRupee, Shield,
  CheckCircle, ArrowRight, ArrowLeft, Sparkles,
  ShieldCheck, Zap, Heart, Lock, User, XCircle, Eye, EyeOff, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';

const STEPS = ['Identity', 'Profile', 'Work', 'Risk Analysis', 'Coverage', 'Activation'];

const EXCLUSIONS = [
  'War, Military Conflict & Invasion',
  'Pandemic or Epidemic (Government Notified)',
  'Nuclear, Chemical or Radioactive Events',
  'Terrorism (Declared by Govt. Authority)',
  'Self-Inflicted or Deliberate Disruptions',
];

export default function Onboarding() {
  const { t } = useTranslation();
  const {
    registerWorker,
    createPolicy,
    calculatePremium,
    login,
    CITIES,
    PLATFORMS,
    detectLocation,
    currentLocation,
    fetchWeatherForCity,
    getPackages
  } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    username: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', phone: '', email: '',
    city: '', platform: '', vehicleType: 'Motorcycle',
    avgWeeklyEarning: 8000, avgDeliveriesPerDay: 25,
  });

  const [riskResult, setRiskResult] = useState(null);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [stepError, setStepError] = useState('');

  // 1. Auto-detect location on mount
  useEffect(() => {
    const autoDetect = async () => {
      const loc = await detectLocation();
      if (loc && loc.cityId) {
        setFormData(prev => ({ ...prev, city: loc.cityId }));
      }
    };
    autoDetect();
  }, [detectLocation]);

  // Handle calculation & plan generation
  const runRiskAnalysis = useCallback(async () => {
    setIsScanning(true);
    setStepError('');

    try {
      const cityObj = CITIES.find(c => c.id === formData.city);
      const weather = await fetchWeatherForCity(cityObj);

      // Calculate premium with the new advanced engine
      const res = calculatePremium(formData);
      setRiskResult(res);

      // Get the 3 packages based on the risk calculation
      const pkgs = getPackages(res.weeklyPremium, res.maxCoverage);
      setSelectedPackage(pkgs[1]); // Default to Smart Partner
      setAvailablePackages(pkgs);

      setTimeout(() => {
        setIsScanning(false);
        setStep(4); // Move to coverage choice
      }, 2000);
    } catch (err) {
      setStepError('Failed to analyze risk. Please check your connection.');
      setIsScanning(false);
    }
  }, [formData, CITIES, calculatePremium, fetchWeatherForCity, getPackages]);

  const handleNext = () => {
    setStepError('');
    if (step === 0) {
      if (!formData.username || !formData.password) { setStepError('Username and password required'); return; }
      if (formData.password !== formData.confirmPassword) { setStepError('Passwords do not match'); return; }
    }
    if (step === 1) {
      if (!formData.firstName || !formData.phone) { setStepError('Basic info required'); return; }
    }
    if (step === 2) {
      if (!formData.city || !formData.platform) { setStepError('Please select your city and platform'); return; }
    }
    setStep(s => s + 1);
  };

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      const cityObj = CITIES.find(c => c.id === formData.city);
      const platObj = PLATFORMS.find(p => p.id === formData.platform);

      // 1. Register user in Backend
      const regResult = await registerWorker({ ...formData, city: cityObj, platform: platObj });
      
      // 2. Create Policy in Backend
      await createPolicy({
        workerId: regResult.user.username,
        workerName: regResult.user.fullName,
        city: cityObj.name,
        platform: platObj.name,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        weeklyPremium: selectedPackage.premium,
        maxCoverage: selectedPackage.coverage,
        coveredDisruptions: selectedPackage.inclusions || selectedPackage.included,
        exclusions: selectedPackage.exclusions || selectedPackage.excluded,
      });

      // 3. Log in with the new session
      login('worker', regResult.user, regResult.token);
      navigate('/');
    } catch (err) {
      setStepError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsActivating(false);
    }
  };

  if (!CITIES || !PLATFORMS) return <div className="page-container"><div className="loader" /></div>;

  return (
    <div className="page-container onboarding-page">
      <div className="onboarding-layout">
        {/* Left Side: Progress & Info */}
        <aside className="onboarding-sidebar">
          <div className="logo-group">
            <Shield className="logo-icon-svg" />
            <h2>GigCover</h2>
          </div>

          <div className="stepper-vertical">
            {STEPS.map((s, i) => (
              <div key={i} className={`v-step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
                <div className="v-step-marker">{i < step ? '✓' : i + 1}</div>
                <div className="v-step-content">
                  <span className="v-step-title">{s}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="security-badges" style={{ marginTop: 'auto', display: 'flex', gap: '1rem', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><ShieldCheck size={12} /> Bank-level Security</span>
          </div>
        </aside>

        {/* Right Side: Form Content */}
        <main className="onboarding-main">
          <div className="form-window glass-card">
            {/* Step 0: Account */}
            {step === 0 && (
              <div className="form-section animate-fade-in">
                <header>
                  <h2>{t('common.get_started', 'Create Account')}</h2>
                  <p>{t('onboarding.subtitle_1', 'Secure your protection dashboard')}</p>
                </header>
                <div className="form-grid">
                  <div className="input-group">
                    <label><User size={14} /> Username</label>
                    <input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="e.g. rahul_delivery" />
                  </div>
                  <div className="input-group">
                    <label><Lock size={14} /> Password</label>
                    <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" />
                  </div>
                  <div className="input-group">
                    <label>Confirm Password</label>
                    <input type="password" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="••••••••" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Personal */}
            {step === 1 && (
              <div className="form-section animate-fade-in">
                <header>
                  <h2>Personal Profile</h2>
                  <p>Tell us about yourself</p>
                </header>
                <div className="form-grid">
                  <input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} placeholder="First Name" />
                  <input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} placeholder="Last Name" />
                  <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone Number" />
                  <input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Email Address" />
                </div>
              </div>
            )}

            {/* Step 2: Work Details */}
            {step === 2 && (
              <div className="form-section animate-fade-in">
                <header>
                  <h2>Work Details</h2>
                  <p>Where and how do you work?</p>
                </header>
                <div className="form-grid">
                  <div className="input-group">
                    <label><MapPin size={14} /> Your City</label>
                    <select value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })}>
                      <option value="">Select City</option>
                      {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label><Truck size={14} /> Primary Platform</label>
                    <select value={formData.platform} onChange={e => setFormData({ ...formData, platform: e.target.value })}>
                      <option value="">Select Platform</option>
                      {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label><IndianRupee size={14} /> Weekly Earnings (Avg)</label>
                    <input type="number" value={formData.avgWeeklyEarning} onChange={e => setFormData({ ...formData, avgWeeklyEarning: parseInt(e.target.value) })} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Risk Scan */}
            {step === 3 && (
              <div className="form-section risk-scan-section animate-fade-in">
                <div className="scan-content">
                  <div className={`scan-orb ${isScanning ? 'scanning' : ''}`}>
                    <Sparkles size={40} />
                  </div>
                  <h2>AI Risk Assessment</h2>
                  <p>We're scanning rainfall patterns, traffic congestion, and {formData.platform} server health in {CITIES.find(c => c.id === formData.city)?.name || currentLocation?.city || 'your area'}.</p>

                  {currentLocation?.city && (
                    <div className="loc-badge">
                      <MapPin size={12} /> Detected: {currentLocation.city}, {currentLocation.state}
                    </div>
                  )}

                  {!isScanning ? (
                    <button className="scan-btn" onClick={runRiskAnalysis}>
                      Start G5 AI Scan <ArrowRight size={18} />
                    </button>
                  ) : (
                    <div className="scanning-steps">
                      <span>Analyzing Seasonal Rain Data...</span>
                      <div className="mini-progress"><div className="fill" /></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Coverage Selection */}
            {step === 4 && (
              <div className="form-section plan-selection animate-fade-in">
                <header>
                  <h2>Choose Your Protection</h2>
                  <p>Personalized plans based on your Risk Score: <strong>{riskResult?.riskScore}</strong></p>
                </header>

                <div className="plans-horizontal">
                  {availablePackages.map(pkg => (
                    <div
                      key={pkg.id}
                      className={`plan-option ${selectedPackage?.id === pkg.id ? 'selected' : ''} ${pkg.recommended ? 'prime-bg' : ''}`}
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      {pkg.recommended && <div className="rec-tag">Recommended</div>}
                      <h3>{pkg.name}</h3>
                      <div className="price-tag">
                        <span className="cur">₹</span>
                        <span className="amt">{pkg.premium}</span>
                        <span className="dur">/wk</span>
                      </div>

                      <div className="pkg-features">
                        <div className="feat-list plus">
                          <span>Included:</span>
                          {(pkg.inclusions || pkg.included)?.map((f, i) => <div key={i} className="f-row"><CheckCircle size={10} /> {f}</div>)}
                        </div>
                        <div className="feat-list minus">
                          <span>Excluded:</span>
                          {(pkg.exclusions || pkg.excluded)?.map((f, i) => <div key={i} className="f-row"><XCircle size={10} /> {f}</div>)}
                        </div>
                      </div>

                      <div className="pkg-coverage">
                        Coverage: <strong>₹{pkg.coverage.toLocaleString()}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Activation */}
            {step === 5 && (
              <div className="form-section activation-summary animate-fade-in">
                <header>
                  <h2>Review & Activate</h2>
                  <p>Almost there, {formData.firstName}!</p>
                </header>

                <div className="summary-box">
                  <div className="summary-row">
                    <span>Plan selected</span>
                    <strong>{selectedPackage?.name}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Weekly Premium</span>
                    <strong className="text-accent">₹{selectedPackage?.premium}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Max Payout</span>
                    <strong>₹{selectedPackage?.coverage.toLocaleString()}</strong>
                  </div>
                  <hr />
                  <div className="exclusions-list">
                    <p><Info size={12} /> Standard insurance exclusions apply: {EXCLUSIONS.join(', ')}.</p>
                  </div>
                </div>

                <div className="terms-agreement">
                  <input type="checkbox" id="terms" defaultChecked />
                  <label htmlFor="terms">I agree to the parametric trigger conditions and auto-renewal terms.</label>
                </div>
              </div>
            )}

            {stepError && <div className="step-err-msg">⚠️ {stepError}</div>}

            <footer className="form-footer-nav">
              {step > 0 && step !== 3 && step !== 4 && (
                <button className="nav-back" onClick={() => setStep(step - 1)}>
                  <ArrowLeft size={18} /> Back
                </button>
              )}

              {step < 5 && step !== 3 && step !== 4 && (
                <button className="nav-next" onClick={handleNext}>
                  Next <ArrowRight size={18} />
                </button>
              )}

              {step === 4 && (
                <button className="nav-next prime" onClick={() => setStep(5)}>
                  Review Policy <ArrowRight size={18} />
                </button>
              )}

              {step === 5 && (
                <button className="activate-btn" onClick={handleActivate} disabled={isActivating}>
                  {isActivating ? 'Activating Protection...' : 'Confirm & Activate'}
                  <Shield size={18} />
                </button>
              )}
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
