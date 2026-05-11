import mongoose from 'mongoose';
import logger from './logger';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not defined in environment variables');

  await mongoose.connect(uri);
  logger.info('MongoDB connected');

  mongoose.connection.on('error', (err) => logger.error('MongoDB error', err));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
};
