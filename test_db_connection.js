require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  console.log("🔄 Testing MongoDB Atlas Connection...");
  console.log("URI:", process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 30) + '...' : 'UNDEFINED');
  try {
    const startTime = Date.now();
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`✅ Connection SUCCESS in ${Date.now() - startTime}ms! Connected to host: ${mongoose.connection.host}`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Connection FAILED: ${err.message}`);
    process.exit(1);
  }
}

testConnection();
