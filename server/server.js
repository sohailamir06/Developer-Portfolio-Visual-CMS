import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';
import { ensureDefaults } from './services/defaults.js';
import User from './models/User.js';

async function main() {
  try {
    await connectDB();
  } catch (err) {
    console.error(`\nCould not connect to MongoDB at ${env.MONGODB_URI.replace(/\/\/[^@]*@/, '//***@')}\n${err.message}\n`);
    console.error('Start MongoDB or update MONGODB_URI in server/.env (see docs/setup.md).');
    process.exit(1);
  }
  await ensureDefaults();

  if ((await User.countDocuments()) === 0) {
    console.warn('\n⚠  No administrator account exists yet. Create one with:  npm run create-admin\n');
  }
  if (env.MEDIA_PROVIDER === 'local') {
    console.log('Media provider: local disk (server/uploads). Set MEDIA_PROVIDER=cloudinary for cloud storage.');
  }

  const server = createApp().listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async () => {
    server.close();
    await disconnectDB();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
