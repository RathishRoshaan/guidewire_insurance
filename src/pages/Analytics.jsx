import { useApp } from '../context/AppContext';
import { BarChart3, TrendingUp, PieChart as PieIcon, MapPin, Activity, Brain } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart
} from 'recharts';
import './Analytics.css';

const COLORS = ['#6366f1', '#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

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

export default function Analytics() {
  const { data } = useApp();

  if (!data) return <div className="page-container"><div className="skeleton" style={{ height: 600 }} /></div>;

  const { analytics } = data;

  // Loss ratio data
  const lossRatioData = analytics.lossRatio;

  // Claims by disruption type
  const disruptionData = analytics.disruptionFrequency.sort((a, b) => b.count - a.count);

  // City performance
  const cityData = analytics.cityWise.sort((a, b) => b.revenue - a.revenue);

  // Radar data for risk profile
  const radarData = [
    { subject: 'Weather', A: 75, fullMark: 100 },
    { subject: 'Pollution', A: 55, fullMark: 100 },
    { subject: 'Traffic', A: 60, fullMark: 100 },
    { subject: 'Platform', A: 30, fullMark: 100 },
    { subject: 'Civic', A: 25, fullMark: 100 },
    { subject: 'Seasonal', A: 65, fullMark: 100 },
  ];

  const totalRevenue = analytics.premiumCollection.reduce((s, d) => s + d.amount, 0);
  const totalPaid = analytics.claimsTrend.reduce((s, d) => s + d.paid, 0);
  const overallLossRatio = (totalPaid / totalRevenue * 100).toFixed(1);

  // Predictive data
  const predictiveData = [
    { day: 'Mon', actual: 45, predicted: 42 },
    { day: 'Tue', actual: 52, predicted: 48 },
    { day: 'Wed', actual: 38, predicted: 40 },
    { day: 'Thu', actual: 65, predicted: 62 },
    { day: 'Fri', actual: 82, predicted: 85 },
    { day: 'Sat', actual: null, predicted: 120 },
    { day: 'Sun', actual: null, predicted: 145 },
  ];

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1 className="page-title">Analytics</h1>
            <p className="page-subtitle">Comprehensive insights into platform performance and risk metrics</p>
          </div>
          <div className="ai-badge">
            <Activity size={14} />
            <span>AI Predictive Engine Active</span>
          </div>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid-4 animate-fade-in-up delay-1">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <BarChart3 size={22} style={{ color: '#6366f1' }} />
          </div>
          <div className="stat-value">₹{(totalRevenue / 100000).toFixed(1)}L</div>
          <div className="stat-label">Total Premium Revenue</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.12)' }}>
            <TrendingUp size={22} style={{ color: '#ef4444' }} />
          </div>
          <div className="stat-value">₹{(totalPaid / 100000).toFixed(1)}L</div>
          <div className="stat-label">Total Claims Paid</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
            <Activity size={22} style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-value">{overallLossRatio}%</div>
          <div className="stat-label">Loss Ratio</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <PieIcon size={22} style={{ color: '#10b981' }} />
          </div>
          <div className="stat-value">{analytics.claimsTrend.reduce((s, d) => s + d.claims, 0)}</div>
          <div className="stat-label">Total Claims Processed</div>
        </div>
      </div>

      {/* Row 1: Revenue vs Claims */}
      <div className="analytics-row animate-fade-in-up delay-2">
        <div className="glass-card chart-card">
          <div className="chart-header">
            <h3>Revenue vs Claims Paid</h3>
            <span className="badge badge-primary">7 Month Trend</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={analytics.premiumCollection.map((d, i) => ({
              ...d,
              paid: analytics.claimsTrend[i]?.paid || 0,
            }))}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="amount" stroke="#6366f1" fill="url(#revGrad)" strokeWidth={2} name="Premium" />
              <Bar dataKey="paid" fill="#ef4444" opacity={0.7} radius={[4, 4, 0, 0]} name="Claims Paid" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card chart-card">
          <div className="chart-header">
            <h3>Loss Ratio Trend</h3>
            <span className="badge badge-warning">Target: &lt;60%</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lossRatioData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={[0, 1]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="ratio" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 5 }} name="Loss Ratio" />
              {/* Target line */}
              <Line type="monotone" dataKey={() => 0.6} stroke="#ef4444" strokeDasharray="8 4" strokeWidth={1} dot={false} name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row: Prediction */}
      <div className="analytics-row animate-fade-in-up delay-3">
        <div className="glass-card chart-card full-width-chart">
          <div className="chart-header">
            <h3><Brain size={18} style={{ color: 'var(--accent-400)' }} /> AI Claim Volume Prediction (Next 48h)</h3>
            <span className="badge badge-primary">Model: GigForecast v2.4</span>
          </div>
          <p className="chart-desc">Projected claim volume surge based on meteorological alerts and historical monsoon patterns.</p>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={predictiveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 5 }} name="Actual Claims" />
              <Line type="monotone" dataKey="predicted" stroke="#10b981" strokeDasharray="5 5" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} name="Predicted Volume" />
              {/* Highlight area for prediction */}
              <defs>
                <linearGradient id="predArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="analytics-row animate-fade-in-up delay-3">
        <div className="glass-card chart-card">
          <div className="chart-header">
            <h3>Claims by Disruption Type</h3>
          </div>
          <div className="disruption-bar-list">
            {disruptionData.map((d, i) => (
              <div key={i} className="disruption-bar-item">
                <div className="disruption-bar-label">
                  <span className="disruption-bar-icon">{d.icon}</span>
                  <span>{d.type}</span>
                </div>
                <div className="disruption-bar-wrapper">
                  <div className="disruption-bar-bg">
                    <div
                      className="disruption-bar-fill"
                      style={{
                        width: `${(d.count / Math.max(...disruptionData.map(x => x.count))) * 100}%`,
                        background: COLORS[i % COLORS.length]
                      }}
                    />
                  </div>
                  <span className="disruption-bar-count">{d.count}</span>
                </div>
                <span className="disruption-bar-payout">₹{(d.totalPayout / 1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card chart-card">
          <div className="chart-header">
            <h3>Risk Profile Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={12} />
              <PolarRadiusAxis stroke="rgba(255,255,255,0.1)" fontSize={10} />
              <Radar name="Risk Level" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: City Performance */}
      <div className="glass-card chart-card city-table-card animate-fade-in-up delay-4">
        <div className="chart-header">
          <h3><MapPin size={18} /> City-wise Performance</h3>
        </div>
        <div className="table-wrapper">
          <table className="data-table" id="analytics-city-table">
            <thead>
              <tr>
                <th>City</th>
                <th>Workers</th>
                <th>Active Policies</th>
                <th>Claims</th>
                <th>Revenue</th>
                <th>Avg Risk</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {cityData.map((city, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={14} style={{ color: COLORS[i % COLORS.length] }} />
                      <strong style={{ color: 'var(--text-primary)' }}>{city.city}</strong>
                    </div>
                  </td>
                  <td>{city.workers}</td>
                  <td>{city.activePolicies}</td>
                  <td>{city.claims}</td>
                  <td className="mono-text" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{(city.revenue / 1000).toFixed(0)}K</td>
                  <td>
                    <div className="risk-cell">
                      <div className="risk-bar-mini">
                        <div className="risk-bar-fill-mini" style={{
                          width: `${city.avgRisk}%`,
                          background: city.avgRisk > 70 ? '#ef4444' : city.avgRisk > 40 ? '#f59e0b' : '#10b981'
                        }} />
                      </div>
                      <span>{city.avgRisk}</span>
                    </div>
                  </td>
                  <td>
                    <div className="progress-bar" style={{ width: 80 }}>
                      <div className="progress-bar-fill" style={{
                        width: `${Math.min((city.revenue / (cityData[0]?.revenue || 1)) * 100, 100)}%`,
                        background: 'var(--gradient-primary)'
                      }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
