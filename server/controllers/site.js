import mongoose from 'mongoose';
import Navigation from '../models/Navigation.js';
import WebsiteSettings from '../models/WebsiteSettings.js';
import Page from '../models/Page.js';
import Project from '../models/Project.js';
import Skill from '../models/Skill.js';
import Experience from '../models/Experience.js';
import Media from '../models/Media.js';
import ContactMessage from '../models/ContactMessage.js';
import Revision from '../models/Revision.js';
import Redirect from '../models/Redirect.js';
import User from '../models/User.js';
import { badRequest, notFound } from '../utils/errors.js';
import { listRevisions, recordRevision } from '../services/revisions.js';
import { navigationSchema, projectSchema } from '../validators/content.js';
import { settingsSchema } from '../validators/settings.js';
import { sectionsSchema } from '../sections/index.js';

// ---------- Navigation ----------
export async function getNavigation(_req, res) {
  const menus = await Navigation.find().lean();
  const out = { main: [], footer: [] };
  for (const m of menus) out[m.name] = [...m.items].sort((a, b) => a.order - b.order);
  res.json(out);
}

export async function updateNavigation(req, res) {
  for (const name of ['main', 'footer']) {
    if (!req.body[name]) continue;
    const items = req.body[name].map((item, order) => ({ ...item, order }));
    const nav = await Navigation.findOneAndUpdate(
      { name },
      { $set: { items, updatedBy: req.user._id } },
      { upsert: true, new: true, runValidators: true },
    );
    await recordRevision({ contentType: 'navigation', contentId: nav._id, snapshot: { name, items }, author: req.user._id, action: 'update' });
  }
  return getNavigation(req, res);
}

// ---------- Settings ----------
async function loadSettings() {
  const s = await WebsiteSettings.findOne({ key: 'site' });
  if (!s) throw notFound('Settings have not been initialised');
  return s;
}

const settingsSnapshot = (s) => {
  const { _id, __v, key, createdAt, updatedAt, updatedBy, version, ...rest } = s.toObject();
  return rest;
};

export async function getSettings(_req, res) {
  res.json(await loadSettings());
}

export async function updateSettings(req, res) {
  const s = await loadSettings();
  s.set({ ...req.body, updatedBy: req.user._id, version: s.version + 1 });
  await s.save();
  await recordRevision({ contentType: 'settings', contentId: s._id, snapshot: settingsSnapshot(s), author: req.user._id, action: 'update' });
  res.json(s);
}

// ---------- Generic revision history ----------
export async function listRevisionsFor(req, res) {
  const { contentType, contentId } = req.query;
  if (!['page', 'project', 'settings', 'navigation'].includes(contentType)) throw badRequest('Unknown content type');
  let id = contentId;
  if (contentType === 'settings') id = (await loadSettings())._id;
  if (contentType === 'navigation') {
    const nav = await Navigation.findOne({ name: contentId === 'footer' ? 'footer' : 'main' }).select('_id').lean();
    id = nav?._id;
  }
  if (!id || !mongoose.isValidObjectId(id)) throw badRequest('Invalid content id');
  res.json(await listRevisions(contentType, id));
}

export async function getRevision(req, res) {
  const rev = await Revision.findById(req.params.id).populate('author', 'name').lean();
  if (!rev) throw notFound('Revision not found');
  res.json(rev);
}

/** Restores a snapshot. Pages are restored into the draft; other content types apply immediately. */
export async function restoreRevision(req, res) {
  const rev = await Revision.findById(req.params.id).lean();
  if (!rev) throw notFound('Revision not found');
  const author = req.user._id;

  if (rev.contentType === 'page') {
    const page = await Page.findById(rev.contentId);
    if (!page) throw notFound('The page for this revision no longer exists');
    page.draft = { title: rev.snapshot.title, seo: rev.snapshot.seo, sections: sectionsSchema.parse(rev.snapshot.sections) };
    page.hasUnpublishedChanges = true;
    page.draftSavedAt = new Date();
    await page.save();
    return res.json({ ok: true, contentType: 'page', id: page._id, message: 'Revision loaded into the draft. Publish to make it live.' });
  }
  if (rev.contentType === 'project') {
    const project = await Project.findById(rev.contentId);
    if (!project) throw notFound('The project for this revision no longer exists');
    const data = projectSchema.parse({ ...rev.snapshot, slug: project.slug });
    project.set(data);
    await project.save();
    await recordRevision({ contentType: 'project', contentId: project._id, snapshot: data, author, action: 'restore', note: `Restored v${rev.version}` });
    return res.json({ ok: true, contentType: 'project', id: project._id });
  }
  if (rev.contentType === 'settings') {
    const s = await loadSettings();
    s.set({ ...settingsSchema.parse(rev.snapshot), updatedBy: author, version: s.version + 1 });
    await s.save();
    await recordRevision({ contentType: 'settings', contentId: s._id, snapshot: settingsSnapshot(s), author, action: 'restore', note: `Restored v${rev.version}` });
    return res.json({ ok: true, contentType: 'settings' });
  }
  if (rev.contentType === 'navigation') {
    const parsed = navigationSchema.parse({ [rev.snapshot.name]: rev.snapshot.items });
    const nav = await Navigation.findByIdAndUpdate(rev.contentId, { $set: { items: parsed[rev.snapshot.name], updatedBy: author } }, { new: true });
    if (!nav) throw notFound('Menu no longer exists');
    await recordRevision({ contentType: 'navigation', contentId: nav._id, snapshot: { name: nav.name, items: nav.items }, author, action: 'restore', note: `Restored v${rev.version}` });
    return res.json({ ok: true, contentType: 'navigation' });
  }
  throw badRequest('Unsupported revision type');
}

