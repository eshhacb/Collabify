import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/collabify-notifications';
    
    // Try to connect to MongoDB
    try {
      await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB connected for notification service');
    } catch (mongoError) {
      console.warn('MongoDB not available, using in-memory storage for development');
      console.warn('For production, please install and configure MongoDB');
      
      // Create a mock connection for development
      mongoose.connection.readyState = 1;
    }
  } catch (error) {
    console.error('Database connection error:', error);
    // Don't exit process, allow fallback to in-memory storage
  }
};

export default connectDB;
