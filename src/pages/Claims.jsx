import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { FileWarning, Search, CheckCircle, XCircle, AlertTriangle, ShieldCheck, Clock, Eye, DollarSign, Flag } from 'lucide-react';
import './Claims.css';

export default function Claims() {
  const { data, processClaim, isAdmin, currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClaim, setSelectedClaim] = useState(null);

  if (!data) return <div className="page-container"><div className="skeleton" style={{ height: 400 }} /></div>;

  const claims = useMemo(() => {
    const all = data.claims || [];
    return isAdmin ? all : all.filter(c => c.workerId === currentUser?.id);
  }, [data, isAdmin, currentUser]);

  const filtered = useMemo(() => {
    return claims.filter(c => {
      const matchSearch = !search || c.workerName.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [claims, search, statusFilter]);

  const stats = {
    total: claims.length,
    autoApproved: claims.filter(c => c.status === 'auto_approved').length,
    paid: claims.filter(c => c.status === 'paid').length,
    pending: claims.filter(c => c.status === 'pending_review').length,
    flagged: claims.filter(c => c.status === 'flagged').length,
    totalPaid: claims.filter(c => c.status === 'paid').reduce((s, c) => s + c.claimAmount, 0),
  };

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Claims Management</h1>
        <p className="page-subtitle">Review, approve, and track automated insurance claims</p>
      </div>

      {/* Stats */}
      <div className="claims-stats-grid animate-fade-in-up delay-1">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(20,184,166,0.12)' }}>
            <FileWarning size={22} style={{ color: 'var(--primary-400)' }} />
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Claims</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <CheckCircle size={22} style={{ color: '#10b981' }} />
          </div>
          <div className="stat-value">{stats.autoApproved}</div>
          <div className="stat-label">Auto-Approved</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(20,184,166,0.12)' }}>
            <DollarSign size={22} style={{ color: 'var(--primary-400)' }} />
          </div>
          <div className="stat-value">{stats.paid}</div>
          <div className="stat-label">Paid Out</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
            <Clock size={22} style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.12)' }}>
            <Flag size={22} style={{ color: '#ef4444' }} />
          </div>
          <div className="stat-value">{stats.flagged}</div>
          <div className="stat-label">Flagged</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <DollarSign size={22} style={{ color: '#10b981' }} />
          </div>
          <div className="stat-value">₹{(stats.totalPaid / 1000).toFixed(1)}K</div>
          <div className="stat-label">Total Paid</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card filters-card animate-fade-in-up delay-2">
        <div className="filters-bar">
          <div className="search-box">
            <Search size={16} />
            <input className="form-input" placeholder="Search by name or claim ID..." value={search} onChange={e => setSearch(e.target.value)} id="search-claims" />
          </div>
          <div className="filter-group">
            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} id="filter-claim-status">
              <option value="all">All Status</option>
              <option value="auto_approved">Auto-Approved</option>
              <option value="paid">Paid</option>
              <option value="pending_review">Pending Review</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="glass-card table-card animate-fade-in-up delay-3">
        <div className="table-info">
          <span>Showing {filtered.length} of {claims.length} claims</span>
        </div>
        <div className="table-wrapper">
          <table className="data-table" id="claims-table">
            <thead>
              <tr>
                <th>Claim ID</th>
                <th>Worker</th>
                <th>Disruption</th>
                <th>City</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Confidence</th>
                {isAdmin && <th>Fraud Score</th>}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 20).map((claim) => (
                <tr key={claim.id} className={claim.status === 'flagged' ? 'flagged-row' : ''}>
                  <td><span className="mono-text">{claim.id}</span></td>
                  <td>
                    <div className="worker-cell">
                      <div className="worker-avatar">{claim.workerName.charAt(0)}</div>
                      <span>{claim.workerName}</span>
                    </div>
                  </td>
                  <td>
                    <div className="disruption-cell">
                      <span className="disruption-emoji">{claim.disruptionType.icon}</span>
                      <span>{claim.disruptionType.name}</span>
                    </div>
                  </td>
                  <td>{claim.city}</td>
                  <td className="mono-text claim-amount-cell">₹{claim.claimAmount.toLocaleString()}</td>
                  <td className="date-cell"><Clock size={12} />{claim.claimDate}</td>
                  <td>
                    <div className="confidence-cell">
                      <div className="confidence-bar">
                        <div className="confidence-fill" style={{ width: `${claim.triggerData.confidence}%`, background: 'var(--primary-500)' }} />
                      </div>
                      <span>{claim.triggerData.confidence}%</span>
                    </div>
                  </td>
                  {isAdmin && (
                    <td>
                      <span className={`badge ${claim.fraudCheck.score > 20 ? 'badge-danger' : claim.fraudCheck.score > 10 ? 'badge-warning' : 'badge-success'}`}>
                        {claim.fraudCheck.score}/100
                      </span>
                    </td>
                  )}
                  <td>
                    <span className={`badge badge-${claim.status === 'paid' ? 'success' : claim.status === 'auto_approved' ? 'primary' : claim.status === 'flagged' ? 'danger' : 'warning'}`}>
                      {claim.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-icon" onClick={() => setSelectedClaim(claim)} title="View Details">
                        <Eye size={16} />
                      </button>
                      {isAdmin && (claim.status === 'pending_review' || claim.status === 'auto_approved') && (
                        <>
                          <button className="btn-icon approve-btn" onClick={() => processClaim(claim.id, 'approve')} title="Approve & Pay">
                            <CheckCircle size={16} />
                          </button>
                          <button className="btn-icon reject-btn" onClick={() => processClaim(claim.id, 'reject')} title="Reject">
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <div className="modal-overlay" onClick={() => setSelectedClaim(null)}>
          <div className="modal-content glass-card animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Claim Details — {selectedClaim.id}</h3>
              <button className="modal-close" onClick={() => setSelectedClaim(null)}>×</button>
            </div>
            <div className="modal-body">
              {/* Claim info */}
              <div className="claim-detail-section">
                <h4>Claim Information</h4>
                <div className="detail-grid">
                  <div className="detail-item"><span>Worker</span><strong>{selectedClaim.workerName}</strong></div>
                  <div className="detail-item"><span>Policy</span><strong>{selectedClaim.policyId}</strong></div>
                  <div className="detail-item"><span>City</span><strong>{selectedClaim.city}</strong></div>
                  <div className="detail-item"><span>Platform</span><strong>{selectedClaim.platform}</strong></div>
                  <div className="detail-item"><span>Amount</span><strong className="text-accent">₹{selectedClaim.claimAmount.toLocaleString()}</strong></div>
                  <div className="detail-item"><span>Lost Hours</span><strong>{selectedClaim.lostHours} hrs</strong></div>
                  <div className="detail-item"><span>Payout Method</span><strong>{selectedClaim.payoutMethod || 'UPI (Live)'}</strong></div>
                </div>
              </div>

              {/* Trigger Data */}
              <div className="claim-detail-section">
                <h4>⚡ Parametric Trigger Data</h4>
                <div className="trigger-detail glass-card">
                  <div className="trigger-row">
                    <span>Disruption</span>
                    <strong>{selectedClaim.disruptionType.icon} {selectedClaim.disruptionType.name}</strong>
                  </div>
                  <div className="trigger-row">
                    <span>Data Source</span>
                    <strong>{selectedClaim.triggerData.source}</strong>
                  </div>
                  <div className="trigger-row">
                    <span>Measured Value</span>
                    <strong className="text-accent">{selectedClaim.triggerData.value}</strong>
                  </div>
                  <div className="trigger-row">
                    <span>Threshold</span>
                    <strong>{selectedClaim.triggerData.threshold}</strong>
                  </div>
                  <div className="trigger-row">
                    <span>Confidence</span>
                    <strong>{selectedClaim.triggerData.confidence}%</strong>
                  </div>
                </div>
              </div>

              {/* Fraud Check */}
              <div className="claim-detail-section">
                <h4>🛡️ Fraud Detection</h4>
                <div className="fraud-detail glass-card">
                  <div className="fraud-score-display">
                    <div className={`fraud-score-circle ${selectedClaim.fraudCheck.score > 20 ? 'high-risk' : selectedClaim.fraudCheck.score > 10 ? 'medium-risk' : 'low-risk'}`}>
                      {selectedClaim.fraudCheck.score}
                    </div>
                    <span className="fraud-score-label">Fraud Risk Score</span>
                  </div>
                  <div className="fraud-checks">
                    <div className="fraud-check-item">
                      <ShieldCheck size={16} style={{ color: selectedClaim.fraudCheck.locationVerified ? '#10b981' : '#ef4444' }} />
                      <span>Location Verification</span>
                      <strong>{selectedClaim.fraudCheck.locationVerified ? 'Verified ✅' : 'Failed ❌'}</strong>
                    </div>
                    <div className="fraud-check-item">
                      <ShieldCheck size={16} style={{ color: '#10b981' }} />
                      <span>Duplicate Check</span>
                      <strong>{selectedClaim.fraudCheck.duplicateCheck} ✅</strong>
                    </div>
                    <div className="fraud-check-item">
                      <ShieldCheck size={16} style={{ color: selectedClaim.fraudCheck.anomalyFlag === 'clear' ? '#10b981' : '#ef4444' }} />
                      <span>Anomaly Detection</span>
                      <strong>{selectedClaim.fraudCheck.anomalyFlag === 'clear' ? 'Clear ✅' : 'Flagged ⚠️'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {(selectedClaim.status === 'pending_review' || selectedClaim.status === 'auto_approved') && (
                <div className="claim-actions">
                  <button className="btn-accent" onClick={() => { processClaim(selectedClaim.id, 'approve'); setSelectedClaim(null); }}>
                    <CheckCircle size={16} /> Approve & Pay
                  </button>
                  <button className="btn-secondary" style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }} onClick={() => { processClaim(selectedClaim.id, 'reject'); setSelectedClaim(null); }}>
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
