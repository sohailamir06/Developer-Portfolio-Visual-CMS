import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { ADMIN, app, createAdmin, loginAgent } from './helpers.js';
import User from '../models/User.js';

describe('authentication', () => {
  beforeAll(async () => {
    await createAdmin();
  });

  it('logs in with valid credentials and sets an HTTP-only session cookie', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: ADMIN.email, password: ADMIN.password });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(ADMIN.email);
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.csrfToken).toMatch(/^[a-f0-9]{48}$/);
    const cookie = res.headers['set-cookie'].join(';');
    expect(cookie).toMatch(/pf_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it('rejects a wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: ADMIN.email, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('rejects an unknown email with the same message', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.local', password: 'whatever-123' });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('blocks NoSQL operator injection in the login body', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
    expect(res.status).toBe(400);
  });

  it('rejects disabled accounts', async () => {
    await createAdmin({ email: 'disabled@test.local' });
    await User.updateOne({ email: 'disabled@test.local' }, { status: 'disabled' });
    const res = await request(app).post('/api/auth/login').send({ email: 'disabled@test.local', password: ADMIN.password });
    expect(res.status).toBe(401);
  });

  it('protected admin APIs reject unauthenticated requests', async () => {
    for (const [method, url] of [
      ['get', '/api/admin/pages'],
      ['get', '/api/admin/settings'],
      ['post', '/api/admin/projects'],
      ['get', '/api/admin/messages'],
      ['get', '/api/admin/media'],
      ['get', '/api/auth/me'],
    ]) {
      const res = await request(app)[method](url).send({});
      expect(res.status, `${method} ${url}`).toBe(401);
    }
  });

  it('rejects a forged session cookie', async () => {
    const res = await request(app).get('/api/admin/pages').set('Cookie', 'pf_session=eyJhbGciOiJIUzI1NiJ9.e30.invalid');
    expect(res.status).toBe(401);
  });

  it('requires the CSRF token for state-changing admin requests', async () => {
    const { agent } = await loginAgent();
    const res = await agent.post('/api/admin/skills').send({ name: 'Rust', category: 'Backend' });
    expect(res.status).toBe(403);
  });

  it('returns the current user from /me and logs out', async () => {
    const s = await loginAgent();
    const me = await s.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.csrfToken).toBe(s.csrf);
    const out = await s.post('/api/auth/logout');
    expect(out.status).toBe(200);
    expect((await s.get('/api/auth/me')).status).toBe(401);
  });

  it('has no public registration endpoint', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@y.z', password: 'abcdefghijk' });
    expect(res.status).toBe(404);
  });
});
