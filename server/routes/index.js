import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../config/env.js';
import { requireAuth, requireCsrf, requireRole } from '../middleware/auth.js';
import { contactLimiter, loginLimiter } from '../middleware/security.js';
import { badRequest } from '../utils/errors.js';
import { objectId, seoSchema, validate } from '../utils/validation.js';
import * as v from '../validators/content.js';
import { settingsSchema } from '../validators/settings.js';
import { ALLOWED_MIME } from '../services/storage.js';
import Skill from '../models/Skill.js';
import Experience from '../models/Experience.js';
import * as auth from '../controllers/auth.js';
import * as pub from '../controllers/public.js';
import * as pages from '../controllers/pages.js';
import * as projects from '../controllers/projects.js';
import * as media from '../controllers/media.js';
import * as site from '../controllers/site.js';
import { collectionController } from '../controllers/collection.js';

const idParam = validate(z.object({ id: objectId }).passthrough(), 'params');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MEDIA_MAX_FILE_MB * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
    cb(badRequest(`"${file.originalname}" is not a supported file type. Use JPEG, PNG, GIF, WebP, AVIF or PDF.`));
  },
});

// ---------------- Auth ----------------
const authRouter = Router();
authRouter.post('/login', loginLimiter, validate(v.loginSchema), auth.login);
authRouter.post('/logout', auth.logout);
authRouter.get('/me', requireAuth, auth.me);

// ---------------- Public (published content only) ----------------
const publicRouter = Router();
publicRouter.get('/settings', pub.getSettings);
publicRouter.get('/navigation', pub.getNavigation);
publicRouter.get('/pages', pub.listPages);
publicRouter.get('/pages/:slug', pub.getPage);
publicRouter.get('/projects', pub.listProjects);
publicRouter.get('/projects/:slug', pub.getProject);
publicRouter.get('/skills', pub.listSkills);
publicRouter.get('/experience', pub.listExperience);
publicRouter.get('/redirects/resolve', pub.resolveRedirectPath);
publicRouter.post('/contact', contactLimiter, validate(v.contactSchema), pub.submitContact);

// ---------------- Admin (authenticated + CSRF on every write) ----------------
const admin = Router();
admin.use(requireAuth, requireCsrf);

admin.get('/dashboard', site.dashboard);
admin.get('/section-types', pages.sectionTypes);

admin.get('/pages', pages.list);
admin.post('/pages', validate(v.pageCreateSchema), pages.create);
admin.get('/pages/:id', idParam, pages.get);
admin.put('/pages/:id', idParam, validate(v.pageMetaSchema), pages.updateMeta);
admin.delete('/pages/:id', idParam, pages.remove);
admin.put('/pages/:id/draft', idParam, validate(v.pageDraftSchema), pages.saveDraft);
admin.get('/pages/:id/preview', idParam, pages.preview);
admin.post('/pages/:id/publish', idParam, validate(v.publishSchema), pages.publish);
admin.post('/pages/:id/unpublish', idParam, pages.unpublish);
admin.post('/pages/:id/discard', idParam, pages.discard);
admin.get('/pages/:id/revisions', idParam, pages.revisions);
admin.post('/pages/:id/revisions/:revisionId/restore', validate(z.object({ id: objectId, revisionId: objectId }), 'params'), pages.restoreRevision);
admin.put('/pages/:id/seo', idParam, validate(z.object({ seo: seoSchema })), site.updatePageSeo);

admin.get('/projects', projects.list);
admin.post('/projects', validate(v.projectSchema), projects.create);
admin.put('/projects/reorder', validate(v.reorderSchema), projects.reorder);
admin.get('/projects/:id', idParam, projects.get);
admin.put('/projects/:id', idParam, validate(v.projectSchema), projects.update);
admin.delete('/projects/:id', idParam, projects.remove);
admin.get('/projects/:id/revisions', idParam, projects.revisions);

for (const [path, Model, schema, label, sort] of [
  ['skills', Skill, v.skillSchema, 'Skill', { category: 1, order: 1 }],
  ['experience', Experience, v.experienceSchema, 'Experience', { order: 1, startDate: -1 }],
]) {
  const c = collectionController(Model, { label, sort });
  admin.get(`/${path}`, c.list);
  admin.post(`/${path}`, validate(schema), c.create);
  admin.put(`/${path}/reorder`, validate(v.reorderSchema), c.reorder);
  admin.get(`/${path}/:id`, idParam, c.get);
  admin.put(`/${path}/:id`, idParam, validate(schema), c.update);
  admin.delete(`/${path}/:id`, idParam, c.remove);
}

admin.get('/media', validate(v.mediaQuerySchema, 'query'), media.list);
admin.post('/media', upload.array('files', 10), media.upload);
admin.patch('/media/:id', idParam, validate(v.mediaUpdateSchema), media.update);
admin.get('/media/:id/usage', idParam, media.usage);
admin.delete('/media/:id', idParam, media.remove);

admin.get('/navigation', site.getNavigation);
admin.put('/navigation', validate(v.navigationSchema), site.updateNavigation);

admin.get('/settings', site.getSettings);
admin.put('/settings', requireRole('admin'), validate(settingsSchema), site.updateSettings);

admin.get('/revisions', site.listRevisionsFor);
admin.get('/revisions/:id', idParam, site.getRevision);
admin.post('/revisions/:id/restore', idParam, site.restoreRevision);

admin.get('/seo', site.seoOverview);
admin.post('/redirects', validate(v.redirectSchema), site.createRedirect);
admin.delete('/redirects/:id', idParam, site.deleteRedirect);

admin.get('/messages', site.listMessages);
admin.patch('/messages/:id', idParam, validate(v.messageUpdateSchema), site.updateMessage);
admin.delete('/messages/:id', idParam, site.deleteMessage);

admin.get('/users', requireRole('admin'), site.listUsers);
admin.post('/users', requireRole('admin'), validate(v.userCreateSchema), site.createUser);
admin.put('/users/:id', requireRole('admin'), idParam, validate(v.userUpdateSchema), site.updateUser);
admin.delete('/users/:id', requireRole('admin'), idParam, site.deleteUser);

const api = Router();
api.get('/health', (_req, res) => res.json({ ok: true, mediaProvider: env.MEDIA_PROVIDER, emailEnabled: env.smtpEnabled }));
api.use('/auth', authRouter);
api.use('/public', publicRouter);
api.use('/admin', admin);

export default api;
