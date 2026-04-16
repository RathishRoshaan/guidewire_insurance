const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Worker = require('../models/Worker');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for migration');

    const workers = await Worker.find();
    console.log(`Found ${workers.length} workers to migrate`);

    for (const worker of workers) {
      const existingUser = await User.findOne({ username: worker.username });
      if (existingUser) {
        console.log(`User ${worker.username} already exists, skipping...`);
        continue;
      }

      const newUser = new User({
        fullName: `${worker.firstName} ${worker.lastName}`,
        username: worker.username,
        password: worker.password, // already hashed
        platform: worker.platform,
        weeklyIncome: worker.weeklyIncome,
        city: worker.city,
        state: worker.state || 'Maharashtra',
        riskScore: 35, // Default for migration
        riskLevel: 'Low',
        riskFactors: ['Migrated from legacy system'],
        packs: {}, // Will be populated when they check or renew
        createdAt: worker.joinDate || new Date()
      });

      await newUser.save();
      console.log(`Migrated ${worker.username}`);
    }

    console.log('Migration completed successfully ✅');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed ❌', err);
    process.exit(1);
  }
}

migrate();
