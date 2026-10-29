import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, createAdmin, loginAgent, PNG_1PX, seedSite } from './helpers.js';
import ContactMessage from '../models/ContactMessage.js';

let s;

beforeAll(async () => {
  await seedSite();
  await createAdmin();
  s = await loginAgent();
});

describe('media uploads (local provider)', () => {
  let media;

  it('uploads a valid image and stores metadata', async () => {
    const res = await s.post('/api/admin/media').attach('files', PNG_1PX, { filename: 'dot.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    media = res.body[0];
    expect(media).toMatchObject({ originalName: 'dot.png', mimeType: 'image/png', provider: 'local', width: 1, height: 1 });
    expect(media.url).toMatch(/^\/uploads\/\d{4}\/\d{2}\/[a-f0-9]+\.png$/);
    const file = await request(app).get(media.url);
    expect(file.status).toBe(200);
  });

  it('rejects disallowed MIME types', async () => {
    const res = await s.post('/api/admin/media').attach('files', Buffer.from('<svg onload=alert(1)>'), { filename: 'x.svg', contentType: 'image/svg+xml' });
    expect(res.status).toBe(400);
  });

  it('rejects files whose content does not match an allowed type', async () => {
    const res = await s.post('/api/admin/media').attach('files', Buffer.from('MZ this is an exe pretending'), { filename: 'evil.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
  });

  it('rejects files over the size limit', async () => {
    const big = Buffer.concat([PNG_1PX, Buffer.alloc(1.2 * 1024 * 1024)]);
    const res = await s.post('/api/admin/media').attach('files', big, { filename: 'big.png', contentType: 'image/png' });
    expect(res.status).toBe(413);
  });

  it('rejects unauthenticated uploads', async () => {
    const res = await request(app).post('/api/admin/media').attach('files', PNG_1PX, { filename: 'dot.png', contentType: 'image/png' });
    expect(res.status).toBe(401);
  });

  it('updates alt text and searches the library', async () => {
    await s.patch(`/api/admin/media/${media._id}`).send({ alt: 'A tiny dot' });
    const res = await s.get('/api/admin/media?q=tiny');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].alt).toBe('A tiny dot');
  });

  it('refuses to delete an image that is in use, unless forced', async () => {
    await s.post('/api/admin/projects').send({ title: 'Uses image', featuredImage: { url: media.url, alt: 'x' } });
    const blocked = await s.del(`/api/admin/media/${media._id}`);
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.details[0].label).toContain('Uses image');
    const forced = await s.del(`/api/admin/media/${media._id}?force=true`);
    expect(forced.status).toBe(200);
    expect((await request(app).get(media.url)).status).toBe(404);
  });
});

describe('contact form', () => {
  const valid = { name: 'Ada Lovelace', email: 'ada@example.com', subject: 'Hello', message: 'I would like to discuss a project.' };

  it('saves a valid message', async () => {
    const res = await request(app).post('/api/public/contact').send(valid);
    expect(res.status).toBe(201);
    const saved = await ContactMessage.findOne({ email: 'ada@example.com' });
    expect(saved.status).toBe('new');
  });

  it('rejects invalid submissions with field details', async () => {
    const res = await request(app).post('/api/public/contact').send({ name: 'A', email: 'not-an-email', message: 'short' });
    expect(res.status).toBe(400);
    const paths = res.body.error.details.map((d) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['name', 'email', 'message']));
  });

  it('silently drops honeypot submissions', async () => {
    const before = await ContactMessage.countDocuments();
    // Limit is 3 per window in tests; this is request #3.
    const res = await request(app).post('/api/public/contact').send({ ...valid, website: 'http://spam.example' });
    expect(res.status).toBe(201);
    expect(await ContactMessage.countDocuments()).toBe(before);
  });

  it('enforces the rate limit', async () => {
    const res = await request(app).post('/api/public/contact').send(valid);
    expect(res.status).toBe(429);
  });

  it('admin can list and update messages', async () => {
    const list = await s.get('/api/admin/messages');
    expect(list.body.items.length).toBe(1);
    const res = await s.patch(`/api/admin/messages/${list.body.items[0]._id}`).send({ status: 'read' });
    expect(res.body.status).toBe('read');
  });
});
