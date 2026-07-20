const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!cachedConnection) {
    console.log('🔄 Connecting to MongoDB Atlas...');
    cachedConnection = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    }).then((conn) => {
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      return conn;
    }).catch((error) => {
      console.error(`❌ MongoDB connection error: ${error.message}`);
      cachedConnection = null;
      throw error;
    });
  }

  return cachedConnection;
};

module.exports = connectDB;
