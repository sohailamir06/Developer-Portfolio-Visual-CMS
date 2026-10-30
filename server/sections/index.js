import crypto from 'node:crypto';
import { z } from 'zod';
import { mediaUrl, plainText, richText, safeUrl } from '../utils/validation.js';

/*
 * Single source of truth for page section types. Every field has a default, so a
 * partial payload is completed and an unknown key is stripped. The React client has a
 * matching renderer for each type in client/src/components/sections.
 */

const text = (max = 300, def = '') => plainText(max).default(def);
const rich = (def = '') => richText.default(def);

export const buttonSchema = z
  .object({
    label: text(80),
    url: safeUrl.default(''),
    newTab: z.boolean().default(false),
    style: z.enum(['primary', 'secondary', 'outline', 'ghost']).default('primary'),
    visible: z.boolean().default(true),
  })
  .default({});

export const imageSchema = z
  .object({
    url: mediaUrl.default(''),
    alt: text(300),
    caption: text(300),
    fit: z.enum(['cover', 'contain']).default('cover'),
    position: z.enum(['center', 'top', 'bottom', 'left', 'right']).default('center'),
    shape: z.enum(['rounded', 'circle', 'square']).default('rounded'),
  })
  .default({});

const button = (defaults = {}) => buttonSchema.removeDefault().default(defaults);

const header = {
  eyebrow: text(80),
  heading: text(200),
  subheading: text(500),
};

export const SECTION_TYPES = {
  hero: z.object({
    layout: z.enum(['split', 'centered']).default('split'),
    greeting: text(80, "Hi, I'm"),
    name: text(120, '[Developer Name]'),
    title: text(150, 'Full-Stack Software Developer'),
    intro: text(800, 'I build modern, scalable web applications and intuitive digital experiences using JavaScript, React, Node.js, and modern web technologies.'),
    image: imageSchema,
    primaryButton: button({ label: 'View Projects', url: '/projects', style: 'primary' }),
    secondaryButton: button({ label: 'Contact Me', url: '/contact', style: 'outline' }),
    githubUrl: safeUrl.default(''),
    linkedinUrl: safeUrl.default(''),
    showResume: z.boolean().default(false),
    resumeLabel: text(60, 'Download Résumé'),
    availability: z
      .object({ show: z.boolean().default(true), text: text(120, 'Available for new opportunities') })
      .default({}),
  }),

  about: z.object({
    ...header,
    heading: text(200, 'About Me'),
    body: rich('<p>Write a short professional biography here.</p>'),
    image: imageSchema,
    strengths: z.array(text(120)).max(20).default([]),
    yearsExperience: text(20),
    stats: z.array(z.object({ value: text(20), label: text(60) })).max(8).default([]),
    resumeButton: button({ label: 'Download Résumé', url: '', style: 'outline', visible: false }),
  }),

  skills: z.object({
    ...header,
    heading: text(200, 'Skills & Technologies'),
    layout: z.enum(['grid', 'list', 'pills']).default('grid'),
    showProficiency: z.boolean().default(true),
    categories: z.array(text(60)).max(30).default([]), // empty = all categories
  }),

  projects: z.object({
    ...header,
    heading: text(200, 'Projects'),
    mode: z.enum(['featured', 'all']).default('all'),
    limit: z.coerce.number().int().min(1).max(60).default(12),
    columns: z.enum(['2', '3']).default('3'),
    showFilters: z.boolean().default(false),
    viewAllButton: button({ label: 'View all projects', url: '/projects', style: 'outline', visible: false }),
  }),

  experience: z.object({
    ...header,
    heading: text(200, 'Experience'),
    showTechnologies: z.boolean().default(true),
    limit: z.coerce.number().int().min(0).max(50).default(0), // 0 = all
  }),

  stats: z.object({
    ...header,
    items: z
      .array(z.object({ value: text(20), label: text(80), description: text(200) }))
      .max(8)
      .default([]),
  }),

  cta: z.object({
    ...header,
    heading: text(200, "Let's build something together"),
    body: text(800),
    primaryButton: button({ label: 'Get in touch', url: '/contact', style: 'primary' }),
    secondaryButton: button({ label: '', url: '', style: 'outline', visible: false }),
  }),

  contact: z.object({
    ...header,
    heading: text(200, 'Get in Touch'),
    body: text(1000, 'Have a project in mind or want to talk about an opportunity? Send me a message.'),
    showEmail: z.boolean().default(true),
    showPhone: z.boolean().default(true),
    showSocial: z.boolean().default(true),
    showForm: z.boolean().default(true),
    submitLabel: text(40, 'Send Message'),
    successMessage: text(300, "Thanks! Your message has been sent. I'll get back to you soon."),
  }),

  textImage: z.object({
    ...header,
    body: rich(''),
    image: imageSchema,
    imagePosition: z.enum(['left', 'right']).default('right'),
    button: button({ label: '', url: '', visible: false }),
  }),

  testimonials: z.object({
    ...header,
    heading: text(200, 'Testimonials'),
    items: z
      .array(z.object({ quote: text(1000), name: text(120), role: text(150), avatar: imageSchema }))
      .max(20)
      .default([]),
  }),

  resume: z.object({
    ...header,
    heading: text(200, 'Résumé'),
    body: rich(''),
    downloadButton: button({ label: 'Download Résumé (PDF)', url: '', style: 'primary' }),
    showEmbed: z.boolean().default(true),
  }),

  // Student-focused: degrees, courses and results.
  education: z.object({
    ...header,
    heading: text(200, 'Education'),
    items: z
      .array(
        z.object({
          institution: text(150),
          degree: text(150),
          period: text(60), // free text, e.g. "2022 – 2026 (expected)"
          location: text(120),
          grade: text(60),
          description: text(800),
          highlights: z.array(text(200)).max(12).default([]),
          logo: imageSchema,
        }),
      )
      .max(15)
      .default([]),
  }),

  certifications: z.object({
    ...header,
    heading: text(200, 'Certifications & Achievements'),
    items: z
      .array(
        z.object({
          kind: z.enum(['certificate', 'award', 'achievement']).default('certificate'),
          title: text(150),
          issuer: text(150),
          date: text(40),
          credentialUrl: safeUrl.default(''),
          description: text(500),
        }),
      )
      .max(40)
      .default([]),
  }),
};

