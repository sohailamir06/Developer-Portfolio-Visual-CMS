import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';

// Resolve mongodb+srv:// SRV queries using public DNS if local router DNS fails/refuses SRV records on Windows
if (env.MONGODB_URI.startsWith('mongodb+srv://')) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {
    // Keep default servers if setServers fails
  }
}

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
