import { useState } from 'react';
import { Shield, User, Lock, LayoutDashboard, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Login.css';

export default function Login() {
  const { login, data } = useApp();
  const navigate = useNavigate();
  const [role, setRole] = useState('worker'); // 'admin' or 'worker'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulation: just pick any worker if it's a worker login for demo
    setTimeout(() => {
      if (role === 'admin') {
        login('admin');
      } else {
        const worker = data?.workers?.find(w => w.email === email) || data?.workers[0];
        login('worker', worker);
      }
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="visual-content">
          <div className="logo-group">
            <div className="logo-icon">
              <Shield size={40} />
            </div>
            <h1>GigShield</h1>
          </div>
          <h2>AI-Powered Parametric Income Protection</h2>
          <p>Protecting the future of 1M+ delivery partners across India.</p>
          
          <div className="visual-features">
            <div className="feature-item">
              <CheckCircle size={20} />
              <span>Instant AI-Triggered Payouts</span>
            </div>
            <div className="feature-item">
              <CheckCircle size={20} />
              <span>Dynamic Risk-Adjusted Premiums</span>
            </div>
            <div className="feature-item">
              <CheckCircle size={20} />
              <span>No Paperwork Required</span>
            </div>
          </div>
        </div>
        <div className="visual-overlay" />
      </div>

      <div className="login-form-container">
        <div className="form-wrapper animate-fade-in-up">
          <div className="form-header">
            <h3>Welcome Back</h3>
            <p>Access your dashboard and protection status</p>
          </div>

          <div className="role-selector">
            <button 
              className={`role-btn ${role === 'worker' ? 'active' : ''}`}
              onClick={() => setRole('worker')}
            >
              <User size={18} />
              <span>Partner</span>
            </button>
            <button 
              className={`role-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
            >
              <LayoutDashboard size={18} />
              <span>Admin</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <User size={18} />
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input type="checkbox" />
                <span className="checkmark" />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>

            <button type="submit" className="login-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <div className="loader" />
              ) : (
                <>
                  Login as {role === 'admin' ? 'Administrator' : 'Partner'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <footer className="form-footer">
            <p>New to GigShield? <button className="text-btn" onClick={() => navigate('/onboarding')}>Create a Protection Plan</button></p>
            <div className="powered-by">
              <Sparkles size={14} />
              <span>Powered by G5 AI Model</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
