import request from 'supertest';
import { createApp } from '../app.js';
import User from '../models/User.js';
import { ensureDefaults } from '../services/defaults.js';

export const app = createApp();

export const ADMIN = { email: 'admin@test.local', password: 'correct-horse-battery', name: 'Test Admin' };

export async function createAdmin(overrides = {}) {
  const data = { ...ADMIN, role: 'admin', ...overrides };
  const user = new User({ name: data.name, email: data.email, role: data.role });
  await user.setPassword(data.password);
  return user.save();
}

/** Logs in and returns a supertest agent that carries the session cookie plus the CSRF header. */
export async function loginAgent(credentials = ADMIN) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email: credentials.email, password: credentials.password });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  const csrf = res.body.csrfToken;
  const wrap = (method) => (url) => agent[method](url).set('X-CSRF-Token', csrf);
  return { agent, csrf, get: (url) => agent.get(url), post: wrap('post'), put: wrap('put'), patch: wrap('patch'), del: wrap('delete') };
}

export async function seedSite() {
  await ensureDefaults();
}

// 1×1 transparent PNG
export const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
