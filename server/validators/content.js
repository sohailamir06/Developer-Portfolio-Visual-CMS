import { z } from 'zod';
import { mediaUrl, objectId, plainText, richText, safeUrl, seoSchema, slug } from '../utils/validation.js';
import { PAGE_TYPES } from '../models/Page.js';
import { ROLES } from '../models/User.js';
import { MESSAGE_STATUSES } from '../models/ContactMessage.js';
import { sectionsSchema } from '../sections/index.js';

const image = z
  .object({ url: mediaUrl.default(''), alt: plainText(300).default(''), caption: plainText(300).default('') })
  .default({});

const tags = z.array(plainText(60).min(1)).max(40).default([]);

// ---- Pages ----
export const pageCreateSchema = z.object({
  title: plainText(120).min(1, 'Title is required'),
  slug,
  pageType: z.enum(PAGE_TYPES).default('custom'),
  template: z.enum(['blank', 'standard']).default('standard'),
});

export const pageMetaSchema = z
  .object({
    slug: slug.optional(),
    pageType: z.enum(PAGE_TYPES).optional(),
  })
  .strict();

export const pageDraftSchema = z.object({
  title: plainText(120).min(1, 'Title is required'),
  seo: seoSchema,
  sections: sectionsSchema,
});

export const publishSchema = z.object({ note: plainText(200).default('') }).default({});

// ---- Projects ----
export const projectSchema = z.object({
  title: plainText(150).min(1, 'Title is required'),
  slug: slug.optional(),
  summary: plainText(500).default(''),
  content: richText.default(''),
  featuredImage: image,
  gallery: z.array(image.removeDefault()).max(30).default([]),
  technologies: tags,
  category: plainText(60).default(''),
  demoUrl: safeUrl.default(''),
  repoUrl: safeUrl.default(''),
  featured: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('draft'),
  order: z.coerce.number().int().min(0).optional(),
  seo: seoSchema,
});

// ---- Skills ----
export const skillSchema = z.object({
  name: plainText(80).min(1, 'Name is required'),
  category: plainText(60).min(1, 'Category is required').default('Other'),
  icon: z
    .string()
    .trim()
    .max(2048)
    .refine((v) => v === '' || /^[A-Z][A-Za-z0-9]*$/.test(v) || mediaUrl.safeParse(v).success, 'Use an icon name or an image URL')
    .default(''),
  proficiencyLabel: plainText(40).default(''),
  proficiency: z.union([z.null(), z.coerce.number().int().min(0).max(100)]).default(null),
  order: z.coerce.number().int().min(0).optional(),
  visible: z.boolean().default(true),
});

// ---- Experience ----
const date = z.coerce.date({ errorMap: () => ({ message: 'Enter a valid date' }) });

export const experienceSchema = z
  .object({
    company: plainText(150).min(1, 'Company is required'),
    companyUrl: safeUrl.default(''),
    position: plainText(150).min(1, 'Position is required'),
    location: plainText(120).default(''),
    employmentType: plainText(60).default(''),
    startDate: date,
    endDate: z.union([z.null(), z.literal('').transform(() => null), date]).default(null),
    current: z.boolean().default(false),
    description: richText.default(''),
    responsibilities: z.array(plainText(400).min(1)).max(30).default([]),
    technologies: tags,
    order: z.coerce.number().int().min(0).optional(),
    visible: z.boolean().default(true),
  })
  .refine((e) => e.current || !e.endDate || e.endDate >= e.startDate, {
    path: ['endDate'],
    message: 'End date must be after the start date',
  })
  .transform((e) => (e.current ? { ...e, endDate: null } : e));

export const reorderSchema = z.object({ ids: z.array(objectId).min(1).max(500) });

// ---- Navigation ----
const navItem = z.object({
  id: z.string().regex(/^[\w-]{1,40}$/),
  label: plainText(60).min(1, 'Label is required'),
  url: safeUrl.refine((v) => v !== '', 'URL is required'),
  newTab: z.boolean().default(false),
  parentId: z.string().regex(/^[\w-]{1,40}$/).nullable().default(null),
  order: z.coerce.number().int().min(0).default(0),
  visible: z.boolean().default(true),
});

const navItems = z
  .array(navItem)
  .max(50)
  .superRefine((items, ctx) => {
    const ids = new Set(items.map((i) => i.id));
    if (ids.size !== items.length) ctx.addIssue({ code: 'custom', message: 'Duplicate menu item id' });
    items.forEach((item, i) => {
      if (item.parentId && (!ids.has(item.parentId) || item.parentId === item.id)) {
        ctx.addIssue({ code: 'custom', path: [i, 'parentId'], message: 'Parent item does not exist' });
      }
      const parent = items.find((p) => p.id === item.parentId);
      if (parent?.parentId) ctx.addIssue({ code: 'custom', path: [i, 'parentId'], message: 'Only one level of dropdown nesting is supported' });
    });
  });

export const navigationSchema = z.object({ main: navItems.optional(), footer: navItems.optional() });

// ---- Media ----
export const mediaUpdateSchema = z.object({
  alt: plainText(300).optional(),
  caption: plainText(300).optional(),
});

export const mediaQuerySchema = z.object({
  q: plainText(100).optional(),
  type: z.enum(['image', 'document', 'all']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(40),
});

// ---- Contact ----
export const contactSchema = z.object({
  name: plainText(120).min(2, 'Please enter your name'),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address').max(254),
  subject: plainText(200).default(''),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(5000),
  website: z.string().max(200).optional(), // honeypot — humans leave it empty
});

export const messageUpdateSchema = z.object({ status: z.enum(MESSAGE_STATUSES) });

// ---- Users ----
const password = z.string().min(10, 'Password must be at least 10 characters').max(200);

export const userCreateSchema = z.object({
  name: plainText(120).min(1),
  email: z.string().trim().toLowerCase().email(),
  password,
  role: z.enum(ROLES).default('editor'),
});

export const userUpdateSchema = z.object({
  name: plainText(120).min(1).optional(),
  role: z.enum(ROLES).optional(),
  status: z.enum(['active', 'disabled']).optional(),
  password: password.optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required').max(200),
});

// ---- Redirects ----
export const redirectSchema = z.object({
  from: z
    .string()
    .trim()
    .regex(/^\/[^\s?#]*$/, 'Must be a site path starting with /')
    .refine((v) => !v.startsWith('/api') && !v.startsWith('/admin'), 'Cannot redirect /api or /admin paths'),
  to: safeUrl.refine((v) => v !== '', 'Destination is required'),
  statusCode: z.union([z.literal(301), z.literal(302)]).default(301),
});
