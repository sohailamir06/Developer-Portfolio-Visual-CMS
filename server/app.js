import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import api from './routes/index.js';
import { apiLimiter, mongoSanitize } from './middleware/security.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { UPLOAD_DIR } from './services/storage.js';
import { buildRobots, buildSitemap, metaForPath, renderHeadTags } from './services/seo.js';
import { resolveRedirect } from './services/redirects.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.resolve(__dirname, '../client/dist');

export function createApp() {
  const app = express();
  if (env.TRUST_PROXY) app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          frameSrc: ["'self'", 'https://res.cloudinary.com'],
          objectSrc: ["'self'"],
          frameAncestors: ["'self'"],
          connectSrc: ["'self'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || env.clientOrigins.includes(origin.replace(/\/$/, ''))),
      credentials: true,
    }),
  );
  if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(mongoSanitize);

  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true, index: false, dotfiles: 'deny' }));

  app.get('/robots.txt', async (_req, res) => res.type('text/plain').send(await buildRobots()));
  app.get('/sitemap.xml', async (_req, res) => res.type('application/xml').send(await buildSitemap()));

  app.use('/api', env.isTest ? (_q, _s, n) => n() : apiLimiter, api);
  app.use('/api', notFoundHandler);

  // Production: serve the built React app with per-route metadata injected for crawlers and link previews.
  if (env.isProd && fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
    const indexHtml = fs.readFileSync(path.join(CLIENT_DIST, 'index.html'), 'utf8');
    app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1y', immutable: true }));
    app.get('/{*splat}', async (req, res, next) => {
      try {
        const redirect = await resolveRedirect(req.path);
        if (redirect) return res.redirect(redirect.statusCode, redirect.to);
        const meta = await metaForPath(req.path);
        const html = meta ? indexHtml.replace(/<title>.*?<\/title>/s, renderHeadTags(meta)) : indexHtml;
        res.status(meta ? 200 : 404).set('Cache-Control', 'no-cache').type('html').send(html);
      } catch (err) {
        next(err);
      }
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
