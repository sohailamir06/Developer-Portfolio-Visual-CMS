import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, createAdmin, loginAgent, seedSite } from './helpers.js';

let s;

beforeAll(async () => {
  await seedSite();
  await createAdmin();
  s = await loginAgent();
});

describe('projects', () => {
  let project;

  it('creates a draft project that is not public', async () => {
    const res = await s.post('/api/admin/projects').send({
      title: 'Weather Dashboard',
      summary: 'Forecasts',
      technologies: ['React'],
      repoUrl: 'https://github.com/example/weather',
    });
    expect(res.status).toBe(201);
    project = res.body;
    expect(project.slug).toBe('weather-dashboard');
    expect((await request(app).get('/api/public/projects')).body).toHaveLength(0);
    expect((await request(app).get('/api/public/projects/weather-dashboard')).status).toBe(404);
  });

  it('updates project information and publishes it', async () => {
    const res = await s.put(`/api/admin/projects/${project._id}`).send({ ...project, summary: 'Live forecasts', status: 'published', featured: true });
    expect(res.status).toBe(200);
    const list = (await request(app).get('/api/public/projects')).body;
    expect(list).toHaveLength(1);
    expect(list[0].summary).toBe('Live forecasts');
    expect(list[0].status).toBeUndefined();
    const featured = (await request(app).get('/api/public/projects?featured=true')).body;
    expect(featured).toHaveLength(1);
  });

  it('generates a unique slug for duplicate titles', async () => {
    const res = await s.post('/api/admin/projects').send({ title: 'Weather Dashboard' });
    expect(res.body.slug).toBe('weather-dashboard-2');
  });

  it('redirects the old URL when a published project slug changes', async () => {
    await s.put(`/api/admin/projects/${project._id}`).send({ ...project, slug: 'weather-app', status: 'published' });
    const r = await request(app).get('/api/public/redirects/resolve').query({ path: '/projects/weather-dashboard' });
    expect(r.body.to).toBe('/projects/weather-app');
  });

  it('rejects unsafe demo URLs', async () => {
    const res = await s.post('/api/admin/projects').send({ title: 'Bad', demoUrl: 'javascript:alert(1)' });
    expect(res.status).toBe(400);
  });

  it('deletes a project', async () => {
    const created = (await s.post('/api/admin/projects').send({ title: 'Temp' })).body;
    expect((await s.del(`/api/admin/projects/${created._id}`)).status).toBe(200);
    expect((await s.get(`/api/admin/projects/${created._id}`)).status).toBe(404);
  });
});

describe('skills & experience', () => {
  it('creates, reorders and hides skills', async () => {
    const a = (await s.post('/api/admin/skills').send({ name: 'React', category: 'Frontend', icon: 'Atom' })).body;
    const b = (await s.post('/api/admin/skills').send({ name: 'Node.js', category: 'Backend', proficiency: 80 })).body;
    expect(b.proficiency).toBe(80);
    await s.put('/api/admin/skills/reorder').send({ ids: [b._id, a._id] });
    let pub = (await request(app).get('/api/public/skills')).body;
    expect(pub.map((x) => x.name)).toEqual(['Node.js', 'React']);
    await s.put(`/api/admin/skills/${a._id}`).send({ ...a, visible: false });
    pub = (await request(app).get('/api/public/skills')).body;
    expect(pub.map((x) => x.name)).toEqual(['Node.js']);
  });

  it('validates experience dates', async () => {
    const bad = await s.post('/api/admin/experience').send({ company: 'Acme', position: 'Dev', startDate: '2024-05-01', endDate: '2023-01-01' });
    expect(bad.status).toBe(400);
    const ok = await s.post('/api/admin/experience').send({ company: 'Acme', position: 'Dev', startDate: '2024-05-01', current: true, responsibilities: ['Ship'] });
    expect(ok.status).toBe(201);
    expect((await request(app).get('/api/public/experience')).body[0].company).toBe('Acme');
  });
});

describe('navigation & settings', () => {
  it('updates navigation and rejects unsafe links', async () => {
    const ok = await s.put('/api/admin/navigation').send({
      main: [
        { id: 'a', label: 'Work', url: '/projects' },
        { id: 'b', label: 'Blog', url: 'https://blog.example.com', newTab: true, parentId: 'a' },
      ],
    });
    expect(ok.status).toBe(200);
    const nav = (await request(app).get('/api/public/navigation')).body;
    expect(nav.main.map((i) => i.label)).toEqual(['Work', 'Blog']);
    const bad = await s.put('/api/admin/navigation').send({ main: [{ id: 'x', label: 'X', url: 'javascript:void(0)' }] });
    expect(bad.status).toBe(400);
  });

  it('updates settings (logo, footer, theme) and keeps history', async () => {
    const current = (await s.get('/api/admin/settings')).body;
    const res = await s.put('/api/admin/settings').send({
      ...current,
      logo: { type: 'text', text: 'JS' },
      footer: { ...current.footer, intro: 'New footer intro' },
      theme: { ...current.theme, primary: '#ff0055' },
    });
    expect(res.status).toBe(200);
    const pub = (await request(app).get('/api/public/settings')).body;
    expect(pub.logo.text).toBe('JS');
    expect(pub.footer.intro).toBe('New footer intro');
    expect(pub.theme.primary).toBe('#ff0055');
    const revs = await s.get('/api/admin/revisions?contentType=settings');
    expect(revs.body.length).toBeGreaterThan(0);
  });

  it('rejects arbitrary theme values', async () => {
    const current = (await s.get('/api/admin/settings')).body;
    const res = await s.put('/api/admin/settings').send({ ...current, theme: { ...current.theme, primary: 'red; background:url(x)' } });
    expect(res.status).toBe(400);
  });
});

describe('seo', () => {
  it('serves robots.txt that blocks admin and a sitemap without drafts', async () => {
    const robots = await request(app).get('/robots.txt');
    expect(robots.text).toContain('Disallow: /admin');
    const map = await request(app).get('/sitemap.xml');
    expect(map.text).toContain('<urlset');
    expect(map.text).not.toContain('weather-dashboard-2'); // draft project
  });
});
