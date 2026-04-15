/**
 * GigShield — Seed Script
 * Seeds 10 workers, 10 policies, ~15 claims, and transactions into MongoDB
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Worker = require('./models/Worker');
const Policy = require('./models/Policy');
const Claim = require('./models/Claim');
const Transaction = require('./models/Transaction');

const WORKERS = [
  { workerId: 'WKR-1001', firstName: 'Rajesh', lastName: 'Kumar', username: 'rajesh', phone: '+91 9876543210', email: 'rajesh@gmail.com', city: 'Mumbai', state: 'Maharashtra', lat: 19.076, lon: 72.8777, platform: 'Swiggy', weeklyIncome: 8000, idType: 'Aadhaar', idNumber: '1234-5678-9012' },
  { workerId: 'WKR-1002', firstName: 'Priya', lastName: 'Sharma', username: 'priya', phone: '+91 9876543211', email: 'priya@gmail.com', city: 'Delhi', state: 'Delhi', lat: 28.6139, lon: 77.209, platform: 'Zomato', weeklyIncome: 7500, idType: 'PAN', idNumber: 'ABCDE1234F' },
  { workerId: 'WKR-1003', firstName: 'Amit', lastName: 'Patel', username: 'amit', phone: '+91 9876543212', email: 'amit@gmail.com', city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714, platform: 'Dunzo', weeklyIncome: 6000, idType: 'Aadhaar', idNumber: '2345-6789-0123' },
  { workerId: 'WKR-1004', firstName: 'Sunita', lastName: 'Das', username: 'sunita', phone: '+91 9876543213', email: 'sunita@gmail.com', city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639, platform: 'Blinkit', weeklyIncome: 5500, idType: 'Voter ID', idNumber: 'WB/11/234/567890' },
  { workerId: 'WKR-1005', firstName: 'Vikram', lastName: 'Singh', username: 'vikram', phone: '+91 9876543214', email: 'vikram@gmail.com', city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, platform: 'Amazon Flex', weeklyIncome: 7000, idType: 'Driving License', idNumber: 'RJ-1420180012345' },
  { workerId: 'WKR-1006', firstName: 'Deepa', lastName: 'Nair', username: 'deepa', phone: '+91 9876543215', email: 'deepa@gmail.com', city: 'Kochi', state: 'Kerala', lat: 9.9312, lon: 76.2673, platform: 'Swiggy', weeklyIncome: 6500, idType: 'Aadhaar', idNumber: '3456-7890-1234' },
  { workerId: 'WKR-1007', firstName: 'Manoj', lastName: 'Reddy', username: 'manoj', phone: '+91 9876543216', email: 'manoj@gmail.com', city: 'Hyderabad', state: 'Telangana', lat: 17.385, lon: 78.4867, platform: 'Zomato', weeklyIncome: 8500, idType: 'PAN', idNumber: 'FGHIJ5678K' },
  { workerId: 'WKR-1008', firstName: 'Kavita', lastName: 'Iyer', username: 'kavita', phone: '+91 9876543217', email: 'kavita@gmail.com', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, platform: 'Zepto', weeklyIncome: 7200, idType: 'Aadhaar', idNumber: '4567-8901-2345' },
  { workerId: 'WKR-1009', firstName: 'Arjun', lastName: 'Verma', username: 'arjun', phone: '+91 9876543218', email: 'arjun@gmail.com', city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946, platform: 'Porter', weeklyIncome: 9000, idType: 'Driving License', idNumber: 'KA-0520190054321' },
  { workerId: 'WKR-1010', firstName: 'Lakshmi', lastName: 'Tiwari', username: 'lakshmi', phone: '+91 9876543219', email: 'lakshmi@gmail.com', city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, platform: 'Flipkart', weeklyIncome: 5000, idType: 'Voter ID', idNumber: 'UP/09/456/789012' },
];

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not set. Exiting.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }

  // Clear previous data
  await Worker.deleteMany({});
  await Policy.deleteMany({});
  await Claim.deleteMany({});
  await Transaction.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // Default password for all seed workers: "password123"
  const passwordHash = await bcrypt.hash('password123', 10);

  // Seed Workers
  const createdWorkers = [];
  for (const w of WORKERS) {
    const worker = await Worker.create({
      ...w,
      password: passwordHash,
      operationZone: { lat: w.lat, lon: w.lon, radius_km: 50 },
      isActive: true,
      joinDate: new Date(2026, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
    });
    createdWorkers.push(worker);
    console.log(`  👤 Worker: ${w.firstName} ${w.lastName} (${w.city}, ${w.platform})`);
  }

  // Seed Policies (1 per worker)
  const packageNames = ['Essential Guard', 'Smart Partner', 'Total Resilience'];
  const createdPolicies = [];
  for (let i = 0; i < createdWorkers.length; i++) {
    const w = createdWorkers[i];
    const pkgIdx = i % 3;
    const premiumMult = [0.025, 0.04, 0.06][pkgIdx];
    const coverageMult = [0.5, 0.75, 1.0][pkgIdx];
    const now = new Date();
    const start = new Date(now.getTime() - (Math.floor(Math.random() * 4)) * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    const policy = await Policy.create({
      policyId: `POL-${String(1001 + i)}`,
      workerId: w.workerId,
      packageId: ['basic', 'standard', 'premium'][pkgIdx],
      packageName: packageNames[pkgIdx],
      weeklyPremium: Math.round(w.weeklyIncome * premiumMult),
      maxCoverage: Math.round(w.weeklyIncome * coverageMult),
      startDate: start,
      endDate: end,
      status: 'active',
      city: w.city,
      state: w.state,
      coveredDisruptions: pkgIdx === 0
        ? ['Heavy Rain', 'Extreme Heat', 'Severe Pollution']
        : pkgIdx === 1
          ? ['Heavy Rain', 'Extreme Heat', 'Severe Pollution', 'Flooding', 'Platform Outage']
          : ['Heavy Rain', 'Extreme Heat', 'Severe Pollution', 'Flooding', 'Platform Outage', 'Cyclone', 'Curfew'],
    });
    createdPolicies.push(policy);
    console.log(`  📋 Policy: ${policy.policyId} → ${w.firstName} (${packageNames[pkgIdx]}, ₹${policy.weeklyPremium}/wk)`);
  }

  // Seed Claims (~15 claims across workers)
  const claimData = [
    { workerIdx: 0, disruption: 'Heavy Rain', status: 'paid', hours: 6 },
    { workerIdx: 0, disruption: 'Flooding', status: 'paid', hours: 8 },
    { workerIdx: 1, disruption: 'Severe Pollution', status: 'auto_approved', hours: 5 },
    { workerIdx: 2, disruption: 'Extreme Heat', status: 'paid', hours: 4 },
    { workerIdx: 3, disruption: 'Heavy Rain', status: 'pending_review', hours: 7 },
    { workerIdx: 3, disruption: 'Cyclone', status: 'paid', hours: 10 },
    { workerIdx: 4, disruption: 'Extreme Heat', status: 'paid', hours: 6 },
    { workerIdx: 5, disruption: 'Heavy Rain', status: 'auto_approved', hours: 5 },
    { workerIdx: 5, disruption: 'Flooding', status: 'paid', hours: 9 },
    { workerIdx: 6, disruption: 'Heavy Rain', status: 'paid', hours: 4 },
    { workerIdx: 7, disruption: 'Cyclone', status: 'flagged', hours: 8 },
    { workerIdx: 7, disruption: 'Extreme Heat', status: 'paid', hours: 5 },
    { workerIdx: 8, disruption: 'Platform Outage', status: 'paid', hours: 3 },
    { workerIdx: 9, disruption: 'Severe Pollution', status: 'pending_review', hours: 6 },
    { workerIdx: 9, disruption: 'Heavy Rain', status: 'paid', hours: 5 },
  ];

  for (let i = 0; i < claimData.length; i++) {
    const cd = claimData[i];
    const policy = createdPolicies[cd.workerIdx];
    const dailyCoverage = Math.round(policy.maxCoverage / 7);
    const claimAmount = Math.round((dailyCoverage / 10) * cd.hours);
    const daysAgo = Math.floor(Math.random() * 5) + 1;

    const claim = await Claim.create({
      claimId: `CLM-${String(1001 + i)}`,
      workerId: policy.workerId,
      policyId: policy.policyId,
      disruptionType: cd.disruption,
      claimAmount,
      lostHours: cd.hours,
      description: `${cd.disruption} disruption in ${WORKERS[cd.workerIdx].city}`,
      claimDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      status: cd.status,
      isAutoTrigger: cd.status === 'auto_approved',
      triggerData: {
        lat: WORKERS[cd.workerIdx].lat,
        lon: WORKERS[cd.workerIdx].lon,
        measuredWeather: {
          temp: 30 + Math.floor(Math.random() * 15),
          rain: cd.disruption.includes('Rain') || cd.disruption.includes('Flood') ? 55 + Math.floor(Math.random() * 40) : Math.floor(Math.random() * 5),
          aqi: cd.disruption.includes('Pollution') ? 420 + Math.floor(Math.random() * 80) : 50 + Math.floor(Math.random() * 100),
          description: cd.disruption,
        },
      },
      fraudCheck: {
        isGpsValid: cd.status !== 'flagged',
        isWeatherValid: cd.status !== 'flagged',
        score: cd.status === 'flagged' ? 65 + Math.floor(Math.random() * 20) : Math.floor(Math.random() * 25),
        reason: cd.status === 'flagged' ? 'GPS mismatch detected | Unusual claim pattern' : 'All checks passed',
      },
      transactionId: cd.status === 'paid' ? `txn_seed_${1001 + i}` : null,
    });

    // Create transaction for paid claims
    if (cd.status === 'paid') {
      await Transaction.create({
        transactionId: `txn_seed_${1001 + i}`,
        claimId: claim.claimId,
        workerId: policy.workerId,
        amount: claimAmount,
        status: 'processed',
        method: 'UPI',
      });
    }

    console.log(`  📄 Claim: ${claim.claimId} → ${cd.disruption} (₹${claimAmount}, ${cd.status})`);
  }

  console.log('\n✅ Seeding complete!');
  console.log(`   👤 ${createdWorkers.length} Workers`);
  console.log(`   📋 ${createdPolicies.length} Policies`);
  console.log(`   📄 ${claimData.length} Claims`);
  console.log(`   💳 ${claimData.filter(c => c.status === 'paid').length} Transactions`);
  console.log('\n   Login credentials for any worker: username/<password123>');
  console.log('   Admin login: admin/admin123\n');

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
