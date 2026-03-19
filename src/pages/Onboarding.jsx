import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  UserPlus, MapPin, Truck, DollarSign, Shield, 
  CheckCircle, ArrowRight, ArrowLeft, Sparkles, 
  AlertCircle, ShieldCheck, Zap, Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';

const STEPS = ['Personal Info', 'Work Details', 'AI Risk Profile', 'Choose Package', 'Review'];

const PACKAGES = [
  {
    id: 'basic',
    name: 'Essential Guard',
    icon: <Shield size={20} />,
    color: 'var(--primary-400)',
    multiplier: 0.8,
    coverage: 0.6,
    features: ['Auto-Claim: Heavy Rain', 'Auto-Claim: Heatwave', 'Standard Support']
  },
  {
    id: 'standard',
    name: 'Smart Partner',
    icon: <Zap size={20} />,
    color: 'var(--accent-400)',
    multiplier: 1.0,
    coverage: 0.75,
    recommended: true,
    features: ['Everything in Basic', 'Auto-Claim: Flooding', 'Auto-Claim: AQI > 400', 'Priority Support']
  },
  {
    id: 'prime',
    name: 'Total Resilience',
    icon: <Heart size={20} />,
    color: 'var(--warning-400)',
    multiplier: 1.3,
    coverage: 1.0,
    features: ['Everything in Smart', 'Auto-Claim: Traffic > 4hrs', 'Free Health Consultation', 'Instant UPI Payout']
  }
];

