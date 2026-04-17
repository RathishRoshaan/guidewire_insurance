const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Worker = require('../models/Worker');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not defined in .env');
  process.exit(1);
}

const MOCK_WORKERS = [
  {
    workerId: 'worker_rajesh',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    username: 'rajesh_swiggy',
    password: 'password123',
    city: 'Bangalore',
    state: 'Karnataka',
    operationZone: { lat: 12.9716, lon: 77.5946, radius_km: 20 },
    platform: 'Swiggy',
    weeklyIncome: 8500
  },
  {
    workerId: 'worker_priya',
    firstName: 'Priya',
    lastName: 'Sharma',
    username: 'priya_zomato',
    password: 'password123',
    city: 'Delhi',
    state: 'Delhi',
    operationZone: { lat: 28.6139, lon: 77.2090, radius_km: 25 },
    platform: 'Zomato',
    weeklyIncome: 9200
  },
  {
    workerId: 'worker_arun',
    firstName: 'Arun',
    lastName: 'Das',
    username: 'arun_dunzo',
    password: 'password123',
    city: 'Kolkata',
    state: 'West Bengal',
    operationZone: { lat: 22.5726, lon: 88.3639, radius_km: 15 },
    platform: 'Dunzo',
    weeklyIncome: 6800
  }
];

const PACKAGES = [
  { id: 'pkg_essential', name: 'Essential Guard', premium: 149, coverage: 5000 },
  { id: 'pkg_smart', name: 'Smart Partner', premium: 299, coverage: 12000 },
  { id: 'pkg_total', name: 'Total Resilience', premium: 599, coverage: 25000 }
];

const DISRUPTIONS = [
  { name: 'Heavy Rain', icon: '🌧️', threshold: '> 50mm' },
  { name: 'Heatwave', icon: '☀️', threshold: '> 45°C' },
  { name: 'Poor AQI', icon: '🌫️', threshold: '> 400' },
  { name: 'Platform Outage', icon: '🔌', threshold: 'System Down' }
];

async function seedData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    // Clear existing data
    console.log('Clearing existing data...');
    await Worker.deleteMany({});
    await Policy.deleteMany({});
    await Claim.deleteMany({});
    console.log('Collections cleared.');

    // Create Workers and Policies
    for (const wData of MOCK_WORKERS) {
      const worker = await Worker.create(wData);
      console.log(`Created Worker: ${worker.username}`);

      // Assign a random package
      const pkg = PACKAGES[Math.floor(Math.random() * PACKAGES.length)];
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 2); // Policy started 2 days ago
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const policy = await Policy.create({
        policyId: 'POL-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        workerId: worker.workerId,
        userId: worker.workerId,
        workerName: `${worker.firstName} ${worker.lastName}`,
        city: worker.city,
        platform: worker.platform,
        packageId: pkg.id,
        packageName: pkg.name,
        weeklyPremium: pkg.premium,
        maxCoverage: pkg.coverage,
        coveredDisruptions: DISRUPTIONS.map(d => d.name),
        startDate,
        endDate,
        status: 'active'
      });
      console.log(`Created Policy: ${policy.policyId} for ${worker.username}`);

      // Create 3-5 claims for each worker
      const numClaims = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numClaims; i++) {
        const disruption = DISRUPTIONS[Math.floor(Math.random() * DISRUPTIONS.length)];
        const claimDate = new Date();
        claimDate.setDate(claimDate.getDate() - (1 + i));

        const statusOptions = ['paid', 'pending_review', 'auto_approved', 'flagged'];
        const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
        const amount = Math.floor(500 + Math.random() * 2000);
        const fraudScore = Math.floor(Math.random() * 40);

        await Claim.create({
          claimId: 'CLM-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          workerId: worker.workerId,
          userId: worker.workerId,
          workerName: `${worker.firstName} ${worker.lastName}`,
          policyId: policy.policyId,
          disruptionType: disruption.name,
          claimAmount: amount,
          lostHours: 4 + Math.floor(Math.random() * 6),
          description: `Disruption due to ${disruption.name.toLowerCase()} in ${worker.city}.`,
          claimDate,
          status,
          isAutoTrigger: Math.random() > 0.3,
          isManualRequest: Math.random() <= 0.3,
          fraudScore,
          triggerData: {
            lat: worker.operationZone.lat + (Math.random() - 0.5) * 0.01,
            lon: worker.operationZone.lon + (Math.random() - 0.5) * 0.01,
            measuredWeather: {
              temp: 32 + Math.floor(Math.random() * 10),
              rain: disruption.name === 'Heavy Rain' ? 60 : 5,
              aqi: disruption.name === 'Poor AQI' ? 450 : 80,
              description: disruption.name
            }
          },
          fraudCheck: {
            isGpsValid: true,
            isWeatherValid: true,
            score: fraudScore,
            reason: 'Seeded verified data'
          },
          transactionId: status === 'paid' ? 'TXN-' + Math.random().toString(36).substr(2, 8).toUpperCase() : null
        });
      }
      console.log(`Created ${numClaims} claims for ${worker.username}`);
    }

    console.log('\n✅ Database seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedData();
