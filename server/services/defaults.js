import Page from '../models/Page.js';
import Navigation from '../models/Navigation.js';
import WebsiteSettings from '../models/WebsiteSettings.js';
import { createSection } from '../sections/index.js';
import { defaultSettings } from '../validators/settings.js';

/*
 * Starter content for a fresh installation. Everything here is editable placeholder
 * text — it deliberately avoids inventing employers, education or achievements.
 */

const SAMPLE_NOTE = 'Sample content — replace this from the admin dashboard.';

export function defaultPages() {
  return [
    {
      slug: 'home',
      pageType: 'home',
      title: 'Home',
      seo: { title: '', description: 'Portfolio of a full-stack software developer.' },
      sections: [
        createSection('hero', {}),
        createSection('about', {
          heading: 'About Me',
          body: `<p>${SAMPLE_NOTE} Use this space to introduce yourself, the kind of software you enjoy building and the problems you like to solve.</p>`,
          strengths: ['Frontend development', 'Backend & APIs', 'Databases', 'Full-stack applications'],
          resumeButton: { label: 'More about me', url: '/about', style: 'outline', visible: true },
        }),
        createSection('skills', { eyebrow: 'Toolbox', layout: 'pills', showProficiency: false }),
        createSection('projects', {
          eyebrow: 'Selected work',
          heading: 'Featured Projects',
          mode: 'featured',
          limit: 6,
          viewAllButton: { label: 'View all projects', url: '/projects', style: 'outline', visible: true },
        }),
        createSection('cta', {
          body: 'I am open to new projects and opportunities. Reach out and let’s talk about what you are building.',
        }),
      ],
    },
    {
      slug: 'about',
      pageType: 'about',
      title: 'About',
      seo: { description: 'Background, strengths and approach.' },
      sections: [
        createSection('about', {
          eyebrow: 'About',
          heading: 'A little about me',
          body: `<p>${SAMPLE_NOTE}</p><p>Describe your background, how you approach building software, and what you are looking for next.</p>`,
          strengths: ['Clean, maintainable code', 'Responsive interfaces', 'REST API design', 'Collaboration'],
        }),
        createSection('education', {
          eyebrow: 'Education',
          items: [
            {
              institution: 'Your University (replace me)',
              degree: 'B.Sc. Computer Science',
              period: '2022 – 2026 (expected)',
              highlights: ['Relevant coursework: Data Structures, Databases, Web Development'],
            },
          ],
        }),
        createSection('certifications', {
          eyebrow: 'Credentials',
          items: [{ kind: 'certificate', title: 'Example certificate (replace me)', issuer: 'Issuing organisation', date: '2025' }],
        }),
        createSection('cta', {}),
      ],
    },
    {
      slug: 'projects',
      pageType: 'projects',
      title: 'Projects',
      seo: { description: 'A selection of software projects.' },
      sections: [
        createSection('projects', {
          eyebrow: 'Portfolio',
          heading: 'Projects',
          subheading: 'A selection of things I have designed and built.',
          mode: 'all',
          limit: 60,
          showFilters: true,
        }),
      ],
    },
    {
      slug: 'skills',
      pageType: 'skills',
      title: 'Skills',
      seo: { description: 'Languages, frameworks and tools.' },
      sections: [
        createSection('skills', {
          eyebrow: 'Skills',
          subheading: 'Technologies I work with across the stack.',
          layout: 'grid',
        }),
      ],
    },
    {
      slug: 'experience',
      pageType: 'experience',
      title: 'Experience',
      seo: { description: 'Work experience.' },
      sections: [createSection('experience', { eyebrow: 'Career', heading: 'Work Experience' })],
    },
    {
      slug: 'contact',
      pageType: 'contact',
      title: 'Contact',
      seo: { description: 'Get in touch.' },
      sections: [createSection('contact', { eyebrow: 'Contact' })],
    },
    {
      slug: 'resume',
      pageType: 'resume',
      title: 'Résumé',
      seo: { description: 'Résumé / CV.' },
      sections: [
        createSection('resume', {
          eyebrow: 'Résumé',
          body: '<p>Upload your résumé PDF in <strong>Admin → Media</strong>, then set its link in <strong>Admin → Settings → Résumé</strong> or on this section’s download button.</p>',
        }),
      ],
    },
  ];
}

export const defaultNavigation = () => ({
  main: [
    { id: 'nav-home', label: 'Home', url: '/', order: 0 },
    { id: 'nav-about', label: 'About', url: '/about', order: 1 },
    { id: 'nav-projects', label: 'Projects', url: '/projects', order: 2 },
    { id: 'nav-skills', label: 'Skills', url: '/skills', order: 3 },
    { id: 'nav-experience', label: 'Experience', url: '/experience', order: 4 },
    { id: 'nav-resume', label: 'Résumé', url: '/resume', order: 5 },
  ],
  footer: [
    { id: 'f-about', label: 'About', url: '/about', order: 0 },
    { id: 'f-projects', label: 'Projects', url: '/projects', order: 1 },
    { id: 'f-experience', label: 'Experience', url: '/experience', order: 2 },
    { id: 'f-contact', label: 'Contact', url: '/contact', order: 3 },
  ],
});

/** Idempotent: creates settings, navigation and core pages only when they are missing. */
export async function ensureDefaults() {
  if (!(await WebsiteSettings.exists({ key: 'site' }))) {
    const s = defaultSettings();
    s.footer.intro = 'Full-stack software developer building modern web applications.';
    await WebsiteSettings.create({ key: 'site', ...s });
  }

  const nav = defaultNavigation();
  for (const name of ['main', 'footer']) {
    if (!(await Navigation.exists({ name }))) await Navigation.create({ name, items: nav[name] });
  }

  if ((await Page.countDocuments()) === 0) {
    const now = new Date();
    await Page.insertMany(
      defaultPages().map(({ slug, pageType, title, seo, sections }) => {
        const content = { title, seo, sections };
        return {
          slug,
          pageType,
          draft: content,
          published: content,
          status: 'published',
          hasUnpublishedChanges: false,
          version: 1,
          publishedAt: now,
        };
      }),
    );
  }
}
