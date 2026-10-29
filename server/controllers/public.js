import crypto from 'node:crypto';
import Page from '../models/Page.js';
import Project from '../models/Project.js';
import Skill from '../models/Skill.js';
import Experience from '../models/Experience.js';
import Navigation from '../models/Navigation.js';
import WebsiteSettings from '../models/WebsiteSettings.js';
import ContactMessage from '../models/ContactMessage.js';
import { notFound } from '../utils/errors.js';
import { notifyNewMessage } from '../services/email.js';
import { resolveRedirect } from '../services/redirects.js';
import { env } from '../config/env.js';

const PUBLIC_PROJECT_FIELDS = '-__v -status -createdAt';

// ETag + revalidation: browsers reuse responses until content changes, but never serve stale content after a publish.
const revalidate = (res) => res.set('Cache-Control', 'public, max-age=0, must-revalidate');

/** Shapes published page content for visitors. Hidden sections are removed server-side. */
export function toPublicPage(page, content = page.published) {
  return {
    id: page._id,
    slug: page.slug,
    pageType: page.pageType,
    title: content.title,
    seo: content.seo,
    sections: (content.sections || []).filter((s) => s.visible !== false),
    updatedAt: page.publishedAt,
  };
}

export async function getPage(req, res) {
  const page = await Page.findOne({ slug: req.params.slug, status: 'published' }).lean();
  if (!page?.published) throw notFound('Page not found');
  revalidate(res).json(toPublicPage(page));
}

export async function listPages(_req, res) {
  const pages = await Page.find({ status: 'published' }).select('slug pageType published.title').lean();
  revalidate(res).json(pages.map((p) => ({ slug: p.slug, pageType: p.pageType, title: p.published?.title })));
}

export async function listProjects(req, res) {
  const filter = { status: 'published' };
  if (req.query.featured === 'true') filter.featured = true;
  if (typeof req.query.category === 'string' && req.query.category) filter.category = req.query.category;
  const limit = Math.min(Number.parseInt(req.query.limit, 10) || 100, 100);
  const projects = await Project.find(filter)
    .select(`${PUBLIC_PROJECT_FIELDS} -content -gallery`)
    .sort({ order: 1, createdAt: -1 })
    .limit(limit)
    .lean();
  revalidate(res).json(projects);
}

export async function getProject(req, res) {
  const project = await Project.findOne({ slug: req.params.slug, status: 'published' }).select(PUBLIC_PROJECT_FIELDS).lean();
  if (!project) throw notFound('Project not found');
  const siblings = await Project.find({ status: 'published' }).select('slug title order').sort({ order: 1, createdAt: -1 }).lean();
  const idx = siblings.findIndex((p) => p.slug === project.slug);
  revalidate(res).json({
    ...project,
    prev: idx > 0 ? siblings[idx - 1] : null,
    next: idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null,
  });
}

export async function listSkills(_req, res) {
  const skills = await Skill.find({ visible: true }).select('-__v -visible').sort({ order: 1, name: 1 }).lean();
  revalidate(res).json(skills);
}

export async function listExperience(_req, res) {
  const items = await Experience.find({ visible: true }).select('-__v -visible').sort({ order: 1, startDate: -1 }).lean();
  revalidate(res).json(items);
}

export async function getNavigation(_req, res) {
  const [menus, pages] = await Promise.all([Navigation.find().lean(), Page.find().select('slug status').lean()]);
  // Hide links that point at pages which exist but are not published.
  const hiddenPaths = new Set(pages.filter((p) => p.status !== 'published').map((p) => (p.slug === 'home' ? '/' : `/${p.slug}`)));
  const out = { main: [], footer: [] };
  for (const menu of menus) {
    const visible = menu.items.filter((i) => i.visible && !hiddenPaths.has(i.url));
    const visibleIds = new Set(visible.map((i) => i.id));
    out[menu.name] = visible
      .filter((i) => !i.parentId || visibleIds.has(i.parentId))
      .sort((a, b) => a.order - b.order)
      .map(({ id, label, url, newTab, parentId }) => ({ id, label, url, newTab, parentId }));
  }
  revalidate(res).json(out);
}

export async function getSettings(_req, res) {
  const s = await WebsiteSettings.findOne({ key: 'site' }).select('-_id -__v -key -updatedBy -version -createdAt').lean();
  if (!s) throw notFound('Site settings have not been initialised');
  revalidate(res).json(s);
}

export async function resolveRedirectPath(req, res) {
  const path = typeof req.query.path === 'string' ? req.query.path : '';
  if (!path.startsWith('/')) throw notFound('No redirect');
  const hit = await resolveRedirect(path);
  if (!hit) throw notFound('No redirect');
  res.json(hit);
}

export async function submitContact(req, res) {
  const { website, ...data } = req.body;
  // Honeypot filled in: pretend success so bots learn nothing, but store nothing.
  if (website) return res.status(201).json({ ok: true });

  const ipHash = crypto.createHmac('sha256', env.SESSION_SECRET).update(String(req.ip)).digest('hex');
  const msg = await ContactMessage.create({ ...data, ipHash, userAgent: String(req.get('user-agent') || '').slice(0, 300) });

  notifyNewMessage(msg)
    .then((sent) => sent && ContactMessage.updateOne({ _id: msg._id }, { notified: true }))
    .catch((err) => console.error('Contact notification failed:', err.message));

  res.status(201).json({ ok: true });
}
