import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Revision from '../models/Revision.js';
import { notFound } from '../utils/errors.js';
import { toSlug } from '../utils/validation.js';
import { listRevisions, recordRevision } from '../services/revisions.js';
import { projectPath, recordPathChange } from '../services/redirects.js';

async function uniqueSlug(base, excludeId) {
  const root = toSlug(base) || 'project';
  let candidate = root;
  // Operator objects built server-side must be marked trusted because sanitizeFilter is enabled globally.
  const notSelf = excludeId ? { _id: mongoose.trusted({ $ne: excludeId }) } : {};
  for (let i = 2; await Project.exists({ slug: candidate, ...notSelf }); i += 1) candidate = `${root}-${i}`;
  return candidate;
}

async function findProject(id) {
  const project = await Project.findById(id);
  if (!project) throw notFound('Project not found');
  return project;
}

const snapshot = (p) => {
  const { _id, __v, createdAt, updatedAt, ...rest } = p.toObject();
  return rest;
};

export async function list(req, res) {
  const filter = {};
  if (['draft', 'published'].includes(req.query.status)) filter.status = req.query.status;
  res.json(await Project.find(filter).select('-content').sort({ order: 1, createdAt: -1 }).lean());
}

export async function get(req, res) {
  res.json(await findProject(req.params.id));
}

export async function create(req, res) {
  const data = { ...req.body };
  data.slug = await uniqueSlug(data.slug || data.title);
  if (data.order === undefined) data.order = await Project.countDocuments();
  if (data.status === 'published') data.publishedAt = new Date();
  const project = await Project.create(data);
  await recordRevision({ contentType: 'project', contentId: project._id, snapshot: snapshot(project), author: req.user._id, action: 'update', note: 'Created' });
  res.status(201).json(project);
}

export async function update(req, res) {
  const project = await findProject(req.params.id);
  const data = { ...req.body };
  if (data.slug && data.slug !== project.slug) {
    data.slug = await uniqueSlug(data.slug, project._id);
    if (project.status === 'published') await recordPathChange(projectPath(project.slug), projectPath(data.slug));
  } else {
    delete data.slug;
  }
  if (data.status === 'published' && !project.publishedAt) data.publishedAt = new Date();
  if (data.order === undefined) delete data.order;
  project.set(data);
  await project.save();
  await recordRevision({ contentType: 'project', contentId: project._id, snapshot: snapshot(project), author: req.user._id, action: 'update' });
  res.json(project);
}

export async function remove(req, res) {
  const project = await findProject(req.params.id);
  await project.deleteOne();
  await Revision.deleteMany({ contentType: 'project', contentId: project._id });
  res.json({ ok: true });
}

export async function reorder(req, res) {
  await Project.bulkWrite(req.body.ids.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { $set: { order } } } })));
  res.json({ ok: true });
}

export async function revisions(req, res) {
  await findProject(req.params.id);
  res.json(await listRevisions('project', req.params.id));
}
