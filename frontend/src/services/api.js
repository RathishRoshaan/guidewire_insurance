const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ── Auth APIs ──
export async function registerUser(data) {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Registration failed' }));
    throw new Error(err.error || 'Registration failed');
  }
  return res.json();
}

export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(err.error || 'Login failed');
  }
  return res.json();
}

// ── Risk APIs ──
export async function calculateRisk(data) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to calculate risk');
    return res.json();
  } catch (error) {
    console.error('Risk API Error:', error);
    throw error;
  }
}

export async function getStatePricing(stateName, income = 7000) {
  const res = await fetch(`${API_BASE_URL}/api/risk/state/${encodeURIComponent(stateName)}?income=${income}`);
  if (!res.ok) throw new Error('Failed to get state pricing');
  return res.json();
}

export async function getAvailableStates() {
  const res = await fetch(`${API_BASE_URL}/api/risk/states`);
  if (!res.ok) throw new Error('Failed to get states');
  return res.json();
}

// ── Claim APIs ──
export async function createClaim(data) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create claim');
    return res.json();
  } catch (error) {
    console.error('Claim API Error:', error);
    throw error;
  }
}

export async function getWorkerClaims(workerId) {
  const res = await fetch(`${API_BASE_URL}/api/claims/list/${workerId}`);
  if (!res.ok) throw new Error('Failed to fetch claims');
  return res.json();
}

export async function getAllClaims() {
  const res = await fetch(`${API_BASE_URL}/api/claims/all`);
  if (!res.ok) throw new Error('Failed to fetch claims');
  return res.json();
}

export async function processClaim(claimId, action) {
  const res = await fetch(`${API_BASE_URL}/api/claims/${claimId}/process`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error('Failed to process claim');
  return res.json();
}

// ── Policy APIs ──
export async function createPolicy(data) {
  const res = await fetch(`${API_BASE_URL}/api/policies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create policy');
  return res.json();
}

export async function getWorkerPolicies(workerId) {
  const res = await fetch(`${API_BASE_URL}/api/policies/worker/${workerId}`);
  if (!res.ok) throw new Error('Failed to fetch policies');
  return res.json();
}

// ── Dashboard APIs ──
export async function getWorkerDashboard(workerId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/worker/${workerId}`);
    if (!res.ok) throw new Error('Failed to load Dashboard data');
    return res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getAdminDashboard() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/admin`);
    if (!res.ok) throw new Error('Failed to load Dashboard data');
    return res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

// ── Trigger APIs ──
export async function manualTrigger(city, disruptionType) {
  const res = await fetch(`${API_BASE_URL}/api/triggers/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city, disruptionType }),
  });
  if (!res.ok) throw new Error('Manual trigger failed');
  return res.json();
}

export async function getTriggerLog() {
  const res = await fetch(`${API_BASE_URL}/api/triggers/log`);
  if (!res.ok) throw new Error('Failed to fetch trigger log');
  return res.json();
}

// ── Worker APIs ──
export async function getWorker(workerId) {
  const res = await fetch(`${API_BASE_URL}/api/workers/${workerId}`);
  if (!res.ok) throw new Error('Worker not found');
  return res.json();
}

export async function getAllWorkers() {
  const res = await fetch(`${API_BASE_URL}/api/workers`);
  if (!res.ok) throw new Error('Failed to fetch workers');
  return res.json();
}

// ── Payment APIs (UPI Simulator) ──
export async function initiateUpiPayment(data) {
  const res = await fetch(`${API_BASE_URL}/api/payments/upi/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to initiate payment');
  return res.json();
}

export async function verifyUpiPayment(data) {
  const res = await fetch(`${API_BASE_URL}/api/payments/upi/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Payment verification failed');
  return res.json();
}

export async function getPaymentHistory(userId) {
  const res = await fetch(`${API_BASE_URL}/api/payments/history/${userId}`);
  if (!res.ok) throw new Error('Failed to load payment history');
  return res.json();
}
