import { useState, useEffect } from 'react';
import { Shield, User, Lock, LayoutDashboard, ArrowRight, Sparkles, CheckCircle, XCircle, UserPlus, Eye, EyeOff, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Login.css';

export default function Login() {
  const { login, validateLogin, getAiStatePricing, CITIES } = useApp();
  const navigate = useNavigate();
  const [role, setRole] = useState('worker');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');



  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.');
      return;
    }
    setIsLoading(true);

    setTimeout(() => {
      const result = validateLogin(username.trim(), password);
      if (!result) {
        setError('Invalid username or password. Please try again.');
        setIsLoading(false);
        return;
      }

      if (role === 'admin' && result.role !== 'admin') {
        setError('This account does not have admin access.');
        setIsLoading(false);
        return;
      }

      if (result.role === 'admin') {
        login('admin');
      } else {
        login('worker', result.userData);
      }
      setIsLoading(false);
    }, 900);
  };

  return (
    <div className="login-page">


      {/* Right form panel */}
      <div className="login-form-container">
        <div className="form-wrapper animate-fade-in-up">
          <div className="form-header">
            <h3>Sign In to GigCover</h3>
            <p>Access your dashboard and protection status</p>
          </div>

          <div className="role-selector">
            <button
              className={`role-btn ${role === 'worker' ? 'active' : ''}`}
              onClick={() => { setRole('worker'); setError(''); }}
              type="button"
            >
              <User size={18} />
              <span>Partner</span>
            </button>
            <button
              className={`role-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => { setRole('admin'); setError(''); }}
              type="button"
            >
              <LayoutDashboard size={18} />
              <span>Admin</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Username</label>
              <div className="input-with-icon">
                <User size={18} />
                <input
                  type="text"
                  placeholder={role === 'admin' ? 'admin' : 'your_username'}
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error">
                <span>⚠️ {error}</span>
              </div>
            )}

            <button type="submit" className="login-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <div className="loader" />
              ) : (
                <>
                  Sign In as {role === 'admin' ? 'Administrator' : 'Partner'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {role === 'admin' && (
            <div className="admin-hint">
              <Sparkles size={12} />
              <span>Admin credentials: admin / admin123</span>
            </div>
          )}

          <footer className="form-footer">
            <p>New partner? <button className="text-btn" onClick={() => navigate('/onboarding')}><UserPlus size={14} /> Create Your Account</button></p>
            <div className="powered-by">
              <Sparkles size={14} />
              <span>Powered by GigCover G5 AI Model</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
