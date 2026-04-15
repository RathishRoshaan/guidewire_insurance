// ============================================
// GigCover - Mock Data & Simulation Engine
// ============================================

// City-level risk profiles
export const CITIES = [
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777, riskMultiplier: 1.3 },
  { id: 'delhi', name: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.209, riskMultiplier: 1.4 },
  { id: 'bangalore', name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, riskMultiplier: 0.9 },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, riskMultiplier: 1.1 },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867, riskMultiplier: 0.85 },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, riskMultiplier: 1.2 },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, riskMultiplier: 0.95 },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, riskMultiplier: 1.0 },
];

export const PLATFORMS = [
  { id: 'swiggy', name: 'Swiggy', type: 'Food Delivery', color: '#FC8019' },
  { id: 'zomato', name: 'Zomato', type: 'Food Delivery', color: '#E23744' },
  { id: 'dunzo', name: 'Dunzo', type: 'Hyperlocal', color: '#00D290' },
  { id: 'blinkit', name: 'Blinkit', type: 'Grocery', color: '#F8CB46' },
  { id: 'amazon_flex', name: 'Amazon Flex', type: 'E-commerce', color: '#FF9900' },
  { id: 'flipkart', name: 'Flipkart Delivery', type: 'E-commerce', color: '#2874F0' },
  { id: 'zepto', name: 'Zepto', type: 'Quick Commerce', color: '#7B2FF7' },
  { id: 'uber_eats', name: 'Porter', type: 'Logistics', color: '#000000' },
];

export const DISRUPTION_TYPES = [
  {
    id: 'heavy_rain',
    name: 'Heavy Rainfall',
    icon: '🌧️',
    category: 'weather',
    description: 'Rainfall exceeding 50mm/hr causing delivery disruptions',
    triggerThreshold: 'Rainfall > 50mm/hr',
    avgDuration: '4-8 hours',
    payoutMultiplier: 1.0,
  },
  {
    id: 'extreme_heat',
    name: 'Extreme Heat',
    icon: '🔥',
    category: 'weather',
    description: 'Temperature above 45°C making outdoor work hazardous',
    triggerThreshold: 'Temperature > 45°C',
    avgDuration: '6-10 hours',
    payoutMultiplier: 0.8,
  },
  {
    id: 'flooding',
    name: 'Flooding',
    icon: '🌊',
    category: 'weather',
    description: 'Waterlogging causing road closures and delivery blocks',
    triggerThreshold: 'Water level > 30cm on roads',
    avgDuration: '12-48 hours',
    payoutMultiplier: 1.5,
  },
  {
    id: 'cyclone',
    name: 'Cyclone/Storm',
    icon: '🌀',
    category: 'weather',
    description: 'Cyclonic storms forcing complete delivery shutdowns',
    triggerThreshold: 'Wind speed > 90 km/h',
    avgDuration: '24-72 hours',
    payoutMultiplier: 2.0,
  },
  {
    id: 'high_pollution',
    name: 'Severe Pollution',
    icon: '😷',
    category: 'environment',
    description: 'AQI exceeding 400 making outdoor work dangerous',
    triggerThreshold: 'AQI > 400',
    avgDuration: '24-72 hours',
    payoutMultiplier: 0.7,
  },
  {
    id: 'platform_outage',
    name: 'Platform Outage',
    icon: '📱',
    category: 'technical',
    description: 'Complete platform downtime affecting order flow',
    triggerThreshold: 'Platform unavailable > 2 hours',
    avgDuration: '2-6 hours',
    payoutMultiplier: 0.9,
  },
  {
    id: 'curfew',
    name: 'Curfew/Bandh',
    icon: '🚫',
    category: 'civic',
    description: 'Government-imposed curfew or city-wide bandh',
    triggerThreshold: 'Official curfew declared',
    avgDuration: '12-24 hours',
    payoutMultiplier: 1.2,
  },
  {
    id: 'traffic_jam',
    name: 'Severe Traffic',
    icon: '🚗',
    category: 'traffic',
    description: 'Extreme congestion reducing deliveries by 60%+',
    triggerThreshold: 'Average speed < 5 km/h for 3+ hours',
    avgDuration: '3-6 hours',
    payoutMultiplier: 0.5,
  },
];

