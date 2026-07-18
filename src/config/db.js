const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (!cachedConnection) {
    console.log('🔄 Connecting to MongoDB...');
    cachedConnection = mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    }).then((conn) => {
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      return conn;
    }).catch((error) => {
      console.error(`❌ MongoDB connection error: ${error.message}`);
      cachedConnection = null; // Reset cached connection promise on failure so next request retries
      throw error;
    });
  }

  return cachedConnection;
};

module.exports = connectDB;