// ---------- Contact messages ----------
export async function listMessages(req, res) {
  const filter = {};
  if (typeof req.query.status === 'string' && req.query.status !== 'all') filter.status = req.query.status;
  else filter.status = mongoose.trusted({ $ne: 'spam' });
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = 25;
  const [items, total, counts] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ContactMessage.countDocuments(filter),
    ContactMessage.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)), counts: Object.fromEntries(counts.map((c) => [c._id, c.count])) });
}

export async function updateMessage(req, res) {
  const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status } }, { new: true });
  if (!msg) throw notFound('Message not found');
  res.json(msg);
}

export async function deleteMessage(req, res) {
  const msg = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!msg) throw notFound('Message not found');
  res.json({ ok: true });
}

// ---------- Users ----------
async function activeAdminCount(excludeId) {
  return User.countDocuments({ role: 'admin', status: 'active', _id: mongoose.trusted({ $ne: excludeId }) });
}

export async function listUsers(_req, res) {
  res.json(await User.find().sort({ createdAt: 1 }));
}

export async function createUser(req, res) {
  const { password, ...data } = req.body;
  const user = new User(data);
  await user.setPassword(password);
  await user.save();
  res.status(201).json(user);
}

export async function updateUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('User not found');
  const { password, ...data } = req.body;
  const losingAdmin = user.role === 'admin' && user.status === 'active' && (data.role === 'editor' || data.status === 'disabled');
  if (losingAdmin && (await activeAdminCount(user._id)) === 0) throw badRequest('At least one active administrator is required');
  user.set(data);
  if (password) await user.setPassword(password);
  await user.save();
  res.json(user);
}

export async function deleteUser(req, res) {
  if (String(req.params.id) === String(req.user._id)) throw badRequest('You cannot delete your own account');
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('User not found');
  if (user.role === 'admin' && (await activeAdminCount(user._id)) === 0) throw badRequest('At least one active administrator is required');
  await user.deleteOne();
  res.json({ ok: true });
}

// ---------- SEO & redirects ----------
export async function seoOverview(_req, res) {
  const [pages, projects, redirects, settings] = await Promise.all([
    Page.find().select('slug pageType status hasUnpublishedChanges draft.title draft.seo published.seo').sort({ createdAt: 1 }).lean(),
    Project.find().select('title slug status seo summary featuredImage').sort({ order: 1 }).lean(),
    Redirect.find().sort({ createdAt: -1 }).lean(),
    loadSettings(),
  ]);
  res.json({ pages, projects, redirects, defaults: settings.seo });
}

export async function updatePageSeo(req, res) {
  const page = await Page.findById(req.params.id);
  if (!page) throw notFound('Page not found');
  page.draft.seo = req.body.seo;
  page.hasUnpublishedChanges = true;
  page.draftSavedAt = new Date();
  await page.save();
  res.json(page);
}

export async function createRedirect(req, res) {
  res.status(201).json(await Redirect.create(req.body));
}

export async function deleteRedirect(req, res) {
  const r = await Redirect.findByIdAndDelete(req.params.id);
  if (!r) throw notFound('Redirect not found');
  res.json({ ok: true });
}

// ---------- Dashboard ----------
export async function dashboard(_req, res) {
  const [pages, unpublished, projects, publishedProjects, skills, experience, media, newMessages, recentMessages, recentPages] = await Promise.all([
    Page.countDocuments(),
    Page.countDocuments({ hasUnpublishedChanges: true }),
    Project.countDocuments(),
    Project.countDocuments({ status: 'published' }),
    Skill.countDocuments(),
    Experience.countDocuments(),
    Media.countDocuments(),
    ContactMessage.countDocuments({ status: 'new' }),
    ContactMessage.find({ status: mongoose.trusted({ $ne: 'spam' }) }).sort({ createdAt: -1 }).limit(5).select('name subject status createdAt').lean(),
    Page.find().sort({ updatedAt: -1 }).limit(5).select('slug status hasUnpublishedChanges updatedAt draft.title').lean(),
  ]);
  res.json({
    counts: { pages, unpublished, projects, publishedProjects, skills, experience, media, newMessages },
    recentMessages,
    recentPages: recentPages.map((p) => ({ ...p, title: p.draft?.title, draft: undefined })),
  });
}
