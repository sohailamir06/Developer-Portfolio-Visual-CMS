import os from 'node:os';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    setupFiles: ['tests/setup.js'],
    // All suites share one test database, so run files sequentially.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
    env: {
      NODE_ENV: 'test',
      SESSION_SECRET: 'test-secret-that-is-at-least-32-characters-long',
      MEDIA_PROVIDER: 'local',
      MEDIA_LOCAL_DIR: path.join(os.tmpdir(), 'portfolio-test-uploads'),
      MEDIA_MAX_FILE_MB: '1',
      RATE_LIMIT_CONTACT_MAX: '3',
      RATE_LIMIT_LOGIN_MAX: '50',
      SMTP_HOST: '',
    },
  },
});