// Generate mock workers
export const generateMockWorkers = (count = 50) => {
  const firstNames = ['Rajesh', 'Suresh', 'Amit', 'Priya', 'Deepak', 'Sunita', 'Vikram', 'Anjali', 'Ravi', 'Meena', 'Arjun', 'Kavita', 'Manoj', 'Neha', 'Sanjay', 'Pooja', 'Kiran', 'Divya', 'Rohit', 'Lakshmi'];
  const lastNames = ['Kumar', 'Singh', 'Sharma', 'Patel', 'Das', 'Gupta', 'Verma', 'Yadav', 'Joshi', 'Reddy', 'Nair', 'Iyer', 'Pillai', 'Mishra', 'Tiwari'];

  const workers = [];
  for (let i = 0; i < count; i++) {
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
    const joinDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const weeklyEarning = 3000 + Math.floor(Math.random() * 7000);
    const deliveriesPerDay = 8 + Math.floor(Math.random() * 20);

    workers.push({
      id: `WKR-${String(i + 1).padStart(4, '0')}`,
      firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
      phone: `+91 ${Math.floor(7000000000 + Math.random() * 3000000000)}`,
      email: `worker${i + 1}@example.com`,
      city: city,
      platform: platform,
      vehicleType: ['Bicycle', 'Motorcycle', 'Scooter', 'E-bike'][Math.floor(Math.random() * 4)],
      joinDate: joinDate.toISOString().split('T')[0],
      avgWeeklyEarning: weeklyEarning,
      avgDeliveriesPerDay: deliveriesPerDay,
      riskScore: Math.round((Math.random() * 40 + 30 + city.riskMultiplier * 15) * 10) / 10,
      isActive: Math.random() > 0.1,
      totalClaims: Math.floor(Math.random() * 8),
      totalPayouts: Math.floor(Math.random() * 15000),
    });
  }
  return workers;
};

// Generate mock policies
export const generateMockPolicies = (workers) => {
  const policies = [];
  workers.forEach((worker, idx) => {
    if (!worker.isActive) return;
    const basePremium = worker.avgWeeklyEarning * 0.03;
    const riskAdjustedPremium = Math.round(basePremium * (worker.riskScore / 50) * worker.city.riskMultiplier);
    const coverage = Math.round(worker.avgWeeklyEarning * 0.7);
    const startDate = new Date(2026, 2, 10 + Math.floor(Math.random() * 7));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    policies.push({
      id: `POL-${String(idx + 1).padStart(5, '0')}`,
      workerId: worker.id,
      workerName: `${worker.firstName} ${worker.lastName}`,
      city: worker.city.name,
      platform: worker.platform.name,
      weeklyPremium: riskAdjustedPremium,
      maxCoverage: coverage,
      riskScore: worker.riskScore,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: ['active', 'active', 'active', 'expired', 'pending'][Math.floor(Math.random() * 5)],
      coveredDisruptions: DISRUPTION_TYPES.slice(0, 3 + Math.floor(Math.random() * 5)).map(d => d.id),
      autoRenew: Math.random() > 0.3,
    });
  });
  return policies;
};

