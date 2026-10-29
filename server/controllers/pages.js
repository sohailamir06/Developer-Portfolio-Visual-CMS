import Page from '../models/Page.js';
import Revision from '../models/Revision.js';
import { badRequest, notFound } from '../utils/errors.js';
import { listRevisions, recordRevision } from '../services/revisions.js';
import { pagePath, recordPathChange } from '../services/redirects.js';
import { defaultPages } from '../services/defaults.js';
import { createSection, sectionDefaults, sectionsSchema } from '../sections/index.js';
import { toPublicPage } from './public.js';

const LIST_FIELDS = 'slug pageType status hasUnpublishedChanges version publishedAt draftSavedAt updatedAt draft.title';

async function findPage(id) {
  const page = await Page.findById(id).populate('updatedBy publishedBy', 'name');
  if (!page) throw notFound('Page not found');
  return page;
}

const snapshotOf = (page, content) => ({
  slug: page.slug,
  pageType: page.pageType,
  title: content.title,
  seo: content.seo,
  sections: content.sections,
});

export async function list(_req, res) {
  const pages = await Page.find().select(LIST_FIELDS).sort({ createdAt: 1 }).lean();
  res.json(pages.map((p) => ({ ...p, title: p.draft?.title, draft: undefined })));
}

export async function create(req, res) {
  const { title, slug, pageType, template } = req.body;
  if (pageType === 'home' && (await Page.exists({ pageType: 'home' }))) throw badRequest('A home page already exists');

  let sections = [];
  if (template === 'standard') {
    const preset = defaultPages().find((p) => p.pageType === pageType && pageType !== 'custom');
    sections = preset
      ? preset.sections
      : [createSection('textImage', { heading: title, body: '<p>Start writing here.</p>' })];
  }
  const content = { title, seo: {}, sections };
  const page = await Page.create({ slug, pageType, draft: content, updatedBy: req.user._id, draftSavedAt: new Date() });
  res.status(201).json(page);
}

export async function get(req, res) {
  res.json(await findPage(req.params.id));
}

export async function updateMeta(req, res) {
  const page = await findPage(req.params.id);
  const { slug, pageType } = req.body;
  if (slug && slug !== page.slug) {
    if (page.pageType === 'home') throw badRequest('The home page is always served at "/" and its slug cannot change');
    if (page.status === 'published') await recordPathChange(pagePath(page.slug), pagePath(slug));
    page.slug = slug;
  }
  if (pageType && pageType !== page.pageType) {
    if (pageType === 'home' || page.pageType === 'home') throw badRequest('The home page type cannot be reassigned');
    page.pageType = pageType;
  }
  page.updatedBy = req.user._id;
  await page.save();
  res.json(page);
}

/** Saves the working copy only. The published content is never touched here. */
export async function saveDraft(req, res) {
  const page = await findPage(req.params.id);
  page.draft = req.body;
  page.hasUnpublishedChanges = true;
  page.draftSavedAt = new Date();
  page.updatedBy = req.user._id;
  await page.save();
  res.json(page);
}

export async function publish(req, res) {
  const page = await findPage(req.params.id);
  // Re-validate in case section schemas changed since the draft was saved.
  const sections = sectionsSchema.parse(JSON.parse(JSON.stringify(page.draft.sections)));
  const content = { title: page.draft.title, seo: page.draft.seo, sections };

  page.draft.sections = sections;
  page.published = content;
  page.status = 'published';
  page.hasUnpublishedChanges = false;
  page.version += 1;
  page.publishedAt = new Date();
  page.publishedBy = req.user._id;
  await page.save();

  await recordRevision({
    contentType: 'page',
    contentId: page._id,
    snapshot: snapshotOf(page, content),
    author: req.user._id,
    note: req.body?.note,
  });
  res.json(page);
}

export async function unpublish(req, res) {
  const page = await findPage(req.params.id);
  if (page.pageType === 'home') throw badRequest('The home page cannot be unpublished');
  page.status = 'draft';
  page.hasUnpublishedChanges = true;
  await page.save();
  res.json(page);
}

export async function discard(req, res) {
  const page = await findPage(req.params.id);
  if (!page.published) throw badRequest('This page has never been published, so there is nothing to revert to');
  page.draft = JSON.parse(JSON.stringify(page.published));
  page.hasUnpublishedChanges = page.status !== 'published';
  page.draftSavedAt = new Date();
  await page.save();
  res.json(page);
}

export async function remove(req, res) {
  const page = await findPage(req.params.id);
  if (page.pageType === 'home') throw badRequest('The home page cannot be deleted');
  await page.deleteOne();
  await Revision.deleteMany({ contentType: 'page', contentId: page._id });
  res.json({ ok: true });
}

export async function revisions(req, res) {
  await findPage(req.params.id);
  res.json(await listRevisions('page', req.params.id));
}

/** Loads a past published version into the draft. The admin reviews it, then publishes. */
export async function restoreRevision(req, res) {
  const page = await findPage(req.params.id);
  const rev = await Revision.findOne({ _id: req.params.revisionId, contentType: 'page', contentId: page._id }).lean();
  if (!rev) throw notFound('Revision not found');
  page.draft = {
    title: rev.snapshot.title,
    seo: rev.snapshot.seo,
    sections: sectionsSchema.parse(rev.snapshot.sections),
  };
  page.hasUnpublishedChanges = true;
  page.draftSavedAt = new Date();
  page.updatedBy = req.user._id;
  await page.save();
  res.json(page);
}

/** Draft rendered in the same shape the public API uses — admin-only. */
export async function preview(req, res) {
  const page = await findPage(req.params.id);
  res.set('Cache-Control', 'no-store').json({ ...toPublicPage(page, page.draft), isPreview: true });
}

export function sectionTypes(_req, res) {
  res.json(sectionDefaults());
}
