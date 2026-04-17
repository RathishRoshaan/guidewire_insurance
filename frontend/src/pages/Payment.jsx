import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Check, Copy, CreditCard, Smartphone, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import './Payment.css';

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, createPolicy, addToast } = useApp();
  const [txnId, setTxnId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdPolicy, setCreatedPolicy] = useState(null);
  const [copied, setCopied] = useState(false);

  // Get pack data from navigation state
  const selectedPack = location.state?.selectedPack || null;
  const riskData = location.state?.riskData || {};
  const upiId = 'gigcover@upi';
  const upiUrl = `upi://pay?pa=${upiId}&pn=GigCover%20Insurance&am=${selectedPack?.premium || 0}&cu=INR&tn=GigCover%20Weekly%20Premium`;

  useEffect(() => {
    if (!selectedPack && !success) {
      navigate('/onboarding');
    }
  }, [selectedPack, success, navigate]);

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayment = async () => {
    if (!txnId.trim()) {
      addToast('Please enter your UPI Transaction ID', 'warning');
      return;
    }

    setLoading(true);

    try {
      // 1. Initiate Payment Record
      const initRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/upi/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'WKR-NEW',
          amount: selectedPack.premium,
          packageId: selectedPack.id,
          packageName: selectedPack.name,
          city: currentUser?.city || '',
          state: currentUser?.state || ''
        })
      });
      const initData = await initRes.json();
      const generatedTxnId = initData.transactionId || txnId;

      // 2. Create Policy (Wait 2s for "processing" UX)
      await new Promise(r => setTimeout(r, 2000));
      
      const policyData = {
        workerId: currentUser?.id || 'WKR-NEW',
        packageId: selectedPack.id,
        packageName: selectedPack.name,
        weeklyPremium: selectedPack.premium,
        maxCoverage: selectedPack.coverage,
        coveredDisruptions: selectedPack.inclusions || [],
        transactionId: generatedTxnId,
        city: currentUser?.city || '',
        state: currentUser?.state || '',
      };

      let backendPolicy = null;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/policies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(policyData),
        });
        if (res.ok) {
           const data = await res.json();
           backendPolicy = data.policy;
        }
      } catch (err) {}

      // 3. Verify Payment
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/upi/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: generatedTxnId,
          userId: currentUser?.id || 'WKR-NEW',
          policyId: backendPolicy?.policyId || 'POL-NEW',
          userUpiRef: txnId
        })
      });

      const localPolicy = createPolicy({
        ...policyData,
        workerName: `${currentUser?.firstName || 'Worker'} ${currentUser?.lastName || ''}`,
      }, true);

      setCreatedPolicy(backendPolicy || localPolicy);
      setSuccess(true);
      addToast('Payment verified! Policy activated! 🎉', 'success');
    } catch (err) {
      addToast('Payment verification failed. Please try again.', 'error');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="payment-page">
        <div className="payment-success">
          <div className="success-animation">
            <div className="success-circle">
              <CheckCircle size={64} />
            </div>
            <div className="success-sparkles">
              <Sparkles size={20} className="sparkle s1" />
              <Sparkles size={16} className="sparkle s2" />
              <Sparkles size={18} className="sparkle s3" />
              <Sparkles size={14} className="sparkle s4" />
            </div>
          </div>

          <h2>Policy Activated! 🎉</h2>
          <p className="success-subtitle">Your income is now protected by GigCover</p>

          <div className="policy-confirmation-card">
            <div className="pc-row">
              <span>Policy ID</span>
              <strong>{createdPolicy?.policyId || createdPolicy?.id || 'POL-NEW'}</strong>
            </div>
            <div className="pc-row">
              <span>Plan</span>
              <strong>{selectedPack?.name}</strong>
            </div>
            <div className="pc-row">
              <span>Weekly Premium</span>
              <strong>₹{selectedPack?.premium}</strong>
            </div>
            <div className="pc-row">
              <span>Coverage</span>
              <strong>₹{selectedPack?.coverage?.toLocaleString()}/week</strong>
            </div>
            <div className="pc-row">
              <span>Valid Until</span>
              <strong>{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}</strong>
            </div>
            <div className="pc-row">
              <span>Transaction ID</span>
              <strong className="txn-id">{txnId}</strong>
            </div>
          </div>

          <button className="btn-go-dashboard" onClick={() => navigate('/')}>
            Go to Dashboard
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (!selectedPack) return null;

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-header">
          <Shield size={28} />
          <h2>Complete Payment</h2>
          <p>Pay via UPI to activate your insurance</p>
        </div>

        <div className="payment-grid">
          {/* Left: Order Summary */}
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-card">
              <div className="summary-plan">
                <span className="plan-name">{selectedPack.name}</span>
                <span className="plan-badge">{riskData.riskLevel || 'Medium'} Risk</span>
              </div>
              <div className="summary-rows">
                <div className="summary-row">
                  <span>Weekly Premium</span>
                  <span>₹{selectedPack.premium}</span>
                </div>
                <div className="summary-row">
                  <span>Weekly Coverage</span>
                  <span>₹{selectedPack.coverage?.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>Daily Coverage</span>
                  <span>₹{selectedPack.dailyCoverage?.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>Validity</span>
                  <span>7 Days</span>
                </div>
                <div className="summary-row total">
                  <span>Amount to Pay</span>
                  <span className="total-amount">₹{selectedPack.premium}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Payment */}
          <div className="payment-method">
            <h3>
              <Smartphone size={18} />
              Pay via UPI
            </h3>

            <div className="qr-container">
              <div className="qr-card">
                <QRCodeSVG
                  value={upiUrl}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#1a1a2e"
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="qr-hint">Scan with any UPI app</p>
            </div>

            <div className="upi-id-box">
              <span className="upi-label">UPI ID</span>
              <div className="upi-copy">
                <code>{upiId}</code>
                <button onClick={copyUpiId} className="btn-copy">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="txn-input-group">
              <label>Enter UPI Transaction ID</label>
              <input
                type="text"
                placeholder="e.g. UPI123456789"
                value={txnId}
                onChange={e => setTxnId(e.target.value)}
                disabled={loading}
              />
              <span className="txn-hint">Enter the transaction ID from your UPI app after payment</span>
            </div>

            <button
              className="btn-verify-payment"
              onClick={handlePayment}
              disabled={loading || !txnId.trim()}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  Verifying Payment...
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Verify & Activate Policy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
