import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Search, Filter, RefreshCw, Calendar, User, MapPin, ChevronDown, Eye } from 'lucide-react';
import './Policies.css';

export default function Policies() {
  const { data } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  if (!data) return <div className="page-container"><div className="skeleton" style={{height: 400}} /></div>;

  const policies = data.policies || [];

  const filtered = useMemo(() => {
    return policies.filter(p => {
      const matchSearch = !search || p.workerName.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchCity = cityFilter === 'all' || p.city === cityFilter;
      return matchSearch && matchStatus && matchCity;
    });
  }, [policies, search, statusFilter, cityFilter]);

  const cities = [...new Set(policies.map(p => p.city))];

  const stats = {
    total: policies.length,
    active: policies.filter(p => p.status === 'active').length,
    expired: policies.filter(p => p.status === 'expired').length,
    pending: policies.filter(p => p.status === 'pending').length,
    totalPremium: policies.filter(p => p.status === 'active').reduce((s, p) => s + p.weeklyPremium, 0),
    totalCoverage: policies.filter(p => p.status === 'active').reduce((s, p) => s + p.maxCoverage, 0),
  };

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Policies</h1>
        <p className="page-subtitle">Manage weekly income protection policies for all registered workers</p>
      </div>

      {/* Stats */}
      <div className="grid-4 animate-fade-in-up delay-1">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <Shield size={22} style={{ color: '#6366f1' }} />
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Policies</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <Shield size={22} style={{ color: '#10b981' }} />
          </div>
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(14,165,233,0.12)' }}>
            <Shield size={22} style={{ color: '#0ea5e9' }} />
          </div>
          <div className="stat-value">₹{(stats.totalPremium/1000).toFixed(1)}K</div>
          <div className="stat-label">Weekly Premiums</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
            <Shield size={22} style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-value">₹{(stats.totalCoverage/1000).toFixed(0)}K</div>
          <div className="stat-label">Total Coverage</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card filters-card animate-fade-in-up delay-2">
        <div className="filters-bar">
          <div className="search-box">
            <Search size={16} />
            <input className="form-input" placeholder="Search by name or policy ID..." value={search} onChange={e => setSearch(e.target.value)} id="search-policies" />
          </div>
          <div className="filter-group">
            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} id="filter-status">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
            <select className="form-select" value={cityFilter} onChange={e => setCityFilter(e.target.value)} id="filter-city">
              <option value="all">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card table-card animate-fade-in-up delay-3">
        <div className="table-info">
          <span>Showing {filtered.length} of {policies.length} policies</span>
        </div>
        <div className="table-wrapper">
          <table className="data-table" id="policies-table">
            <thead>
              <tr>
                <th>Policy ID</th>
                <th>Worker</th>
                <th>City</th>
                <th>Platform</th>
                <th>Premium</th>
                <th>Coverage</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Period</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 20).map((policy) => (
                <tr key={policy.id}>
                  <td><span className="mono-text">{policy.id}</span></td>
                  <td>
                    <div className="worker-cell">
                      <div className="worker-avatar">{policy.workerName.charAt(0)}</div>
                      <span>{policy.workerName}</span>
                    </div>
                  </td>
                  <td><span className="city-cell"><MapPin size={12} /> {policy.city}</span></td>
                  <td>{policy.platform}</td>
                  <td className="mono-text">₹{policy.weeklyPremium}</td>
                  <td className="mono-text">₹{policy.maxCoverage.toLocaleString()}</td>
                  <td>
                    <div className="risk-cell">
                      <div className="risk-bar-mini">
                        <div className="risk-bar-fill-mini" style={{
                          width: `${policy.riskScore}%`,
                          background: policy.riskScore > 70 ? '#ef4444' : policy.riskScore > 40 ? '#f59e0b' : '#10b981'
                        }} />
                      </div>
                      <span>{policy.riskScore}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${policy.status === 'active' ? 'success' : policy.status === 'expired' ? 'danger' : 'warning'}`}>
                      {policy.status}
                    </span>
                  </td>
                  <td className="date-cell">
                    <Calendar size={12} />
                    {policy.startDate}
                  </td>
                  <td>
                    <button className="btn-icon" onClick={() => setSelectedPolicy(policy)} title="View Details">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Policy Detail Modal */}
      {selectedPolicy && (
        <div className="modal-overlay" onClick={() => setSelectedPolicy(null)}>
          <div className="modal-content glass-card animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Policy Details</h3>
              <button className="modal-close" onClick={() => setSelectedPolicy(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><span>Policy ID</span><strong>{selectedPolicy.id}</strong></div>
                <div className="detail-item"><span>Worker</span><strong>{selectedPolicy.workerName}</strong></div>
                <div className="detail-item"><span>City</span><strong>{selectedPolicy.city}</strong></div>
                <div className="detail-item"><span>Platform</span><strong>{selectedPolicy.platform}</strong></div>
                <div className="detail-item"><span>Weekly Premium</span><strong className="text-accent">₹{selectedPolicy.weeklyPremium}</strong></div>
                <div className="detail-item"><span>Max Coverage</span><strong>₹{selectedPolicy.maxCoverage.toLocaleString()}</strong></div>
                <div className="detail-item"><span>Risk Score</span><strong>{selectedPolicy.riskScore}/100</strong></div>
                <div className="detail-item"><span>Status</span><span className={`badge badge-${selectedPolicy.status === 'active' ? 'success' : 'danger'}`}>{selectedPolicy.status}</span></div>
                <div className="detail-item"><span>Start Date</span><strong>{selectedPolicy.startDate}</strong></div>
                <div className="detail-item"><span>End Date</span><strong>{selectedPolicy.endDate}</strong></div>
                <div className="detail-item"><span>Auto-Renew</span><strong>{selectedPolicy.autoRenew ? '✅ Yes' : '❌ No'}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
