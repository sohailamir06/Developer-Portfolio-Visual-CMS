import mongoose from 'mongoose';
import Page from '../models/Page.js';
import Project from '../models/Project.js';
import Experience from '../models/Experience.js';
import Media from '../models/Media.js';
import WebsiteSettings from '../models/WebsiteSettings.js';

const PLACEHOLDER_NAME = '[Developer Name]';
const SAMPLE_TEXT = /Sample content|Sample entry|Sample project entry|\(replace me\)/i;

/**
 * Checklist of things a site owner should fix before sharing the portfolio.
 * Each check: { id, ok, level: 'warning' | 'info', title, detail, link, action }.
 */
export async function siteHealth() {
  const [settings, pages, projects, sampleExperience, imagesWithoutAlt] = await Promise.all([
    WebsiteSettings.findOne({ key: 'site' }).lean(),
    Page.find().select('slug pageType status hasUnpublishedChanges draft.title published').lean(),
    Project.find({ status: 'published' }).select('title summary content featuredImage seo role highlights').lean(),
    Experience.countDocuments({ visible: true, company: /\(replace me\)/i }),
    Media.countDocuments({ mimeType: /^image\//, alt: mongoose.trusted({ $in: ['', null] }) }),
  ]);

  const home = pages.find((p) => p.pageType === 'home');
  const hero = home?.published?.sections?.find((s) => s.type === 'hero' && s.visible !== false);
  const published = pages.filter((p) => p.status === 'published' && p.published);
  const sampleProjects = projects.filter((p) => SAMPLE_TEXT.test(`${p.title} ${p.summary} ${p.content}`) || /^Sample Project/i.test(p.title));
  const samplePages = published.filter((p) => SAMPLE_TEXT.test(JSON.stringify(p.published.sections)));
  const hasDefaultDescription = Boolean(settings?.seo?.defaultDescription);
  const pagesMissingDescription = hasDefaultDescription ? [] : published.filter((p) => !p.published.seo?.description);
  const projectsWithoutImage = projects.filter((p) => !p.featuredImage?.url);
  const draftChanges = pages.filter((p) => p.hasUnpublishedChanges);
  const hasEducation = published.some((p) => p.published.sections.some((sec) => sec.type === 'education' && sec.visible !== false && sec.data?.items?.length));
  const projectsWithoutStory = projects.filter((p) => !p.role && !(p.highlights || []).length);
  const aboutPage = pages.find((p) => p.pageType === 'about');
  const resumeLive = published.some((p) => p.pageType === 'resume');
  const homeLink = home ? `/admin/pages/${home._id}/edit` : '/admin/pages';
  const names = (list, key) => list.slice(0, 3).map((x) => x[key]).join(', ') + (list.length > 3 ? ` and ${list.length - 3} more` : '');

  const checks = [
    {
      id: 'placeholder-name',
      ok: Boolean(hero) && !String(hero.data?.name || '').includes(PLACEHOLDER_NAME),
      level: 'warning',
      title: 'Add your name to the home page',
      detail: hero ? `The hero still shows “${hero.data?.name || '(empty)'}”.` : 'The home page has no visible hero section.',
      link: homeLink,
      action: 'Edit home page',
    },
    {
      id: 'profile-image',
      ok: Boolean(hero?.data?.image?.url),
      level: 'info',
      title: 'Add a profile photo',
      detail: 'A photo in the hero section makes the portfolio more personal.',
      link: homeLink,
      action: 'Edit home page',
    },
    {
      id: 'education',
      ok: hasEducation,
      level: 'warning',
      title: 'Add your education',
      detail: 'Recruiters look for your degree, institution and graduation year first. Add an “Education” section to your About or Home page.',
      link: aboutPage ? `/admin/pages/${aboutPage._id}/edit` : homeLink,
      action: 'Add education',
    },
    {
      id: 'project-story',
      ok: projectsWithoutStory.length === 0,
      level: 'info',
      title: 'Explain your role in each project',
      detail: `Add “My role” and key highlights (e.g. “Built the REST API”) to: ${names(projectsWithoutStory, 'title')}.`,
      link: '/admin/projects',
      action: 'Open projects',
    },
    {
      id: 'contact-email',
      ok: Boolean(settings?.contact?.email),
      level: 'warning',
      title: 'Set your contact email',
      detail: 'Visitors can’t see how to reach you directly.',
      link: '/admin/settings',
      action: 'Open settings',
    },
    {
      id: 'social-links',
      ok: (settings?.social || []).length > 0,
      level: 'info',
      title: 'Add social links',
      detail: 'Link GitHub, LinkedIn or other profiles.',
      link: '/admin/settings',
      action: 'Open settings',
    },
    {
      id: 'sample-content',
      ok: sampleProjects.length === 0 && samplePages.length === 0 && sampleExperience === 0,
      level: 'warning',
      title: 'Replace sample content',
      detail: [
        sampleProjects.length && `${sampleProjects.length} sample project(s)`,
        samplePages.length && `sample text on: ${names(samplePages.map((p) => ({ t: p.published.title })), 't')}`,
        sampleExperience && `${sampleExperience} sample experience entr${sampleExperience === 1 ? 'y' : 'ies'}`,
      ]
        .filter(Boolean)
        .join(' · '),
      link: sampleProjects.length ? '/admin/projects' : samplePages.length ? '/admin/pages' : '/admin/experience',
      action: 'Review content',
    },
    {
      id: 'resume',
      ok: !resumeLive || Boolean(settings?.resume?.url),
      level: 'info',
      title: 'Upload your résumé',
      detail: 'The Résumé page is published but no PDF is linked.',
      link: '/admin/settings',
      action: 'Add résumé',
    },
    {
      id: 'image-alt',
      ok: imagesWithoutAlt === 0,
      level: 'warning',
      title: 'Describe your images',
      detail: `${imagesWithoutAlt} image(s) have no alternative text, which screen readers and search engines rely on.`,
      link: '/admin/media',
      action: 'Open media library',
    },
    {
      id: 'project-images',
      ok: projectsWithoutImage.length === 0,
      level: 'info',
      title: 'Add project images',
      detail: `Missing a featured image: ${names(projectsWithoutImage, 'title')}.`,
      link: '/admin/projects',
      action: 'Open projects',
    },
    {
      id: 'meta-descriptions',
      ok: pagesMissingDescription.length === 0,
      level: 'info',
      title: 'Write meta descriptions',
      detail: `No search description on: ${names(pagesMissingDescription.map((p) => ({ t: p.published.title })), 't')}.`,
      link: '/admin/seo',
      action: 'Open SEO',
    },
    {
      id: 'favicon',
      ok: Boolean(settings?.favicon),
      level: 'info',
      title: 'Upload a favicon',
      detail: 'Browsers show a blank icon in the tab.',
      link: '/admin/settings',
      action: 'Open settings',
    },
    {
      id: 'indexing',
      ok: settings?.seo?.allowIndexing !== false,
      level: 'warning',
      title: 'Search engines are blocked',
      detail: 'Indexing is turned off in SEO defaults, so the site won’t appear in search results.',
      link: '/admin/seo',
      action: 'Open SEO',
    },
    {
      id: 'unpublished',
      ok: draftChanges.length === 0,
      level: 'info',
      title: 'Publish your draft changes',
      detail: `Unpublished edits on: ${names(draftChanges.map((p) => ({ t: p.draft?.title || p.slug })), 't')}.`,
      link: '/admin/pages',
      action: 'Open pages',
    },
  ];

  const passed = checks.filter((c) => c.ok).length;
  return { score: Math.round((passed / checks.length) * 100), passed, total: checks.length, checks };
}
