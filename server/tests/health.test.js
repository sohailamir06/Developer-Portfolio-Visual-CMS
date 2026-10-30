import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, createAdmin, loginAgent, PNG_1PX, seedSite } from './helpers.js';
import Page from '../models/Page.js';

let s;
const check = (body, id) => body.health.checks.find((c) => c.id === id);

beforeAll(async () => {
  await seedSite();
  await createAdmin();
  s = await loginAgent();
});

describe('dashboard site-health checklist', () => {
  it('is admin-only', async () => {
    expect((await request(app).get('/api/admin/dashboard')).status).toBe(401);
  });

  it('flags gaps on a fresh install', async () => {
    const { body } = await s.get('/api/admin/dashboard');
    expect(body.health.total).toBe(body.health.checks.length);
    expect(body.health.score).toBeLessThan(100);
    expect(check(body, 'placeholder-name').ok).toBe(false);
    expect(check(body, 'contact-email').ok).toBe(false);
    expect(check(body, 'image-alt').ok).toBe(true); // no images yet
    for (const c of body.health.checks) expect(c.link).toMatch(/^\/admin/);
  });

  it('updates as the owner fixes things', async () => {
    // Publish a real name in the hero.
    const home = await Page.findOne({ pageType: 'home' }).lean();
    const sections = home.draft.sections.map((sec) => (sec.type === 'hero' ? { ...sec, data: { ...sec.data, name: 'Grace Hopper' } } : sec));
    await s.put(`/api/admin/pages/${home._id}/draft`).send({ title: home.draft.title, seo: home.draft.seo, sections });
    let body = (await s.get('/api/admin/dashboard')).body;
    expect(check(body, 'unpublished').ok).toBe(false); // saved but not live yet
    await s.post(`/api/admin/pages/${home._id}/publish`).send({});

    // Set a contact email.
    const settings = (await s.get('/api/admin/settings')).body;
    await s.put('/api/admin/settings').send({ ...settings, contact: { ...settings.contact, email: 'grace@example.com' } });

    // Upload an image without alt text.
    await s.post('/api/admin/media').attach('files', PNG_1PX, { filename: 'x.png', contentType: 'image/png' });

    body = (await s.get('/api/admin/dashboard')).body;
    expect(check(body, 'placeholder-name').ok).toBe(true);
    expect(check(body, 'unpublished').ok).toBe(true);
    expect(check(body, 'contact-email').ok).toBe(true);
    expect(check(body, 'image-alt').ok).toBe(false);
    expect(check(body, 'image-alt').detail).toMatch(/^1 image/);
  });
});
