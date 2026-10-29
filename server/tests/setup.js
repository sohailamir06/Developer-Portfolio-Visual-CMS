import { afterAll, beforeAll } from 'vitest';
import mongoose from 'mongoose';

// Tests always use a dedicated database. Refuse to run against anything that is not clearly a test DB.
process.env.MONGODB_TEST_URI ||= 'mongodb://127.0.0.1:27017/developer_portfolio_test';
const { env } = await import('../config/env.js');
if (!/test/i.test(env.MONGODB_URI)) throw new Error(`Refusing to run tests against non-test database: ${env.MONGODB_URI}`);

const { connectDB } = await import('../config/db.js');

beforeAll(async () => {
  await connectDB();
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
