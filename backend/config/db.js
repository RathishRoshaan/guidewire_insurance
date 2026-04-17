const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected to Atlas ✅');
    return conn;
  } catch (error) {
    console.log(`\n❌ Atlas connection failed (${error.message}). Starting Local In-Memory Database...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      
      const conn = await mongoose.connect(uri);
      console.log('MongoDB Connected (Local In-Memory Server) 🚀✅');
      return conn;
    } catch (localError) {
      console.error('❌ Local In-Memory DB failed:', localError);
      // Removed process.exit(1) to keep server alive for other services (AI Chatbot)
    }
  }
};

module.exports = connectDB;