export default function Onboarding() {
  const { registerWorker, createPolicy, calculatePremium, login, CITIES, PLATFORMS, DISRUPTION_TYPES } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[1]);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    city: '', platform: '', vehicleType: 'Motorcycle',
    avgWeeklyEarning: 5000, avgDeliveriesPerDay: 40,
  });
  const [premiumResult, setPremiumResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculateRisk = () => {
    const result = calculatePremium(formData);
    setPremiumResult(result);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    const cityObj = CITIES.find(c => c.id === formData.city);
    const platformObj = PLATFORMS.find(p => p.id === formData.platform);

    // Simulation delay
    setTimeout(() => {
      const worker = registerWorker({
        ...formData,
        email: formData.email || `worker_${Date.now()}@gigshield.com`,
        city: cityObj,
        platform: platformObj,
        riskScore: premiumResult?.riskScore || 50,
      });

      createPolicy({
        workerId: worker.id,
        workerName: `${formData.firstName} ${formData.lastName}`,
        city: cityObj.name,
        platform: platformObj.name,
        weeklyPremium: Math.round(premiumResult.weeklyPremium * selectedPackage.multiplier),
        maxCoverage: Math.round(premiumResult.maxCoverage * selectedPackage.coverage),
        riskScore: premiumResult.riskScore,
        coveredDisruptions: selectedPackage.features, // Simplified for demo
        autoRenew: true,
        packageId: selectedPackage.id
      });

      // Log in automatically
      login('worker', worker);
      navigate('/');
    }, 1500);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return formData.firstName && formData.lastName && formData.phone;
      case 1: return formData.city && formData.platform && formData.avgWeeklyEarning > 0;
      case 2: return premiumResult !== null;
      case 3: return selectedPackage !== null;
      default: return true;
    }
  };

  return (
    <div className="page-container onboarding-page">
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Secure Your Income</h1>
        <p className="page-subtitle">Join 1M+ partners who protect their daily earnings with AI</p>
      </div>

      <div className="stepper animate-fade-in-up delay-1">
        {STEPS.map((s, i) => (
          <div key={i} className={`step ${i === step ? 'active' : i < step ? 'completed' : ''}`}>
            <div className="step-number">
              {i < step ? <CheckCircle size={16} /> : i + 1}
            </div>
            <span className="step-label">{s}</span>
            {i < STEPS.length - 1 && <div className="step-line" />}
          </div>
        ))}
      </div>

      <div className="onboarding-content animate-fade-in-up delay-2">
        <div className="glass-card form-card">
          {step === 0 && (
            <div className="form-step">
              <div className="step-header">
                <UserPlus size={24} style={{ color: 'var(--primary-400)' }} />
                <div>
                  <h3>Personal Identity</h3>
                  <p>Tell us who you are so we can verify your account</p>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input className="form-input" placeholder="e.g. Rajesh" value={formData.firstName} onChange={e => updateField('firstName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input className="form-input" placeholder="e.g. Kumar" value={formData.lastName} onChange={e => updateField('lastName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>WhatsApp Number</label>
                  <input className="form-input" placeholder="+91 00000 00000" value={formData.phone} onChange={e => updateField('phone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Email (for digital policy)</label>
                  <input className="form-input" placeholder="ajay@example.com" value={formData.email} onChange={e => updateField('email', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="form-step">
              <div className="step-header">
                <Truck size={24} style={{ color: 'var(--accent-400)' }} />
                <div>
                  <h3>Platform & Earnings</h3>
                  <p>We use this to calculate your parametric coverage needs</p>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Working City</label>
                  <select className="form-select" value={formData.city} onChange={e => updateField('city', e.target.value)}>
                    <option value="">Select city</option>
                    {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Deliver Platform</label>
                  <select className="form-select" value={formData.platform} onChange={e => updateField('platform', e.target.value)}>
                    <option value="">Choose platform</option>
                    {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Avg. Weekly Earning (₹)</label>
                  <input className="form-input" type="number" value={formData.avgWeeklyEarning} onChange={e => updateField('avgWeeklyEarning', parseInt(e.target.value) || 0)} />
                </div>
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select className="form-select" value={formData.vehicleType} onChange={e => updateField('vehicleType', e.target.value)}>
                    <option value="Bicycle">Bicycle</option>
                    <option value="E-bike">E-bike</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Motorcycle">Motorcycle</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step">
               <div className="step-header">
                <Sparkles size={24} style={{ color: 'var(--warning-400)' }} />
                <div>
                  <h3>AI Risk Assessment</h3>
                  <p>Our G5 model is analyzing your local risk profile...</p>
                </div>
              </div>

              {!premiumResult ? (
                <div className="risk-calculate-section">
                  <div className="risk-factors glass-card">
                    <h4>Real-time Data Points</h4>
                    <div className="factor-list">
                      <div className="factor-item"><MapPin size={16} /> Location: {CITIES.find(c=>c.id===formData.city)?.name} Risk Index</div>
                      <div className="factor-item"><Truck size={16} /> Vehicle Factor: {formData.vehicleType}</div>
                      <div className="factor-item"><Shield size={16} /> Current Monsoon Probability</div>
                    </div>
                  </div>
                  <button className="btn-primary calculate-btn" onClick={handleCalculateRisk}>
                    <Sparkles size={16} /> Run GigShield G5 Risk Scan
                  </button>
                </div>
              ) : (
                <div className="risk-result animate-fade-in-up">
                  <div className="risk-score-display">
                    <div className="risk-score-circle" style={{
                      '--score': premiumResult.riskScore,
                      '--color': premiumResult.riskScore > 70 ? '#ef4444' : '#10b981'
                    }}>
                      <span className="risk-score-value">{premiumResult.riskScore}</span>
                      <span className="risk-score-label">Risk Profile</span>
                    </div>
                    <div className="premium-details">
                      <p>AI Scan Complete. You are eligible for an instant-payout protection plan in {formData.city}.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="form-step">
              <div className="step-header">
                <ShieldCheck size={24} style={{ color: 'var(--accent-400)' }} />
                <div>
                  <h3>Select Your Policy</h3>
                  <p>Choose the level of coverage that fits your budget</p>
                </div>
              </div>
              
              <div className="package-grid">
                {PACKAGES.map(pkg => (
                  <div 
                    key={pkg.id} 
                    className={`package-card glass-card ${selectedPackage?.id === pkg.id ? 'active' : ''} ${pkg.recommended ? 'recommended' : ''}`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    {pkg.recommended && <div className="recommended-badge">Recommended</div>}
                    <div className="package-name" style={{ color: pkg.color }}>{pkg.name}</div>
                    <div className="package-price">
                       <span className="amount">₹{Math.round(premiumResult.weeklyPremium * pkg.multiplier)}</span>
                       <span className="period">/week</span>
                    </div>
                    <div className="package-features">
                      {pkg.features.map((f, i) => (
                        <div key={i} className="package-feature covered">
                          <CheckCircle size={14} />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="form-step">
              <div className="step-header">
                <ShieldCheck size={24} style={{ color: 'var(--accent-400)' }} />
                <div>
                  <h3>Review Your Plan</h3>
                  <p>Read the parametric triggers and confirm protection</p>
                </div>
              </div>
              <div className="review-section">
                <div className="review-card glass-card">
                  <h4>Protection Summary</h4>
                  <div className="review-grid">
                    <div className="review-item"><span>Partner</span><strong>{formData.firstName} {formData.lastName}</strong></div>
                    <div className="review-item"><span>City</span><strong>{formData.city}</strong></div>
                    <div className="review-item"><span>Plan</span><strong>{selectedPackage.name}</strong></div>
                    <div className="review-item"><span>Coverage</span><strong className="text-accent">₹{Math.round(premiumResult.maxCoverage * selectedPackage.coverage).toLocaleString()} /week</strong></div>
                    <div className="review-item"><span>Weekly Premium</span><strong className="text-accent">₹{Math.round(premiumResult.weeklyPremium * selectedPackage.multiplier)}</strong></div>
                  </div>
                </div>
                <div className="alert-banner-info">
                   <Zap size={16} />
                   <span>Parametric Trigger: Payouts are instant when weather/platform criteria are met. No claim forms required.</span>
                </div>
              </div>
            </div>
          )}

          <div className="form-nav">
             {step > 0 && (
               <button className="btn-secondary" onClick={() => setStep(s => s - 1)}>
                 <ArrowLeft size={16} /> Back
               </button>
             )}
             <div style={{ flex: 1 }} />
             {step < 4 ? (
               <button className="btn-primary" onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
                 Next <ArrowRight size={16} />
               </button>
             ) : (
               <button className="btn-accent" onClick={handleSubmit} disabled={isSubmitting}>
                 {isSubmitting ? <div className="loader" /> : (
                   <>
                     <Lock size={16} /> Activate Protection Now
                   </>
                 )}
               </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
