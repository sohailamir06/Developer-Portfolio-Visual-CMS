import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, createAdmin, loginAgent, seedSite } from './helpers.js';

let s;

beforeAll(async () => {
  await seedSite();
  await createAdmin();
  s = await loginAgent();
});

const draftBody = (page, sections, extra = {}) => ({ title: page.draft.title, seo: page.draft.seo, sections, ...extra });

describe('page management', () => {
  let page;

  it('creates a page (unpublished until published)', async () => {
    const res = await s.post('/api/admin/pages').send({ title: 'Services', slug: 'services', pageType: 'custom' });
    expect(res.status).toBe(201);
    page = res.body;
    expect(page.status).toBe('draft');
    expect(page.published).toBeNull();
    expect(page.draft.sections.length).toBeGreaterThan(0);
    expect((await request(app).get('/api/public/pages/services')).status).toBe(404);
  });

  it('rejects a duplicate slug', async () => {
    const res = await s.post('/api/admin/pages').send({ title: 'Again', slug: 'services' });
    expect(res.status).toBe(409);
  });

  it('publishes and exposes the page publicly', async () => {
    const res = await s.post(`/api/admin/pages/${page._id}/publish`).send({});
    expect(res.status).toBe(200);
    expect(res.body.version).toBe(1);
    const pub = await request(app).get('/api/public/pages/services');
    expect(pub.status).toBe(200);
    expect(pub.body.title).toBe('Services');
  });

  it('saving a draft does not change the published version', async () => {
    const sections = [{ type: 'hero', data: { name: 'Draft Name', title: 'Draft Title' } }];
    const res = await s.put(`/api/admin/pages/${page._id}/draft`).send(draftBody(page, sections, { title: 'Services (draft)' }));
    expect(res.status).toBe(200);
    expect(res.body.hasUnpublishedChanges).toBe(true);
    expect(res.body.draft.sections[0].data.name).toBe('Draft Name');
    // Defaults are filled in server-side.
    expect(res.body.draft.sections[0].data.primaryButton.label).toBe('View Projects');

    const pub = await request(app).get('/api/public/pages/services');
    expect(pub.body.title).toBe('Services');
    expect(JSON.stringify(pub.body)).not.toContain('Draft Name');
  });

  it('admin preview returns the draft; public API never does', async () => {
    const prev = await s.get(`/api/admin/pages/${page._id}/preview`);
    expect(prev.status).toBe(200);
    expect(prev.body.sections[0].data.name).toBe('Draft Name');
    expect((await request(app).get(`/api/admin/pages/${page._id}/preview`)).status).toBe(401);
  });

  it('publishing makes the draft live and records a revision', async () => {
    await s.post(`/api/admin/pages/${page._id}/publish`).send({ note: 'second' });
    const pub = await request(app).get('/api/public/pages/services');
    expect(pub.body.title).toBe('Services (draft)');
    expect(pub.body.sections[0].data.name).toBe('Draft Name');
    const revs = await s.get(`/api/admin/pages/${page._id}/revisions`);
    expect(revs.body.map((r) => r.version)).toEqual([2, 1]);
  });

  it('restores a previous revision into the draft without touching the live page', async () => {
    const revs = (await s.get(`/api/admin/pages/${page._id}/revisions`)).body;
    const v1 = revs.find((r) => r.version === 1);
    const res = await s.post(`/api/admin/pages/${page._id}/revisions/${v1._id}/restore`);
    expect(res.status).toBe(200);
    expect(res.body.draft.title).toBe('Services');
    expect((await request(app).get('/api/public/pages/services')).body.title).toBe('Services (draft)');
    await s.post(`/api/admin/pages/${page._id}/publish`).send({});
    expect((await request(app).get('/api/public/pages/services')).body.title).toBe('Services');
  });

  it('discard reverts the draft to the published content', async () => {
    const current = (await s.get(`/api/admin/pages/${page._id}`)).body;
    await s.put(`/api/admin/pages/${page._id}/draft`).send(draftBody(current, [], { title: 'Throwaway' }));
    const res = await s.post(`/api/admin/pages/${page._id}/discard`);
    expect(res.body.draft.title).toBe('Services');
    expect(res.body.hasUnpublishedChanges).toBe(false);
  });

  it('hidden sections are not returned publicly', async () => {
    const current = (await s.get(`/api/admin/pages/${page._id}`)).body;
    const sections = [
      { type: 'textImage', visible: true, data: { heading: 'Shown section' } },
      { type: 'textImage', visible: false, data: { heading: 'Secret hidden section' } },
    ];
    await s.put(`/api/admin/pages/${page._id}/draft`).send(draftBody(current, sections));
    await s.post(`/api/admin/pages/${page._id}/publish`).send({});
    const pub = await request(app).get('/api/public/pages/services');
    expect(pub.body.sections).toHaveLength(1);
    expect(JSON.stringify(pub.body)).not.toContain('Secret hidden section');
  });

  it('rejects unknown section types and unsafe URLs', async () => {
    const current = (await s.get(`/api/admin/pages/${page._id}`)).body;
    const bad1 = await s.put(`/api/admin/pages/${page._id}/draft`).send(draftBody(current, [{ type: 'rawHtml', data: {} }]));
    expect(bad1.status).toBe(400);
    const bad2 = await s
      .put(`/api/admin/pages/${page._id}/draft`)
      .send(draftBody(current, [{ type: 'cta', data: { primaryButton: { label: 'x', url: 'javascript:alert(1)' } } }]));
    expect(bad2.status).toBe(400);
    expect(JSON.stringify(bad2.body.error.details)).toContain('primaryButton');
  });

  it('sanitises rich text', async () => {
    const current = (await s.get(`/api/admin/pages/${page._id}`)).body;
    const res = await s
      .put(`/api/admin/pages/${page._id}/draft`)
      .send(draftBody(current, [{ type: 'textImage', data: { body: '<p onclick="x()">Hi<script>alert(1)</script><a href="javascript:x">l</a></p>' } }]));
    expect(res.status).toBe(200);
    const body = res.body.draft.sections[0].data.body;
    expect(body).not.toMatch(/script|onclick|javascript/);
    expect(body).toContain('<p>Hi');
  });

  it('changing the slug of a published page creates a redirect', async () => {
    const res = await s.put(`/api/admin/pages/${page._id}`).send({ slug: 'what-i-do' });
    expect(res.status).toBe(200);
    expect((await request(app).get('/api/public/pages/what-i-do')).status).toBe(200);
    const r = await request(app).get('/api/public/redirects/resolve').query({ path: '/services' });
    expect(r.body).toEqual({ to: '/what-i-do', statusCode: 301 });
  });

  it('unpublished pages disappear from the public API and navigation', async () => {
    const pages = (await s.get('/api/admin/pages')).body;
    const about = pages.find((p) => p.slug === 'about');
    await s.post(`/api/admin/pages/${about._id}/unpublish`);
    expect((await request(app).get('/api/public/pages/about')).status).toBe(404);
    const nav = await request(app).get('/api/public/navigation');
    expect(nav.body.main.map((i) => i.url)).not.toContain('/about');
  });

  it('protects the home page from deletion', async () => {
    const home = (await s.get('/api/admin/pages')).body.find((p) => p.pageType === 'home');
    expect((await s.del(`/api/admin/pages/${home._id}`)).status).toBe(400);
  });
});