// Generate mock claims
export const generateMockClaims = (policies) => {
  const claims = [];
  let claimIdx = 0;
  policies.forEach((policy) => {
    if (Math.random() > 0.4) return;
    const numClaims = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numClaims; i++) {
      const disruption = DISRUPTION_TYPES[Math.floor(Math.random() * DISRUPTION_TYPES.length)];
      const claimDate = new Date(2026, 2, 10 + Math.floor(Math.random() * 7));
      const lostHours = 2 + Math.floor(Math.random() * 10);
      const hourlyRate = policy.maxCoverage / 42; // Assuming 42 working hours per week
      const claimAmount = Math.round(hourlyRate * lostHours * disruption.payoutMultiplier);
      const statuses = ['auto_approved', 'auto_approved', 'auto_approved', 'pending_review', 'paid', 'paid', 'flagged'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      claims.push({
        id: `CLM-${String(++claimIdx).padStart(5, '0')}`,
        policyId: policy.id,
        workerId: policy.workerId,
        workerName: policy.workerName,
        city: policy.city,
        platform: policy.platform,
        disruptionType: disruption,
        claimDate: claimDate.toISOString().split('T')[0],
        claimTime: `${String(Math.floor(Math.random() * 12) + 6).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        lostHours: lostHours,
        claimAmount: claimAmount,
        status: status,
        triggerData: {
          source: disruption.category === 'weather' ? 'OpenWeatherMap API' : disruption.category === 'environment' ? 'AQICN API' : 'Internal Monitoring',
          value: generateTriggerValue(disruption),
          threshold: disruption.triggerThreshold,
          confidence: Math.round((0.8 + Math.random() * 0.2) * 100),
        },
        fraudCheck: {
          score: Math.round(Math.random() * 30),
          locationVerified: Math.random() > 0.1,
          duplicateCheck: 'passed',
          anomalyFlag: Math.random() > 0.85 ? 'flagged' : 'clear',
        },
        payoutDate: status === 'paid' ? claimDate.toISOString().split('T')[0] : null,
        payoutMethod: 'UPI',
      });
    }
  });
  return claims;
};

function generateTriggerValue(disruption) {
  switch (disruption.id) {
    case 'heavy_rain': return `${60 + Math.floor(Math.random() * 40)}mm/hr`;
    case 'extreme_heat': return `${46 + Math.floor(Math.random() * 5)}°C`;
    case 'flooding': return `${35 + Math.floor(Math.random() * 30)}cm water level`;
    case 'cyclone': return `${95 + Math.floor(Math.random() * 60)} km/h winds`;
    case 'high_pollution': return `AQI ${420 + Math.floor(Math.random() * 80)}`;
    case 'platform_outage': return `${2 + Math.floor(Math.random() * 4)} hours downtime`;
    case 'curfew': return 'Section 144 imposed';
    case 'traffic_jam': return `Average speed ${2 + Math.floor(Math.random() * 3)} km/h`;
    default: return 'Triggered';
  }
}

// Weather simulation data
export const generateWeatherData = () => {
  const now = new Date();
  const data = [];
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now);
    hour.setHours(hour.getHours() - i);
    data.push({
      time: `${String(hour.getHours()).padStart(2, '0')}:00`,
      temperature: 25 + Math.random() * 15,
      humidity: 40 + Math.random() * 50,
      rainfall: Math.random() > 0.7 ? Math.random() * 80 : 0,
      windSpeed: 5 + Math.random() * 35,
      aqi: 50 + Math.floor(Math.random() * 350),
    });
  }
  return data;
};

// Risk assessment data by city
export const generateRiskAssessment = (city) => {
  const baseRisk = city.riskMultiplier;
  return {
    overallRisk: Math.round(baseRisk * 45 + Math.random() * 20),
    weatherRisk: Math.round(baseRisk * 50 + Math.random() * 25),
    pollutionRisk: Math.round(baseRisk * 30 + Math.random() * 30),
    trafficRisk: Math.round(baseRisk * 40 + Math.random() * 20),
    platformRisk: Math.round(15 + Math.random() * 20),
    civicRisk: Math.round(10 + Math.random() * 25),
    historicalEvents: Math.floor(5 + Math.random() * 15),
    avgPayoutPerEvent: Math.round(500 + Math.random() * 1500),
  };
};

// Analytics data generation
export const generateAnalytics = () => {
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  return {
    premiumCollection: months.map((m, i) => ({
      month: m,
      amount: 150000 + Math.floor(Math.random() * 100000) + i * 20000,
      policies: 200 + Math.floor(Math.random() * 100) + i * 30,
    })),
    claimsTrend: months.map((m, i) => ({
      month: m,
      claims: 30 + Math.floor(Math.random() * 40),
      approved: 20 + Math.floor(Math.random() * 25),
      rejected: 2 + Math.floor(Math.random() * 5),
      paid: Math.round((180000 + Math.random() * 120000)),
    })),
    disruptionFrequency: DISRUPTION_TYPES.map(d => ({
      type: d.name,
      icon: d.icon,
      count: Math.floor(5 + Math.random() * 25),
      totalPayout: Math.floor(50000 + Math.random() * 200000),
    })),
    cityWise: CITIES.map(c => ({
      city: c.name,
      workers: Math.floor(50 + Math.random() * 200),
      activePolicies: Math.floor(40 + Math.random() * 150),
      claims: Math.floor(10 + Math.random() * 50),
      revenue: Math.floor(100000 + Math.random() * 500000),
      avgRisk: Math.round(c.riskMultiplier * 50 + Math.random() * 15),
    })),
    lossRatio: months.map((m) => ({
      month: m,
      ratio: Math.round((0.4 + Math.random() * 0.35) * 100) / 100,
    })),
  };
};

// Live alerts simulation
export const generateLiveAlerts = () => [
  {
    id: 'ALT-001',
    type: 'critical',
    disruption: DISRUPTION_TYPES[0],
    city: 'Mumbai',
    message: 'Heavy rainfall detected: 72mm/hr in Andheri-Goregaon belt',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    affectedWorkers: 156,
    estimatedPayout: 234000,
    status: 'active',
  },
  {
    id: 'ALT-002',
    type: 'warning',
    disruption: DISRUPTION_TYPES[4],
    city: 'Delhi',
    message: 'AQI rising to 445 in North Delhi zones',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    affectedWorkers: 89,
    estimatedPayout: 89000,
    status: 'monitoring',
  },
  {
    id: 'ALT-003',
    type: 'info',
    disruption: DISRUPTION_TYPES[5],
    city: 'Bengaluru',
    message: 'Swiggy intermittent connectivity in HSR/BTM areas',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    affectedWorkers: 42,
    estimatedPayout: 31500,
    status: 'resolved',
  },
  {
    id: 'ALT-004',
    type: 'warning',
    disruption: DISRUPTION_TYPES[2],
    city: 'Chennai',
    message: 'Waterlogging reported in T. Nagar and Mylapore',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    affectedWorkers: 67,
    estimatedPayout: 100500,
    status: 'active',
  },
  {
    id: 'ALT-005',
    type: 'critical',
    disruption: DISRUPTION_TYPES[3],
    city: 'Kolkata',
    message: 'Cyclone warning: Wind speeds expected to reach 110 km/h',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    affectedWorkers: 312,
    estimatedPayout: 780000,
    status: 'active',
  },
];

// Plan feature sets
export const PLAN_FEATURES = {
  basic: {
    name: 'Essential Guard',
    included: ['Heavy Rain (>50mm)', 'Heat (>45°C)', 'AQI >400', '48hr Support'],
    excluded: ['Flooding', 'Platform Outage', 'Accidents'],
  },
  standard: {
    name: 'Smart Partner',
    included: ['Everything in Basic', 'Flooding (>30cm)', 'Platform Outage', '12hr Support'],
    excluded: ['Cyclones', 'Theft', 'Vehicle Damage'],
  },
  prime: {
    name: 'Total Resilience',
    included: ['Everything in Smart', 'Cyclone (>90km/h)', 'Instant Payout', '2hr Support'],
    excluded: ['War', 'Pandemics', 'Terrorism', 'Nuclear'],
  }
};

// Premium calculation engine (AI-driven simulation)
export const calculatePremium = (workerData) => {
  const { city, platform, avgWeeklyEarning, vehicleType, avgDeliveriesPerDay } = workerData;

  const cityObj = CITIES.find(c => c.id === city) || CITIES[0];
  const baseRate = 0.022; // 2.2% base

  // 1. Location & Environmental Risk
  const cityRisk = cityObj.riskMultiplier;

  // 2. Platform Reliability Risk
  const platformRisk = { 'zepto': 1.1, 'blinkit': 1.05, 'swiggy': 1.0, 'amazon_flex': 0.95 }[platform] || 1.0;

  // 3. Traffic & Congestion Risk (Simulated per city style)
  const trafficRisk = (cityObj.id === 'bangalore' || cityObj.id === 'mumbai') ? 1.25 : 1.05;

  // 4. Vehicle Hazard Factor
  const vehicleFactor = { 'Bicycle': 1.3, 'E-bike': 1.15, 'Scooter': 1.0, 'Motorcycle': 0.95 }[vehicleType] || 1.0;

  // 5. Volume Exposure
  const exposureFactor = avgDeliveriesPerDay > 30 ? 1.2 : avgDeliveriesPerDay > 20 ? 1.1 : 1.0;

  // 6. Seasonal/Month-based Risk
  const month = new Date().getMonth();
  // Monsoon (June-Sept) = High Rain/Flood, Winter (Nov-Jan) = Fog/AQI in North
  let seasonalRisk = 1.0;
  if (month >= 5 && month <= 8) seasonalRisk = 1.35; // Monsoon
  if ((month >= 10 || month <= 0) && cityObj.state === 'Delhi') seasonalRisk = 1.30; // Winter Fog/AQI

  const totalMultiplier = cityRisk * platformRisk * trafficRisk * vehicleFactor * exposureFactor * seasonalRisk;
  const rawWeeklyPremium = avgWeeklyEarning * baseRate * totalMultiplier;
  const maxWeeklyCoverage = Math.round(avgWeeklyEarning * 0.80);

  const riskScore = Math.min(100, Math.round((totalMultiplier / 2.5) * 100));

  return {
    weeklyPremium: Math.round(rawWeeklyPremium),
    maxCoverage: maxWeeklyCoverage,
    riskScore,
    breakdown: {
      locationRisk: `${((cityRisk - 1) * 100).toFixed(0)}%`,
      trafficCongestion: `${((trafficRisk - 1) * 100).toFixed(0)}%`,
      platformOutage: `${((platformRisk - 1) * 100).toFixed(0)}%`,
      seasonalRisk: `${((seasonalRisk - 1) * 100).toFixed(0)}%`,
      vehicleHazard: `${((vehicleFactor - 1) * 100).toFixed(0)}%`,
    }
  };
};

export const getPackages = (basePremium, maxCoverage) => {
  return [
    {
      id: 'basic',
      ...PLAN_FEATURES.basic,
      premium: Math.round(basePremium * 0.8),
      coverage: Math.round(maxCoverage * 0.6),
      multiplier: 0.8,
    },
    {
      id: 'standard',
      ...PLAN_FEATURES.standard,
      premium: basePremium,
      coverage: maxCoverage,
      multiplier: 1.0,
      recommended: true,
    },
    {
      id: 'prime',
      ...PLAN_FEATURES.prime,
      premium: Math.round(basePremium * 1.4),
      coverage: Math.round(maxCoverage * 1.5),
      multiplier: 1.4,
    }
  ];
};

export const getStatePlanDiscovery = (stateName = 'Maharashtra', income = 7000) => {
  // Find a representative city in the selected state
  const cityObj = CITIES.find(c => c.state === stateName) || CITIES[0];
  
  // Sample calculation for discovery panel using the location's real risk multiplier
  const sampleData = { 
    city: cityObj.id, 
    platform: 'swiggy', 
    avgWeeklyEarning: income, 
    vehicleType: 'Motorcycle', 
    avgDeliveriesPerDay: 20 
  };
  const calc = calculatePremium(sampleData);
  return getPackages(calc.weeklyPremium, calc.maxCoverage);
};

// Initialize all mock data
export const initializeMockData = () => {
  const workers = generateMockWorkers(50);
  const policies = generateMockPolicies(workers);
  const claims = generateMockClaims(policies);
  const analytics = generateAnalytics();
  const alerts = generateLiveAlerts();

  return { workers, policies, claims, analytics, alerts };
};
