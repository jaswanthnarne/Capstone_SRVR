require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Batch = require('../models/Batch');

async function updateDates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const result = await Batch.updateMany(
      {},
      {
        $set: {
          startDate: new Date('2026-07-13T00:00:00.000Z'),
          endDate: new Date('2026-07-19T23:59:59.000Z')
        }
      }
    );

    console.log(`✅ Updated batch dates (Start: 2026-07-13, End: 2026-07-19). Matches: ${result.modifiedCount}`);
  } catch (err) {
    console.error('❌ Error updating batch dates:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

updateDates();
