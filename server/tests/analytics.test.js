import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, createAdmin, loginAgent, seedSite } from './helpers.js';
import DailyStat from '../models/DailyStat.js';
import Page from '../models/Page.js';

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36';
const track = (body, ua = BROWSER_UA) => request(app).post('/api/public/track').set('User-Agent', ua).send(body);
let s;

beforeAll(async () => {
  await seedSite();
  await createAdmin();
  s = await loginAgent();
});

describe('privacy-friendly visitor statistics', () => {
  it('counts page views and CV downloads as daily totals', async () => {
    expect((await track({ kind: 'view', path: '/' })).status).toBe(204);
    await track({ kind: 'view', path: '/' });
    await track({ kind: 'view', path: '/projects' });
    await track({ kind: 'resume', path: '/resume' });
    const home = await DailyStat.findOne({ kind: 'view', path: '/' }).lean();
    expect(home.count).toBe(2);
    // Nothing personal is stored.
    expect(Object.keys(home).sort()).toEqual(['_id', 'count', 'day', 'kind', 'path']);
  });

  it('ignores bots, Do-Not-Track visitors and the signed-in owner', async () => {
    await track({ kind: 'view', path: '/about' }, 'Googlebot/2.1 (+http://www.google.com/bot.html)');
    await request(app).post('/api/public/track').set('User-Agent', BROWSER_UA).set('DNT', '1').send({ kind: 'view', path: '/about' });
    await s.agent.post('/api/public/track').set('User-Agent', BROWSER_UA).send({ kind: 'view', path: '/about' });
    expect(await DailyStat.countDocuments({ path: '/about' })).toBe(0);
  });

  it('rejects admin paths and invalid input', async () => {
    expect((await track({ kind: 'view', path: '/admin/pages' })).status).toBe(400);
    expect((await track({ kind: 'click', path: '/' })).status).toBe(400);
    expect((await track({ kind: 'view', path: 'https://evil.example' })).status).toBe(400);
  });

  it('summarises the last 30 days for admins only', async () => {
    expect((await request(app).get('/api/admin/analytics')).status).toBe(401);
    const { body } = await s.get('/api/admin/analytics?days=30');
    expect(body.series).toHaveLength(30);
    expect(body.totals).toEqual({ views: 3, resumeDownloads: 1 });
    expect(body.series.at(-1).views).toBe(3);
    expect(body.topPages[0]).toEqual({ path: '/', views: 2 });
  });
});

describe('student portfolio content', () => {
  it('accepts education and certification sections', async () => {
    const page = await Page.findOne({ slug: 'about' }).lean();
    const sections = [
      { type: 'education', data: { items: [{ institution: 'MIT', degree: 'B.Sc. CS', period: '2022 – 2026', grade: 'GPA 3.8', highlights: ['Dean’s list'] }] } },
      { type: 'certifications', data: { items: [{ kind: 'award', title: 'Hackathon winner', issuer: 'HackMIT', credentialUrl: 'https://example.com/c' }] } },
    ];
    const res = await s.put(`/api/admin/pages/${page._id}/draft`).send({ title: 'About', seo: {}, sections });
    expect(res.status).toBe(200);
    expect(res.body.draft.sections[0].data.items[0].grade).toBe('GPA 3.8');
    const bad = await s
      .put(`/api/admin/pages/${page._id}/draft`)
      .send({ title: 'About', seo: {}, sections: [{ type: 'certifications', data: { items: [{ title: 'x', credentialUrl: 'javascript:alert(1)' }] } }] });
    expect(bad.status).toBe(400);
  });

  it('stores project role, year and highlights and shows them publicly', async () => {
    await s.post('/api/admin/projects').send({ title: 'Campus App', status: 'published', role: 'Frontend lead', year: '2025', highlights: ['Used by 2,000 students'] });
    const pub = (await request(app).get('/api/public/projects')).body.find((p) => p.title === 'Campus App');
    expect(pub).toMatchObject({ role: 'Frontend lead', year: '2025', highlights: ['Used by 2,000 students'] });
  });
});
