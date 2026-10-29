import mongoose from 'mongoose';
import Page from '../models/Page.js';
import Project from '../models/Project.js';
import WebsiteSettings from '../models/WebsiteSettings.js';
import { siteUrl } from '../config/env.js';
import { pagePath, projectPath } from './redirects.js';

const xmlEscape = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);

export async function buildSitemap() {
  const [pages, projects] = await Promise.all([
    Page.find({ status: 'published', 'published.seo.noindex': mongoose.trusted({ $ne: true }) }).select('slug publishedAt').lean(),
    Project.find({ status: 'published', 'seo.noindex': mongoose.trusted({ $ne: true }) }).select('slug updatedAt').lean(),
  ]);
  const urls = [
    ...pages.map((p) => ({ loc: pagePath(p.slug), lastmod: p.publishedAt, priority: p.slug === 'home' ? '1.0' : '0.8' })),
    ...projects.map((p) => ({ loc: projectPath(p.slug), lastmod: p.updatedAt, priority: '0.6' })),
  ];
  const body = urls
    .map(
      (u) =>
        `  <url><loc>${xmlEscape(siteUrl + u.loc)}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}<priority>${u.priority}</priority></url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export async function buildRobots() {
  const s = await WebsiteSettings.findOne({ key: 'site' }).select('seo').lean();
  if (s?.seo?.allowIndexing === false) return 'User-agent: *\nDisallow: /\n';
  return ['User-agent: *', 'Disallow: /admin', 'Disallow: /preview', 'Disallow: /api/', '', `Sitemap: ${siteUrl}/sitemap.xml`, ''].join('\n');
}

/** Computes <head> metadata for a public path. Used to pre-render tags into index.html in production. */
export async function metaForPath(path) {
  const settings = await WebsiteSettings.findOne({ key: 'site' }).lean();
  const seoDefaults = settings?.seo || {};
  const template = seoDefaults.titleTemplate || '%s';
  const base = {
    title: settings?.siteTitle || 'Portfolio',
    description: seoDefaults.defaultDescription || settings?.tagline || '',
    image: seoDefaults.ogImage || '',
    canonical: siteUrl + path,
    noindex: seoDefaults.allowIndexing === false,
    favicon: settings?.favicon || '',
  };
  if (path.startsWith('/admin') || path.startsWith('/preview')) return { ...base, title: 'Admin', noindex: true };

  const projectMatch = path.match(/^\/projects\/([a-z0-9-]+)\/?$/);
  if (projectMatch) {
    const p = await Project.findOne({ slug: projectMatch[1], status: 'published' }).lean();
    if (!p) return null;
    return {
      ...base,
      title: template.replace('%s', p.seo?.title || p.title),
      description: p.seo?.description || p.summary || base.description,
      image: p.seo?.image || p.featuredImage?.url || base.image,
      canonical: p.seo?.canonical || base.canonical,
      noindex: base.noindex || p.seo?.noindex,
      type: 'article',
    };
  }

  const slug = path === '/' ? 'home' : path.replace(/^\/|\/$/g, '');
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const page = await Page.findOne({ slug, status: 'published' }).lean();
  if (!page?.published) return null;
  const seo = page.published.seo || {};
  const title = seo.title || (slug === 'home' ? settings?.siteTitle : page.published.title);
  return {
    ...base,
    title: slug === 'home' && !seo.title ? title : template.replace('%s', title),
    description: seo.description || base.description,
    image: seo.image || base.image,
    canonical: seo.canonical || base.canonical,
    noindex: base.noindex || seo.noindex,
  };
}

const attr = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function renderHeadTags(meta) {
  const abs = (u) => (u && u.startsWith('/') ? siteUrl + u : u);
  const tags = [
    `<title>${attr(meta.title)}</title>`,
    `<meta name="description" content="${attr(meta.description)}" />`,
    `<link rel="canonical" href="${attr(abs(meta.canonical))}" />`,
    `<meta property="og:title" content="${attr(meta.title)}" />`,
    `<meta property="og:description" content="${attr(meta.description)}" />`,
    `<meta property="og:type" content="${meta.type || 'website'}" />`,
    `<meta property="og:url" content="${attr(abs(meta.canonical))}" />`,
    `<meta name="twitter:card" content="${meta.image ? 'summary_large_image' : 'summary'}" />`,
  ];
  if (meta.image) tags.push(`<meta property="og:image" content="${attr(abs(meta.image))}" />`);
  if (meta.noindex) tags.push('<meta name="robots" content="noindex, nofollow" />');
  if (meta.favicon) tags.push(`<link rel="icon" href="${attr(meta.favicon)}" />`);
  return tags.join('\n    ');
}
