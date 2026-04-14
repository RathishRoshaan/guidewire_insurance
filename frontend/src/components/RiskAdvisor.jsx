import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, X, ChevronRight, Zap, ShieldAlert } from 'lucide-react';
import './RiskAdvisor.css';

export default function RiskAdvisor() {
  const { data } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [activeInsight, setActiveInsight] = useState(0);

  const insights = [
    {
      title: 'Monsoon Risk Escalation',
      type: 'critical',
      icon: <AlertTriangle size={18} />,
      message: 'Predictive models show 85% probability of flooding in Mumbai and Pune within next 48 hours. Expect 300% surge in claims.',
      action: 'Increase liquidity reserves by 40%',
      impact: '+₹2.4L est. payouts'
    },
    {
      title: 'Premium Optimization',
      type: 'opportunity',
      icon: <TrendingUp size={18} />,
      message: 'Low disruption frequency in Bengaluru suggests room for a 15% promotional premium reduction to drive higher worker retention.',
      action: 'Launch 15% discount campaign',
      impact: '+22% worker growth'
    },
    {
      title: 'Anomalous Claim Patterns',
      type: 'warning',
      icon: <ShieldAlert size={18} />,
      message: 'AI detected 12 claims with identical GPS signatures in Delhi. Possible coordinated fraud attempt during platform outage.',
      action: 'Flag for manual verification',
      impact: '₹18.5K saved'
    },
    {
      title: 'Platform Resilience Insight',
      type: 'info',
      icon: <Lightbulb size={18} />,
      message: 'Zomato delivery uptime has dropped 0.8% this week. Correlates with server issues in South Bangalore nodes.',
      action: 'Adjust technical outage triggers',
      impact: 'Risk mitigation'
    }
  ];

  if (!data) return null;

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        className={`advisor-toggle ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="AI Risk Advisor"
      >
        <Brain size={24} />
        {!isOpen && <span className="pulse-dot" />}
      </button>

      {/* Advisor Sidebar */}
      <div className={`risk-advisor-panel ${isOpen ? 'open' : ''}`}>
        <div className="advisor-header">
          <div className="advisor-title">
            <div className="title-icon">
              <Brain size={20} />
            </div>
            <div>
              <h3>AI Risk Advisor</h3>
              <span className="live-status">
                <span className="status-dot" /> Live Analysis
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="advisor-body">
          <div className="metrics-preview">
            <div className="preview-item">
              <span>Risk Confidence</span>
              <strong>94.2%</strong>
            </div>
            <div className="preview-item">
              <span>Data Points</span>
              <strong>12.4K</strong>
            </div>
          </div>

          <div className="insights-container">
            <h4>Strategic Insights</h4>
            <div className="insights-list">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`insight-card ${insight.type} ${activeInsight === idx ? 'active' : ''}`}
                  onClick={() => setActiveInsight(idx)}
                >
                  <div className="insight-header">
                    <span className="insight-icon">{insight.icon}</span>
                    <span className="insight-title-text">{insight.title}</span>
                  </div>
                  {activeInsight === idx && (
                    <div className="insight-content animate-fade-in">
                      <p className="insight-msg">{insight.message}</p>
                      <div className="insight-meta">
                        <div className="meta-row">
                          <Zap size={14} />
                          <span>Action: <strong>{insight.action}</strong></span>
                        </div>
                        <div className="meta-row">
                          <TrendingUp size={14} />
                          <span>Est. Impact: <strong className="impact-text">{insight.impact}</strong></span>
                        </div>
                      </div>
                      <button className="apply-btn">
                        Apply Strategy <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="recommendation-card glass-card">
            <h4>Global Risk Score</h4>
            <div className="risk-gauge">
              <div className="gauge-track">
                <div className="gauge-fill" style={{ width: '68%' }} />
              </div>
              <div className="gauge-value">Moderate (68/100)</div>
            </div>
            <p className="gauge-desc">Global platform risk is elevated due to upcoming monsoon season entry.</p>
          </div>
        </div>

        <div className="advisor-footer">
          <p>Powered by GigCover G5 Model</p>
        </div>
      </div>
    </>
  );
}