export const SECTION_LABELS = {
  hero: 'Hero',
  about: 'About',
  skills: 'Skills',
  projects: 'Project Grid',
  experience: 'Experience Timeline',
  stats: 'Statistics',
  cta: 'Call to Action',
  contact: 'Contact',
  textImage: 'Text & Image',
  testimonials: 'Testimonials',
  resume: 'Résumé',
  education: 'Education',
  certifications: 'Certifications & Achievements',
};

export const styleSchema = z
  .object({
    background: z.enum(['default', 'surface', 'primary', 'subtle']).default('default'),
    paddingY: z.enum(['sm', 'md', 'lg']).default('md'),
    align: z.enum(['left', 'center']).default('left'),
    width: z.enum(['narrow', 'normal', 'wide']).default('normal'),
    anchorId: z
      .string()
      .trim()
      .max(60)
      .regex(/^([a-z][a-z0-9-]*)?$/, 'Anchor must start with a letter: lowercase, numbers, hyphens')
      .default(''),
  })
  .default({});

export const newSectionId = () => `s_${crypto.randomBytes(6).toString('hex')}`;

const sectionSchema = z
  .object({
    id: z.string().regex(/^[\w-]{1,40}$/).optional(),
    type: z.enum(Object.keys(SECTION_TYPES)),
    visible: z.boolean().default(true),
    data: z.record(z.any()).default({}),
    style: z.record(z.any()).default({}),
  })
  .transform((s, ctx) => {
    const data = SECTION_TYPES[s.type].safeParse(s.data);
    const style = styleSchema.safeParse(s.style);
    for (const [result, key] of [[data, 'data'], [style, 'style']]) {
      if (!result.success) {
        for (const issue of result.error.issues) ctx.addIssue({ ...issue, path: [key, ...issue.path] });
      }
    }
    if (!data.success || !style.success) return z.NEVER;
    return { id: s.id || newSectionId(), type: s.type, visible: s.visible, data: data.data, style: style.data };
  });

export const sectionsSchema = z
  .array(sectionSchema)
  .max(40, 'A page can have at most 40 sections')
  .superRefine((sections, ctx) => {
    const seen = new Set();
    sections.forEach((s, i) => {
      if (seen.has(s.id)) ctx.addIssue({ code: 'custom', path: [i, 'id'], message: 'Duplicate section id' });
      seen.add(s.id);
    });
  });

export function createSection(type, data = {}, overrides = {}) {
  return sectionsSchema.parse([{ type, data, ...overrides }])[0];
}

export function sectionDefaults() {
  return Object.fromEntries(
    Object.keys(SECTION_TYPES).map((type) => [
      type,
      { label: SECTION_LABELS[type], data: SECTION_TYPES[type].parse({}), style: styleSchema.parse({}) },
    ]),
  );
}
