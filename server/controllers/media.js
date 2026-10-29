import Media from '../models/Media.js';
import Page from '../models/Page.js';
import Project from '../models/Project.js';
import Skill from '../models/Skill.js';
import WebsiteSettings from '../models/WebsiteSettings.js';
import { badRequest, conflict, notFound } from '../utils/errors.js';
import { activeProvider, deleteStoredFile, storeUpload } from '../services/storage.js';
import { env } from '../config/env.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function list(req, res) {
  const { q, type, page, limit } = req.query;
  const filter = {};
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ originalName: rx }, { alt: rx }, { caption: rx }];
  }
  if (type === 'image') filter.mimeType = /^image\//;
  if (type === 'document') filter.mimeType = 'application/pdf';
  const [items, total] = await Promise.all([
    Media.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Media.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)), provider: activeProvider(), maxFileMb: env.MEDIA_MAX_FILE_MB });
}

export async function upload(req, res) {
  const files = req.files || [];
  if (!files.length) throw badRequest('Choose at least one file to upload');
  const created = [];
  for (const file of files) {
    const stored = await storeUpload(file);
    try {
      created.push(
        await Media.create({
          ...stored,
          originalName: file.originalname.slice(0, 255),
          alt: (req.body?.alt || '').slice(0, 300),
          uploadedBy: req.user._id,
        }),
      );
    } catch (err) {
      await deleteStoredFile({ ...stored }).catch(() => {});
      throw err;
    }
  }
  res.status(201).json(created);
}

export async function update(req, res) {
  const media = await Media.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!media) throw notFound('File not found');
  res.json(media);
}

/** Finds every place a media URL is referenced so files in use are not deleted by accident. */
export async function findUsage(url) {
  const contains = (obj) => JSON.stringify(obj ?? '').includes(JSON.stringify(url).slice(1, -1));
  const usage = [];
  const [pages, projects, skills, settings] = await Promise.all([
    Page.find().select('slug draft published').lean(),
    Project.find().select('title featuredImage gallery content seo').lean(),
    Skill.find({ icon: url }).select('name').lean(),
    WebsiteSettings.findOne({ key: 'site' }).lean(),
  ]);
  for (const p of pages) {
    if (contains(p.draft) || contains(p.published)) usage.push({ type: 'page', id: p._id, label: `Page: ${p.draft?.title || p.slug}` });
  }
  for (const p of projects) if (contains(p)) usage.push({ type: 'project', id: p._id, label: `Project: ${p.title}` });
  for (const s of skills) usage.push({ type: 'skill', id: s._id, label: `Skill: ${s.name}` });
  if (contains(settings)) usage.push({ type: 'settings', label: 'Website settings' });
  return usage;
}

export async function usage(req, res) {
  const media = await Media.findById(req.params.id).lean();
  if (!media) throw notFound('File not found');
  res.json(await findUsage(media.url));
}

export async function remove(req, res) {
  const media = await Media.findById(req.params.id);
  if (!media) throw notFound('File not found');
  if (req.query.force !== 'true') {
    const used = await findUsage(media.url);
    if (used.length) throw conflict('This file is still in use. Remove it from these places first, or force delete.', used);
  }
  await deleteStoredFile(media);
  await media.deleteOne();
  res.json({ ok: true });
}
