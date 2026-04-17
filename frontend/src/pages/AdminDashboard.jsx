import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getAdminDashboard } from '../services/api';
import {
  Users, Shield, FileWarning, DollarSign, AlertTriangle,
  TrendingUp, TrendingDown, Activity, Zap, ArrowRight,
  Clock, MapPin, ChevronRight, CheckCircle
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

const CHART_COLORS = ['#14b8a6', '#0d9488', '#2dd4bf', '#fbbf24', '#f59e0b', '#0ea5e9', '#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="tooltip-value" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.value > 999 ? `₹${(p.value / 1000).toFixed(1)}K` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { data } = useApp();
  const [liveAdminMetrics, setLiveAdminMetrics] = useState(null);

  useEffect(() => {
    getAdminDashboard().then(res => {
        if (res) setLiveAdminMetrics(res);
    });
  }, []);

  if (!data) return <div className="page-container"><div className="skeleton" style={{ height: 400 }} /></div>;

  const { workers, policies, claims, analytics, alerts } = data;

  const activeWorkers = workers.filter(w => w.isActive).length;
  const activePolicies = policies.filter(p => p.status === 'active').length;
  
  // Try to use live metrics from database over mock data when available
  const totalPremiums = liveAdminMetrics ? liveAdminMetrics.totalPremiums : policies.filter(p => p.status === 'active').reduce((s, p) => s + p.weeklyPremium, 0);
  const totalPayouts = liveAdminMetrics ? liveAdminMetrics.totalPayouts : claims.filter(c => c.status === 'paid').reduce((s, c) => s + c.claimAmount, 0);
  
  const pendingClaims = claims.filter(c => c.status === 'pending_review' || c.status === 'auto_approved').length;
  const flaggedClaims = claims.filter(c => c.status === 'flagged').length;
  const activeAlerts = alerts.filter(a => a.status === 'active');

  const stats = [
    { label: 'Active Workers', value: activeWorkers, icon: Users, color: 'var(--primary-400)', bg: 'rgba(20,184,166,0.12)', change: '+12%', positive: true },
    { label: 'Loss Ratio (Live)', value: `${liveAdminMetrics ? liveAdminMetrics.lossRatio : '0'}%`, icon: Activity, color: 'var(--accent-400)', bg: 'rgba(245,158,11,0.12)', change: 'Target <30%', positive: true },
    { label: 'Weekly Premiums', value: `₹${(totalPremiums / 1000).toFixed(1)}K`, icon: DollarSign, color: 'var(--primary-400)', bg: 'rgba(20,184,166,0.12)', change: '+15%', positive: true },
    { label: 'Total Payouts', value: `₹${(totalPayouts / 1000).toFixed(1)}K`, icon: TrendingUp, color: 'var(--accent-400)', bg: 'rgba(245,158,11,0.12)', change: '-3%', positive: false },
  ];

  const claimStatusData = [
    { name: 'Paid', value: claims.filter(c => c.status === 'paid').length, color: 'var(--primary-400)' },
    { name: 'Auto-Approved', value: claims.filter(c => c.status === 'auto_approved').length, color: 'var(--primary-500)' },
    { name: 'Pending', value: claims.filter(c => c.status === 'pending_review').length, color: 'var(--accent-400)' },
    { name: 'Flagged', value: flaggedClaims, color: 'var(--danger-400)' },
  ].filter(d => d.value > 0);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header animate-fade-in-up">
        <div className="dashboard-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Real-time overview of GigCover operations</p>
          </div>
          <div className="header-actions">
            {activeAlerts.length > 0 && (
              <Link to="/triggers" className="alert-banner">
                <AlertTriangle size={16} />
                <span>{activeAlerts.length} active alert{activeAlerts.length > 1 ? 's' : ''}</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-4 animate-fade-in-up delay-1">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-card stat-card">
              <div className="stat-icon" style={{ background: stat.bg }}>
                <Icon size={22} style={{ color: stat.color }} />
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                {stat.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {stat.change} this week
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="dashboard-charts animate-fade-in-up delay-2">
        {/* Premium Collection Chart */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <h3>Premium Collection</h3>
            <span className="badge badge-primary">Last 7 months</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={analytics.premiumCollection}>
              <defs>
                <linearGradient id="premiumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary-500)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--primary-500)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="amount" stroke="var(--primary-500)" fill="url(#premiumGrad)" strokeWidth={2} name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Claims Distribution */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <h3>Claims Distribution</h3>
            <span className="badge badge-info">Current Period</span>
          </div>
          <div className="pie-chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={claimStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {claimStatusData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {claimStatusData.map((entry, idx) => (
                <div key={idx} className="legend-item">
                  <div className="legend-dot" style={{ background: entry.color }} />
                  <span className="legend-label">{entry.name}</span>
                  <span className="legend-value">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Predictive Analytics Row */}
      {liveAdminMetrics?.predictiveAnalytics && (
        <div className="dashboard-charts animate-fade-in-up delay-2" style={{ marginTop: '1.5rem' }}>
          <div className="glass-card chart-card">
            <div className="chart-header">
              <h3><Activity size={18} style={{ color: '#0ea5e9' }} /> AI Claims Forecast (Next 7 Days)</h3>
              <span className={`badge badge-${parseInt(liveAdminMetrics.predictiveAnalytics.trend) > 0 ? 'warning' : 'success'}`}>
                Trend {liveAdminMetrics.predictiveAnalytics.trend}
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
               <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Expected Claims</p>
                 <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', margin: '0.5rem 0' }}>{liveAdminMetrics.predictiveAnalytics.expectedClaimsNextWeek}</h2>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Confidence: {liveAdminMetrics.predictiveAnalytics.confidence}%</p>
               </div>
               <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Est. Payout</p>
                 <h2 style={{ fontSize: '2rem', color: 'var(--danger-400)', margin: '0.5rem 0' }}>₹{(liveAdminMetrics.predictiveAnalytics.estimatedPayout || 0).toLocaleString()}</h2>
               </div>
            </div>
            
            {liveAdminMetrics.predictiveAnalytics.highRiskZones?.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'var(--text-muted)' }}>High-Risk Zones Monitor</h4>
                {liveAdminMetrics.predictiveAnalytics.highRiskZones.map((zone, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={14} style={{ color: 'var(--warning-400)' }} />
                      <span style={{ fontWeight: 500 }}>{zone.city}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{zone.reason}</span>
                    </div>
                    <span className="badge badge-danger">Risk {zone.riskScore}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="glass-card chart-card">
            <div className="chart-header">
              <h3><AlertTriangle size={18} style={{ color: '#ef4444' }} /> System Alerts</h3>
            </div>
            {(liveAdminMetrics.lossRatio > 30) ? (
              <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid var(--danger-400)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <strong style={{ fontSize: '1.1rem', color: 'var(--danger-400)' }}>Loss Ratio Warning ({liveAdminMetrics.lossRatio}%)</strong>
                <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>Projected payouts are approaching premium collections. Consider triggering automated parameter adjustments for upcoming renewals.</p>
                <button className="btn-primary" style={{ alignSelf: 'flex-start', background: 'var(--danger-500)', border: 'none' }}>Review Risk Parameters</button>
              </div>
            ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                 <CheckCircle size={32} style={{ color: 'var(--success-400)', marginBottom: '1rem' }} />
                 <p>All systemic parameters are currently nominal.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Row */}
      <div className="dashboard-bottom animate-fade-in-up delay-3">
        {/* Live Alerts */}
        <div className="glass-card alerts-card">
          <div className="chart-header">
            <h3>
              <Activity size={18} style={{ color: '#ef4444' }} />
              Live Alerts
            </h3>
            <Link to="/triggers" className="view-all-link">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="alerts-list">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className={`alert-item alert-${alert.type}`}>
                <div className="alert-icon">{alert.disruption.icon}</div>
                <div className="alert-content">
                  <div className="alert-city">
                    <MapPin size={12} />
                    {alert.city}
                  </div>
                  <p className="alert-message">{alert.message}</p>
                  <div className="alert-meta">
                    <span><Clock size={10} /> {new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>{alert.affectedWorkers} workers</span>
                    <span>₹{(alert.estimatedPayout / 1000).toFixed(1)}K est.</span>
                  </div>
                </div>
                <span className={`badge badge-${alert.status === 'active' ? 'danger' : alert.status === 'monitoring' ? 'warning' : 'success'}`}>
                  {alert.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Claims */}
        <div className="glass-card recent-claims-card">
          <div className="chart-header">
            <h3>
              <Zap size={18} style={{ color: '#f59e0b' }} />
              Recent Claims
            </h3>
            <Link to="/claims" className="view-all-link">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="recent-claims-list">
            {claims.slice(0, 6).map((claim) => (
              <div key={claim.id} className="recent-claim-item">
                <div className="claim-disruption-icon">{claim.disruptionType.icon}</div>
                <div className="claim-info">
                  <span className="claim-worker">{claim.workerName}</span>
                  <span className="claim-detail">{claim.disruptionType.name} · {claim.city}</span>
                </div>
                <div className="claim-right">
                  <span className="claim-amount">₹{claim.claimAmount.toLocaleString()}</span>
                  <span className={`badge badge-${claim.status === 'paid' ? 'success' : claim.status === 'auto_approved' ? 'primary' : claim.status === 'flagged' ? 'danger' : 'warning'}`}>
                    {claim.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
