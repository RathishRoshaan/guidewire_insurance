// ✅ Always use env variable, fallback only for local
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper for safe fetch
async function handleResponse(res, defaultMsg) {
  if (!res.ok) {
    let err;
    try {
      err = await res.json();
    } catch {
      err = { error: defaultMsg };
    }
    throw new Error(err.error || defaultMsg);
  }
  return res.json();
}

// ── Auth APIs ──
export async function registerUser(data) {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res, 'Registration failed');
}

export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res, 'Login failed');
}

// ── Risk APIs ──
export async function calculateRisk(data) {
  const res = await fetch(`${API_BASE_URL}/api/risk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data), // MUST be object
  });
  return handleResponse(res, 'Failed to calculate risk');
}

export async function getStatePricing(stateName, income = 7000) {
  const res = await fetch(
    `${API_BASE_URL}/api/risk/state/${encodeURIComponent(stateName)}?income=${income}`
  );
  return handleResponse(res, 'Failed to get state pricing');
}

export async function getAvailableStates() {
  const res = await fetch(`${API_BASE_URL}/api/risk/states`);
  return handleResponse(res, 'Failed to get states');
}

// ── Claim APIs ──
export async function createClaim(data) {
  const res = await fetch(`${API_BASE_URL}/api/claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res, 'Failed to create claim');
}

export async function submitManualClaim(data) {
  const res = await fetch(`${API_BASE_URL}/api/claims/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res, 'Failed to submit manual claim');
}

export async function getWorkerClaims(workerId) {
  const res = await fetch(`${API_BASE_URL}/api/claims/list/${workerId}`);
  return handleResponse(res, 'Failed to fetch claims');
}

export async function getAllClaims() {
  const res = await fetch(`${API_BASE_URL}/api/claims/all`);
  return handleResponse(res, 'Failed to fetch claims');
}

export async function processClaim(claimId, action) {
  const res = await fetch(`${API_BASE_URL}/api/claims/${claimId}/process`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  return handleResponse(res, 'Failed to process claim');
}

// ── Policy APIs ──
export async function createPolicy(data) {
  const res = await fetch(`${API_BASE_URL}/api/policies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res, 'Failed to create policy');
}

export async function getWorkerPolicies(workerId) {
  const res = await fetch(`${API_BASE_URL}/api/policies/worker/${workerId}`);
  return handleResponse(res, 'Failed to fetch policies');
}

// ── Dashboard APIs ──
export async function getWorkerDashboard(workerId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/worker/${workerId}`);
    return await handleResponse(res, 'Failed to load dashboard');
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getAdminDashboard() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/admin`);
    return await handleResponse(res, 'Failed to load dashboard');
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
  return handleResponse(res, 'Manual trigger failed');
}

export async function getTriggerLog() {
  const res = await fetch(`${API_BASE_URL}/api/triggers/log`);
  return handleResponse(res, 'Failed to fetch trigger log');
}

// ── Worker APIs ──
export async function getWorker(workerId) {
  const res = await fetch(`${API_BASE_URL}/api/workers/${workerId}`);
  return handleResponse(res, 'Worker not found');
}

export async function getAllWorkers() {
  const res = await fetch(`${API_BASE_URL}/api/workers`);
  return handleResponse(res, 'Failed to fetch workers');
}

// ── Payment APIs ──
export async function initiateUpiPayment(data) {
  const res = await fetch(`${API_BASE_URL}/api/payments/upi/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res, 'Failed to initiate payment');
}

export async function verifyUpiPayment(data) {
  const res = await fetch(`${API_BASE_URL}/api/payments/upi/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res, 'Payment verification failed');
}

export async function getPaymentHistory(userId) {
  const res = await fetch(`${API_BASE_URL}/api/payments/history/${userId}`);
  return handleResponse(res, 'Failed to load payment history');
}