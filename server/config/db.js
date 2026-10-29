import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);
// Strips query-operator objects (e.g. { $gt: '' }) from user-supplied filters.
mongoose.set('sanitizeFilter', true);

export async function connectDB(uri = env.MONGODB_URI) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
